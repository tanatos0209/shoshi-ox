/* Pure last-write-wins merge for shoshi-ox cloud sync.
   No Firebase here so node --test can load it.
   Per question: newer answer log wins SRS fields. Logs are unioned.
   Filters, goals, and stats follow the newer bundle timestamp.
   Unknown fields (future memos and similar) are kept from both sides. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ShoshiSyncMerge = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SRS_KEYS = {
    understanding: 1, lastResult: 1, bookmarked: 1, nextReviewDate: 1,
    reps: 1, interval: 1, ease: 1, log: 1
  };
  var SKIP_TOP = {
    version: 1, progress: 1, stats: 1, ui: 1,
    view: 1, drill: 1, sheet: 1, historyOpen: 1, historyQuestionId: 1,
    toast: 1, settingsFrom: 1
  };

  function clone(v) {
    if (v == null || typeof v !== "object") return v;
    return JSON.parse(JSON.stringify(v));
  }
  function isPlain(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  function mergeUnknown(winnerVal, loserVal) {
    if (!isPlain(winnerVal)) return winnerVal == null ? clone(loserVal) : clone(winnerVal);
    if (!isPlain(loserVal)) return clone(winnerVal);
    var out = clone(loserVal);
    Object.keys(winnerVal).forEach(function (k) {
      out[k] = mergeUnknown(winnerVal[k], loserVal[k]);
    });
    return out;
  }
  function logKey(entry) {
    if (!entry || typeof entry !== "object") return "";
    return [entry.at || "", entry.picked || "", entry.correct ? "1" : "0", entry.random ? "1" : "0"].join("|");
  }
  function latestLogAt(progress) {
    var best = "";
    var log = progress && progress.log || [];
    for (var i = 0; i < log.length; i++) {
      var at = log[i] && log[i].at || "";
      if (at > best) best = at;
    }
    return best;
  }
  function prefer(primary, fallback) {
    var out = clone(primary) || {};
    Object.keys(fallback || {}).forEach(function (k) {
      var empty = out[k] == null || out[k] === "" || (k === "understanding" && !out.understanding);
      if (empty && fallback[k] != null && fallback[k] !== "") out[k] = clone(fallback[k]);
      else if (isPlain(out[k]) && isPlain(fallback[k])) out[k] = mergeUnknown(out[k], fallback[k]);
    });
    return out;
  }
  function unionLogs(older, newer) {
    var map = new Map();
    function take(list, asNewer) {
      (list || []).forEach(function (entry) {
        if (!entry || typeof entry !== "object") return;
        var key = logKey(entry);
        if (!key) return;
        var prev = map.get(key);
        if (!prev) { map.set(key, clone(entry)); return; }
        map.set(key, asNewer ? prefer(entry, prev) : prefer(prev, entry));
      });
    }
    take(older, false);
    take(newer, true);
    return Array.from(map.values()).sort(function (a, b) {
      var c = String(a.at || "").localeCompare(String(b.at || ""));
      return c || logKey(a).localeCompare(logKey(b));
    });
  }
  function mergeProgress(localP, remoteP, localAt, remoteAt) {
    var out = {};
    var ids = new Set([].concat(Object.keys(localP || {}), Object.keys(remoteP || {})));
    ids.forEach(function (id) {
      var local = localP && localP[id];
      var remote = remoteP && remoteP[id];
      if (!local) { out[id] = clone(remote); return; }
      if (!remote) { out[id] = clone(local); return; }
      var localLog = latestLogAt(local);
      var remoteLog = latestLogAt(remote);
      var winner;
      var loser;
      if (remoteLog > localLog) { winner = remote; loser = local; }
      else if (localLog > remoteLog) { winner = local; loser = remote; }
      else if ((remoteAt || 0) >= (localAt || 0)) { winner = remote; loser = local; }
      else { winner = local; loser = remote; }
      var merged = clone(winner);
      merged.log = unionLogs(loser.log, winner.log);
      Object.keys(loser).forEach(function (k) {
        if (SRS_KEYS[k]) return;
        if (isPlain(merged[k]) && isPlain(loser[k])) merged[k] = mergeUnknown(merged[k], loser[k]);
        else if ((merged[k] == null || merged[k] === "") && loser[k] != null && loser[k] !== "") merged[k] = clone(loser[k]);
      });
      out[id] = merged;
    });
    return out;
  }
  function mergePayload(localPayload, remotePayload, localAt, remoteAt) {
    var remoteNewer = (remoteAt || 0) >= (localAt || 0);
    var winner = (remoteNewer ? remotePayload : localPayload) || {};
    var loser = (remoteNewer ? localPayload : remotePayload) || {};
    var out = { version: 3 };
    out.stats = clone(winner.stats || loser.stats || {});
    out.ui = mergeUnknown(winner.ui || {}, loser.ui || {});
    out.progress = mergeProgress(
      localPayload && localPayload.progress,
      remotePayload && remotePayload.progress,
      localAt || 0,
      remoteAt || 0
    );
    var keys = new Set([].concat(Object.keys(winner), Object.keys(loser)));
    keys.forEach(function (k) {
      if (SKIP_TOP[k]) return;
      if (isPlain(winner[k]) && isPlain(loser[k])) out[k] = mergeUnknown(winner[k], loser[k]);
      else if (winner[k] != null) out[k] = clone(winner[k]);
      else out[k] = clone(loser[k]);
    });
    return out;
  }
  function mergeExtras(localExtras, remoteExtras) {
    var out = {};
    var keys = new Set([].concat(Object.keys(localExtras || {}), Object.keys(remoteExtras || {})));
    keys.forEach(function (k) {
      var local = localExtras && localExtras[k];
      var remote = remoteExtras && remoteExtras[k];
      if (!remote) { out[k] = clone(local); return; }
      if (!local) { out[k] = clone(remote); return; }
      out[k] = (remote.updatedAt || 0) >= (local.updatedAt || 0) ? clone(remote) : clone(local);
    });
    return out;
  }
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") {
      return "{" + Object.keys(v).sort().map(function (k) {
        return JSON.stringify(k) + ":" + stable(v[k]);
      }).join(",") + "}";
    }
    return JSON.stringify(v);
  }
  function sameData(a, b) {
    return stable({ payload: (a && a.payload) || {}, extras: (a && a.extras) || {} })
      === stable({ payload: (b && b.payload) || {}, extras: (b && b.extras) || {} });
  }
  function reconcile(localBundle, remoteBundle) {
    var localAt = localBundle && localBundle.updatedAt || 0;
    var remoteAt = remoteBundle && remoteBundle.updatedAt || 0;
    var payload = mergePayload(
      localBundle && localBundle.payload,
      remoteBundle && remoteBundle.payload,
      localAt,
      remoteAt
    );
    var extras = mergeExtras(localBundle && localBundle.extras, remoteBundle && remoteBundle.extras);
    var updatedAt = Math.max(localAt, remoteAt);
    var merged = { updatedAt: updatedAt, payload: payload, extras: extras };
    return {
      updatedAt: updatedAt,
      payload: payload,
      extras: extras,
      applyLocal: !sameData(localBundle, merged),
      writeBack: !sameData(remoteBundle, merged)
    };
  }

  return {
    clone: clone,
    mergePayload: mergePayload,
    mergeExtras: mergeExtras,
    reconcile: reconcile,
    unionLogs: unionLogs,
    stable: stable
  };
});
