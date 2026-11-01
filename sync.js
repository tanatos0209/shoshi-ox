/* Google sign-in and offline-first sync for durable ox state.
   Firestore path: users/{uid}/ox/state
   Local study data stays in localStorage. Cloud is last-write-wins. */
(function () {
  "use strict";

  var STORAGE_KEY = "shoshi-ox-v1";
  var META_KEY = "shoshi-ox-sync-meta";
  var EXTRA_PREFIX = "shoshi-ox-";
  var SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  var MAX_BYTES = 900000;
  var view = {
    configured: false,
    ready: false,
    signedIn: false,
    email: "",
    name: "",
    phase: "off",
    message: "この端末だけに保存しています。",
    updatedAt: 0
  };
  var auth = null;
  var db = null;
  var docRef = null;
  var currentUser = null;
  var unsub = null;
  var applying = false;
  var serverSeen = false;
  var timer = 0;
  var pushing = false;
  var pushAgain = false;
  var origSetItem = localStorage.setItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  function publish() {
    var ox = window.ShoshiOx;
    if (ox && ox.onSyncStatus) ox.onSyncStatus(snapshotView());
  }
  function snapshotView() {
    return {
      configured: view.configured,
      ready: view.ready,
      signedIn: view.signedIn,
      email: view.email,
      name: view.name,
      phase: view.phase,
      message: view.message,
      updatedAt: view.updatedAt
    };
  }
  function config() {
    return window.SHOSHI_FIREBASE_CONFIG || {};
  }
  function configured() {
    var c = config();
    return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
  }
  function readMeta() {
    try {
      var raw = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      if (!raw || typeof raw !== "object") raw = {};
      if (!raw.extrasClock || typeof raw.extrasClock !== "object") raw.extrasClock = {};
      return raw;
    } catch (e) {
      return { extrasClock: {} };
    }
  }
  function writeMeta(meta) {
    try { origSetItem(META_KEY, JSON.stringify(meta)); }
    catch (e) { console.warn("同期メタの保存に失敗しました", e); }
  }
  function deviceId() {
    var meta = readMeta();
    if (!meta.deviceId) {
      meta.deviceId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      writeMeta(meta);
    }
    return meta.deviceId;
  }
  function isExtraKey(key) {
    return !!key && key.indexOf(EXTRA_PREFIX) === 0 && key !== STORAGE_KEY && key !== META_KEY;
  }
  function jsonClone(v) {
    return JSON.parse(JSON.stringify(v == null ? {} : v));
  }
  function readExtras() {
    var clocks = readMeta().extrasClock || {};
    var out = {};
    var seen = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!isExtraKey(key)) continue;
      seen[key] = true;
      out[key] = { updatedAt: clocks[key] || 0, value: localStorage.getItem(key) };
    }
    Object.keys(clocks).forEach(function (key) {
      if (!isExtraKey(key) || seen[key]) return;
      out[key] = { updatedAt: clocks[key] || 0, value: null };
    });
    return out;
  }
  function localBundle() {
    var meta = readMeta();
    var payload = {};
    if (window.ShoshiOx && window.ShoshiOx.snapshot) payload = jsonClone(window.ShoshiOx.snapshot());
    return {
      updatedAt: meta.updatedAt || 0,
      deviceId: deviceId(),
      payload: payload,
      extras: readExtras()
    };
  }
  function clockFromExtras(extras) {
    var clocks = {};
    Object.keys(extras || {}).forEach(function (key) {
      if (!isExtraKey(key)) return;
      clocks[key] = extras[key] && extras[key].updatedAt || 0;
    });
    return clocks;
  }
  function applyExtras(extras) {
    applying = true;
    try {
      Object.keys(extras || {}).forEach(function (key) {
        if (!isExtraKey(key)) return;
        var item = extras[key] || {};
        try {
          if (item.value == null) origRemoveItem(key);
          else origSetItem(key, String(item.value));
        } catch (e) { console.warn("追加データの反映に失敗しました", key, e); }
      });
    } finally {
      applying = false;
    }
  }
  function savedLabel(ts) {
    if (!ts) return "同期済み";
    try {
      var text = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(new Date(ts));
      return "同期済み " + text;
    } catch (e) {
      return "同期済み";
    }
  }
  function byteLength(obj) {
    try { return new TextEncoder().encode(JSON.stringify(obj)).length; }
    catch (e) { return JSON.stringify(obj).length; }
  }
  function noteExtra(key) {
    if (applying || !isExtraKey(key)) return;
    var meta = readMeta();
    var now = Date.now();
    meta.extrasClock[key] = now;
    meta.updatedAt = now;
    meta.deviceId = meta.deviceId || deviceId();
    writeMeta(meta);
    schedulePush();
  }
  function installStorageHook() {
    localStorage.setItem = function (key, value) {
      origSetItem(key, value);
      noteExtra(key);
    };
    localStorage.removeItem = function (key) {
      origRemoveItem(key);
      noteExtra(key);
    };
  }
  function schedulePush() {
    if (!currentUser || !docRef || !serverSeen) return;
    clearTimeout(timer);
    timer = setTimeout(function () { push(); }, 700);
  }
  function noteLocalEdit() {
    if (applying) return;
    var meta = readMeta();
    meta.updatedAt = Date.now();
    meta.deviceId = meta.deviceId || deviceId();
    writeMeta(meta);
    view.updatedAt = meta.updatedAt;
    if (currentUser) {
      view.phase = "saving";
      view.message = "同期しています…";
      publish();
    }
    schedulePush();
  }
  function markOffline() {
    view.phase = "offline";
    view.message = "オフラインです。この端末の記録はそのままです。つながると同期します。";
    publish();
  }
  function markSaved(ts, extraNote) {
    view.phase = navigator.onLine ? "saved" : "offline";
    view.updatedAt = ts || view.updatedAt;
    view.message = extraNote || (navigator.onLine ? savedLabel(view.updatedAt) : "オフラインです。この端末の記録はそのままです。つながると同期します。");
    publish();
  }
  function applyMerged(merged) {
    var meta = readMeta();
    meta.updatedAt = merged.updatedAt || 0;
    meta.deviceId = meta.deviceId || deviceId();
    meta.extrasClock = clockFromExtras(merged.extras);
    writeMeta(meta);
    applyExtras(merged.extras);
    applying = true;
    try {
      if (window.ShoshiOx && window.ShoshiOx.apply) window.ShoshiOx.apply(merged.payload);
    } finally {
      applying = false;
    }
    view.updatedAt = meta.updatedAt;
  }
  function reconcileWith(remoteDoc) {
    var merge = window.ShoshiSyncMerge;
    if (!merge) return;
    var local = localBundle();
    if (!remoteDoc) {
      if (!serverSeen) { markOffline(); return; }
      if ((local.updatedAt || 0) > 0 || Object.keys(local.payload.progress || {}).length || Object.keys(local.extras).length) push();
      else markSaved(local.updatedAt);
      return;
    }
    var remote = {
      updatedAt: remoteDoc.updatedAt || 0,
      payload: remoteDoc.payload || {},
      extras: remoteDoc.extrasOmitted ? local.extras : (remoteDoc.extras || {})
    };
    var merged = merge.reconcile(local, remote);
    if (merged.applyLocal) applyMerged(merged);
    else if ((merged.updatedAt || 0) !== (local.updatedAt || 0)) {
      var meta = readMeta();
      meta.updatedAt = merged.updatedAt;
      writeMeta(meta);
    }
    if (merged.writeBack && serverSeen) push();
    else markSaved(merged.updatedAt || remote.updatedAt || local.updatedAt);
  }
  function onSnap(snap) {
    if (!snap.metadata.fromCache) serverSeen = true;
    if (!serverSeen && navigator.onLine) return;
    reconcileWith(snap.exists ? snap.data() : null);
  }
  function onSnapError(err) {
    console.warn("同期の受信に失敗しました", err);
    if (!navigator.onLine || (err && err.code === "unavailable")) { markOffline(); return; }
    view.phase = "error";
    view.message = "同期できませんでした。この端末の記録はそのままです。";
    publish();
  }
  async function writeOnce() {
    var bundle = localBundle();
    var body = {
      schema: 1,
      app: "shoshi-ox",
      updatedAt: bundle.updatedAt || Date.now(),
      deviceId: bundle.deviceId,
      payload: bundle.payload,
      extras: bundle.extras
    };
    if (byteLength(body) > MAX_BYTES) {
      var slim = {
        schema: body.schema,
        app: body.app,
        updatedAt: body.updatedAt,
        deviceId: body.deviceId,
        payload: body.payload,
        extras: {},
        extrasOmitted: true
      };
      if (byteLength(slim) > MAX_BYTES) {
        var error = new Error("too-large");
        error.code = "too-large";
        throw error;
      }
      await docRef.set(slim);
      markSaved(body.updatedAt, "学習記録は同期しました。追加データが大きいため、この端末にだけ残しています。");
      return;
    }
    await docRef.set(body);
    markSaved(body.updatedAt);
  }
  async function push() {
    if (!docRef || !currentUser || !serverSeen) return;
    if (pushing) { pushAgain = true; return; }
    pushing = true;
    view.phase = "saving";
    view.message = "同期しています…";
    publish();
    try {
      do {
        pushAgain = false;
        await writeOnce();
      } while (pushAgain);
    } catch (err) {
      console.warn("同期の送信に失敗しました", err);
      if (!navigator.onLine || (err && (err.code === "unavailable" || err.code === "failed-precondition"))) markOffline();
      else if (err && err.code === "too-large") {
        view.phase = "error";
        view.message = "データが大きすぎて同期できません。この端末には残しています。";
        publish();
      } else {
        view.phase = "error";
        view.message = "同期できませんでした。この端末の記録はそのままです。";
        publish();
      }
    } finally {
      pushing = false;
    }
  }
  function watchUser(user) {
    if (unsub) { unsub(); unsub = null; }
    serverSeen = false;
    currentUser = user || null;
    docRef = null;
    if (!user) {
      view.signedIn = false;
      view.email = "";
      view.name = "";
      view.phase = "signed-out";
      view.message = "ログインすると、同じGoogleアカウントの別の端末と学習記録が揃います。";
      publish();
      return;
    }
    view.signedIn = true;
    view.email = user.email || "";
    view.name = user.displayName || "";
    view.phase = "saving";
    view.message = "同期しています…";
    publish();
    docRef = db.collection("users").doc(user.uid).collection("ox").doc("state");
    unsub = docRef.onSnapshot(onSnap, onSnapError);
  }
  function authMessage(err) {
    var code = err && err.code || "";
    if (code === "auth/unauthorized-domain") return "このサイトはFirebaseの許可ドメインに入っていません。";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "";
    if (code === "auth/network-request-failed") return "オフラインのためログインできません。";
    if (code === "auth/operation-not-allowed") return "GoogleログインがFirebaseで有効になっていません。";
    return "ログインできませんでした。";
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(script);
    });
  }
  async function loadSdk() {
    await loadScript(SDK + "firebase-app-compat.js");
    await loadScript(SDK + "firebase-auth-compat.js");
    await loadScript(SDK + "firebase-firestore-compat.js");
  }
  async function signIn() {
    if (!auth) return;
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    view.phase = "saving";
    view.message = "ログインしています…";
    publish();
    try {
      await auth.signInWithPopup(provider);
    } catch (err) {
      var code = err && err.code || "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment" || code === "auth/cancelled-popup-request") {
        try { await auth.signInWithRedirect(provider); return; }
        catch (redirectErr) { err = redirectErr; }
      }
      var message = authMessage(err);
      if (message) {
        view.phase = "error";
        view.message = message;
      } else {
        view.phase = "signed-out";
        view.message = "ログインすると、同じGoogleアカウントの別の端末と学習記録が揃います。";
      }
      publish();
    }
  }
  async function signOut() {
    if (!auth) return;
    try { await auth.signOut(); }
    catch (err) {
      console.warn(err);
      view.phase = "error";
      view.message = "ログアウトできませんでした。";
      publish();
    }
  }
  async function start() {
    installStorageHook();
    deviceId();
    view.configured = configured();
    view.updatedAt = readMeta().updatedAt || 0;
    if (!view.configured) {
      view.phase = "off";
      view.message = "この端末だけに保存しています。";
      publish();
      return;
    }
    view.phase = "saving";
    view.message = "同期の準備をしています…";
    publish();
    try {
      await loadSdk();
    } catch (err) {
      console.warn(err);
      view.phase = "offline";
      view.message = "同期を読み込めません。この端末の記録はそのままです。";
      publish();
      return;
    }
    if (!window.firebase) {
      view.phase = "error";
      view.message = "同期を読み込めません。この端末の記録はそのままです。";
      publish();
      return;
    }
    firebase.initializeApp(config());
    auth = firebase.auth();
    db = firebase.firestore();
    try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); }
    catch (err) { console.warn(err); }
    try { await db.enablePersistence({ synchronizeTabs: true }); }
    catch (err) { console.warn("オフライン保存を開始できません", err && err.code); }
    try { await auth.getRedirectResult(); }
    catch (err) {
      var message = authMessage(err);
      if (message) {
        view.phase = "error";
        view.message = message;
        publish();
      }
    }
    view.ready = true;
    auth.onAuthStateChanged(watchUser);
    window.addEventListener("online", function () {
      if (!currentUser || !docRef) return;
      if (serverSeen) push();
      else docRef.get().then(onSnap).catch(onSnapError);
    });
    window.addEventListener("offline", function () { if (currentUser) markOffline(); });
  }

  window.ShoshiSync = {
    noteLocalEdit: noteLocalEdit,
    signIn: function () { signIn(); },
    signOut: function () { signOut(); },
    syncNow: function () { if (currentUser) push(); },
    view: snapshotView
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { start(); });
  else start();
})();
