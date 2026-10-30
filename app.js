"use strict";
/* AI択一対策 — localStorage key: shoshi-ox-v1
   Page tint follows ui.tintQuestionId only.
   setMode-style view changes (home, sheet, 履歴) must not change that id.
   It updates when the shown question id changes, or when that question's rating is tapped.
   弱点/結果-style lists and the home screen keep the last question's tint. */

const STORAGE_KEY = "shoshi-ox-v1";
const GOAL = 80;

const SUBJECTS = [
  { id: "minpo", name: "民法", fields: ["総則", "物権", "担保物権", "債権", "親族・相続"] },
  { id: "fudosan", name: "不動産登記法", fields: ["総論", "所有権", "抵当権・担保権", "その他の権利", "登録免許税・信託・その他"] },
  { id: "kaisha", name: "会社法・商業登記法", fields: ["設立・株式・新株予約権", "機関・役員", "計算・定款変更・組織再編・解散", "持分会社・特例有限・外国会社", "商登法総論・商法"] },
  { id: "minor", name: "マイナー科目", fields: ["憲法", "刑法", "民事訴訟法", "民事執行法", "民事保全法", "司法書士法", "供託法"] },
];

const QUESTIONS = [
  { id: "001", subject: "民法", category: "総則",
    questionHtml: "未成年者が法定代理人の同意を得ないで贈与を受けた場合において、その贈与契約が<span class=\"hl\">負担付のものでない</span>ときは、その未成年者は、その贈与契約を<span class=\"hl\">取り消すことはできない</span>。",
    answer: true,
    explanationHtml: "この肢は<strong>正しい</strong>です。負担のない贈与を受けた未成年者は、その契約を取り消せません。単に権利を得るだけの行為は、法定代理人の同意がなくてもできます。たとえば、知人からお年玉として現金だけもらった場合です。返す義務はないので、同意がなくても取り消せません。（民法5条1項ただし書）",
    trapHtml: "負担付の贈与です。お礼に毎週草むしりをする約束のように義務を負う贈与は、同意がなければ取り消せます。" },
  { id: "002", subject: "民法", category: "総則",
    questionHtml: "養子である未成年者が<span class=\"hl\">実親の同意</span>を得て法律行為をしたときは、その未成年者の<span class=\"hl\">養親は、その法律行為を取り消すことはできない</span>。",
    answer: false,
    explanationHtml: "この肢は<strong>誤り</strong>です。養親は、その法律行為を取り消せます。養子が服するのは養親の親権であり、実親の同意があっても養親の取消しは防げません。たとえば、養子が実親の「いいよ」だけでスマホの分割契約をしても、養親は取り消せます。（民法818条2項）",
    trapHtml: "同意した親が親権者だと思い込む点です。養子の親権者は養親です。" },
  { id: "003", subject: "民法", category: "総則",
    questionHtml: "法定代理人が<span class=\"hl\">目的を定めないで</span>処分を許した財産は、未成年者が<span class=\"hl\">自由に処分</span>することができる。",
    answer: true,
    explanationHtml: "この肢は<strong>正しい</strong>です。未成年者は、その財産を自由に処分できます。目的を定めないで処分を許した財産は、使い道の制限がありません。たとえば、親が「この1万円は好きに使って」と渡したお金で、文房具でもお菓子でも買える場合です。（民法5条3項）",
    trapHtml: "目的を定めて許した財産です。「このお金は参考書だけ」と定められたお金は、その範囲に限られます。" },
  { id: "004", subject: "民法", category: "総則",
    questionHtml: "未成年者が<span class=\"hl\">特定の営業</span>について法定代理人の許可を受けた場合には、その営業に関する法律行為については、<span class=\"hl\">行為能力の制限を理由として取り消すことができない</span>。",
    answer: true,
    explanationHtml: "この肢は<strong>正しい</strong>です。許可を受けた営業についての契約は、未成年を理由に取り消せません。その営業では、成年者と同じ行為能力があります。たとえば、新聞販売の許可を受けた未成年者が、その配達用の自転車を店で買う場合です。（民法6条1項）",
    trapHtml: "許可の範囲です。別の店を出す契約や、遊びに使うゲーム機の購入には及びません。" },
  { id: "005", subject: "民法", category: "総則",
    questionHtml: "陶芸教室を営む成年のAは、中学3年の生徒Bに、教室で使う電動ろくろを売る契約を結んだ。Aは、Bが未成年者であること以外に取り消しの理由となる事情がない場合でも、<span class=\"hl\">自分のしたその売買の意思表示を取り消すことができる</span>。",
    answer: false,
    explanationHtml: "この肢は<strong>誤り</strong>です。Aは、自分の売買を取り消せません。取消しで守られるのは未成年者の側です。相手が未成年というだけでは、成年の表意者は取り消せません。たとえば、文具店の成年の店員が中学生にノートを売ったあと、相手が未成年だというだけではその売買を取り消せない場合です。（民法5条1項）",
    trapHtml: "取消権が相手方の成年者にもあると思い込む点です。" },
  { id: "006", subject: "民法", category: "総則",
    questionHtml: "17歳のAは、法定代理人の同意を得ないで、楽器店主のBから中古の電子ピアノを分割払いで買った。Aが18歳になった後、Bが<span class=\"hl\">40日の期間を定めて</span>その売買を追認するかどうか確答するよう催告し、Aがその期間内に確答を発しなかったときは、Aはその売買を<span class=\"hl\">追認したものとみなされる</span>。",
    answer: true,
    explanationHtml: "この肢は<strong>正しい</strong>です。Aは、その売買を追認したものとみなされます。成年になった本人に1か月以上の期間を定めて確答を求め、期間内に返事がなければ追認が擬制されます。40日は1か月以上です。たとえば、未成年のときに買った中古スマホについて、成年後に店から「40日以内に追認するか返事を」と求められ、黙っていたら追認したことになる場合です。（民法20条1項）",
    trapHtml: "返事がないと取り消したものとみなされる、という点です。擬制されるのは追認です。" },
  { id: "007", subject: "民法", category: "総則",
    questionHtml: "16歳の高校生Aは、スポーツ用品店で競技用ヘルメットを買うとき、店員から年齢を尋ねられず、<span class=\"hl\">自分からも未成年であるとは言わなかった</span>。成年者であるとの発言や、他人の身分証明書の提示はしていない。Aは、法定代理人の同意がないこの売買を、未成年であることを理由に<span class=\"hl\">取り消すことができる</span>。",
    answer: true,
    explanationHtml: "この肢は<strong>正しい</strong>です。Aは、未成年であることを理由に取り消せます。年齢を黙っていただけでは、成年者だと信じさせる詐術にはなりません。たとえば、コンビニでおにぎりを買うとき年齢を聞かれず、自分からも言わなかった未成年者が、その売買を取り消せる場合です。（民法21条）",
    trapHtml: "身分証を見せたり、自ら成年だと告げたりした場合です。そのときは詐術になり、取り消せなくなることがあります。" },
  { id: "008", subject: "民法", category: "総則",
    questionHtml: "カフェを営むAは、来店した17歳のBについて、話し方や服装から<span class=\"hl\">過失なく成年者だと信じ</span>、飲食代金の契約をした。Bは、成年者だと告げることも、年齢を示す書類を見せることもしていない。この場合、Bは法定代理人の同意がないその契約を、未成年であることを理由に<span class=\"hl\">取り消すことができない</span>。",
    answer: false,
    explanationHtml: "この肢は<strong>誤り</strong>です。Bは、未成年であることを理由に取り消せます。相手が過失なく成年者と信じただけでは、取消しは止まりません。詐術がない限り、未成年者は取り消せます。たとえば、携帯ショップの店員が服装から成年だと信じても、客が年齢を偽っていなければ、未成年の客は契約を取り消せる場合です。（民法21条）",
    trapHtml: "相手の善意・無過失があれば常に取り消せない、という理解です。必要なのは詐術の有無です。" },
];

const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

function emptyStore() {
  return {
    version: 3,
    progress: {},
    stats: { streakDays: 0, todayCount: 0, todayIds: [], dailyGoal: GOAL, lastDate: "" },
    ui: { tintQuestionId: null, wrongOnly: false, bookmarksOnly: false, reviewOnly: false, freshOnly: false },
    drill: null,
    view: "home",
    sheet: null,
    historyOpen: false,
  };
}
function dayKey(d) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function todayKey() { return dayKey(new Date()); }
function migrateLevel(n, version) {
  n = Number(n);
  if (version >= 2) return n >= 1 && n <= 3 ? n : 0;
  if (n === 5) return 3;
  if (n === 4 || n === 3) return 2;
  if (n === 2 || n === 1) return 1;
  return 0;
}
function blankProgress() {
  return { understanding: 0, lastResult: null, bookmarked: false, nextReviewDate: null, reps: 0, interval: 0, ease: 2.5, log: [] };
}
function migrate(raw) {
  const version = raw.version || 1;
  const progress = {};
  const oldU = raw.understanding || {};
  const oldH = raw.history || {};
  const ids = new Set([...Object.keys(oldU), ...Object.keys(oldH), ...Object.keys(raw.progress || {})]);
  ids.forEach(id => {
    const prev = raw.progress && raw.progress[id] ? raw.progress[id] : {};
    const log = prev.log || oldH[id] || [];
    const last = log[log.length - 1];
    const understanding = prev.understanding || migrateLevel(oldU[id], version);
    progress[id] = Object.assign(blankProgress(), prev, {
      understanding: understanding || 0,
      lastResult: prev.lastResult != null ? prev.lastResult : (last ? !!last.correct : null),
      bookmarked: !!prev.bookmarked,
      log,
    });
  });
  const ui = Object.assign({ tintQuestionId: null, wrongOnly: false, bookmarksOnly: false, reviewOnly: false, freshOnly: false }, raw.ui || {});
  delete ui.mode;
  const stats = Object.assign({ streakDays: 0, todayCount: 0, todayIds: [], dailyGoal: GOAL, lastDate: "" }, raw.stats || {});
  recomputeToday(stats, progress, false);
  return {
    version: 3,
    progress,
    stats,
    ui,
    drill: raw.version >= 3 ? raw.drill || null : null,
    view: raw.version >= 3 && raw.view ? raw.view : "home",
    sheet: null,
    historyOpen: false,
  };
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn("履歴の読み込みに失敗しました", e);
    return emptyStore();
  }
}
let store = load();
{
  let rawCount = null;
  try { rawCount = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").stats.todayCount; }
  catch (e) { rawCount = null; }
  recomputeToday(store.stats, store.progress, false);
  if (rawCount !== store.stats.todayCount) save();
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch (e) { console.warn("履歴の保存に失敗しました", e); }
}
function prog(id) { return store.progress[id] || blankProgress(); }
function ensure(id) {
  if (!store.progress[id]) store.progress[id] = blankProgress();
  return store.progress[id];
}

function qsIn(subject, category) {
  return QUESTIONS.filter(q => (!subject || q.subject === subject) && (!category || q.category === category));
}
function isNew(id) {
  const p = store.progress[id];
  return !p || p.lastResult == null;
}
function needsReview(id) {
  const p = store.progress[id];
  if (!p || p.lastResult == null) return false;
  if (p.lastResult === false) return true;
  return !!(p.nextReviewDate && p.nextReviewDate.slice(0, 10) <= todayKey());
}
function masterRate(list) {
  if (!list.length) return 0;
  const n = list.filter(q => prog(q.id).understanding === 3).length;
  return Math.round(n / list.length * 100);
}
function counts(list) {
  let review = 0, fresh = 0;
  list.forEach(q => {
    if (isNew(q.id)) fresh++;
    else if (needsReview(q.id)) review++;
  });
  return { review, fresh };
}
function homeFiltersOn() {
  const ui = store.ui || {};
  return !!(ui.wrongOnly || ui.bookmarksOnly || ui.reviewOnly || ui.freshOnly);
}
function matchesHomeFilter(q) {
  const ui = store.ui || {};
  const p = prog(q.id);
  if (ui.wrongOnly && p.lastResult === false) return true;
  if (ui.bookmarksOnly && p.bookmarked) return true;
  if (ui.reviewOnly && needsReview(q.id)) return true;
  if (ui.freshOnly && isNew(q.id)) return true;
  return false;
}
/* On chips are a union. All off leaves the list unfiltered. */
function applyHomeFilters(list) {
  if (!homeFiltersOn()) return list.slice();
  return list.filter(matchesHomeFilter);
}
function todayQueue() {
  const base = applyHomeFilters(QUESTIONS);
  const review = [];
  const fresh = [];
  const rest = [];
  base.forEach(q => {
    if (needsReview(q.id)) review.push(q);
    else if (isNew(q.id)) fresh.push(q);
    else rest.push(q);
  });
  if (!homeFiltersOn()) return review.concat(fresh);
  return review.concat(fresh, rest);
}

function localDay(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dayKey(d);
}
function answeredIdsOn(progress, day) {
  const ids = [];
  Object.entries(progress || {}).forEach(([id, p]) => {
    if (!QMAP[id]) return;
    // Random drills are excluded. A repeat of the same question the same day does not add another.
    const hit = (p.log || []).some(e => e && !e.random && localDay(e.at) === day);
    if (hit && !ids.includes(id)) ids.push(id);
  });
  return ids;
}
const RANDOM_CAP = 100;
function randomAnsweredToday() {
  const day = todayKey();
  let n = 0;
  Object.values(store.progress).forEach(p => {
    (p.log || []).forEach(e => {
      if (e && e.random && localDay(e.at) === day) n++;
    });
  });
  return n;
}
function recomputeToday(stats, progress, persist) {
  const ids = answeredIdsOn(progress, todayKey());
  const count = Math.min(ids.length, QUESTIONS.length);
  const prevIds = Array.isArray(stats.todayIds) ? stats.todayIds.join(",") : "";
  const changed = stats.todayCount !== count || prevIds !== ids.join(",");
  stats.todayIds = ids;
  stats.todayCount = count;
  if (persist && changed) save();
  return count;
}
function stampToday(id) {
  const t = todayKey();
  const s = store.stats;
  if (s.lastDate !== t) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    s.streakDays = s.lastDate === dayKey(y) ? (s.streakDays || 0) + 1 : 1;
    s.lastDate = t;
  }
  if (QMAP[id]) recomputeToday(s, store.progress, false);
}
function shownToday() {
  return recomputeToday(store.stats, store.progress, true);
}
function schedule(id, understanding) {
  const p = ensure(id);
  if (!p.ease) p.ease = 2.5;
  if (understanding === 1) {
    p.reps = 0;
    p.interval = 1;
    p.ease = Math.max(1.3, (p.ease || 2.5) - 0.2);
  } else {
    p.reps = (p.reps || 0) + 1;
    if (p.reps === 1) p.interval = 1;
    else if (p.reps === 2) p.interval = understanding === 3 ? 6 : 3;
    else p.interval = Math.max(1, Math.round((p.interval || 1) * p.ease));
    if (understanding === 3) p.ease = Math.min(3, p.ease + 0.1);
  }
  const d = new Date();
  d.setDate(d.getDate() + p.interval);
  p.nextReviewDate = d.toISOString();
}

/* Tint id changes only when the question id changes or that question is rated. */
function noteQuestion(id) {
  if (!id) return;
  if (!store.ui) store.ui = {};
  store.ui.tintQuestionId = id;
}
const TINT_PAGE = { 3: "#082a16", 2: "#10202c", 1: "#30080e" };
function ratingOf(id) {
  const n = Number(store.progress[id] && store.progress[id].understanding);
  return n >= 1 && n <= 3 ? n : 0;
}
function applyTint() {
  const n = ratingOf(store.ui && store.ui.tintQuestionId);
  for (let i = 1; i <= 3; i++) {
    const on = n === i;
    document.documentElement.classList.toggle("tint-" + i, on);
    document.body.classList.toggle("tint-" + i, on);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", n ? TINT_PAGE[n] : "#0D231A");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const app = document.getElementById("app");

function bar(pct) {
  return `<div class="bar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
}
function iconGear() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>`;
}
function iconUser() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19"/></svg>`;
}

function renderHome() {
  const all = counts(QUESTIONS);
  const goal = store.stats.dailyGoal || GOAL;
  const pct = Math.round(Math.min(100, shownToday() / goal * 100));
  const cards = SUBJECTS.map(s => {
    const list = qsIn(s.name);
    const rate = masterRate(list);
    return `<button class="subj" type="button" data-act="open-subject" data-id="${s.id}">
      <b>${esc(s.name)}</b>
      ${bar(rate)}
      <span class="meta-line">● マスター率: ${rate}%${list.length ? "" : " · 0問"}</span>
    </button>`;
  }).join("");
  const marks = Object.values(store.progress).filter(p => p.bookmarked).length;
  app.innerHTML = `<div class="screen home">
    <header class="topbar">
      <div class="brand-lock"><img src="icon-192.png" width="40" height="40" alt=""><h1>司法書士 AI択一対策</h1></div>
      <button class="icon-btn" type="button" aria-label="設定" data-act="open-settings">${iconGear()}</button>
      <button class="icon-btn" type="button" aria-label="プロフィール" data-act="noop">${iconUser()}</button>
    </header>
    <div class="scroll">
      <div class="summary">
        <p class="streak">連続 ${store.stats.streakDays || 0} 日</p>
        <p class="goal">今日 ${shownToday()}問 <span>（目標 ${goal}問）</span></p>
        ${bar(pct)}
      </div>
      <button class="cta" type="button" data-act="start-today">▶ 今日の学習を開始</button>
      ${store.toast ? `<p class="toast">${esc(store.toast)}</p>` : ""}
      <div class="grid">${cards}</div>
    </div>
    <div class="filters">
      <button class="chip ${store.ui.reviewOnly ? "on" : ""}" type="button" data-act="toggle-review"><span class="glyph" aria-hidden="true">🔄</span>復習待ち (${all.review})</button>
      <button class="chip ${store.ui.freshOnly ? "on" : ""}" type="button" data-act="toggle-fresh"><span class="glyph" aria-hidden="true">⬜</span>未解答 (${all.fresh})</button>
      <button class="chip ${store.ui.bookmarksOnly ? "on" : ""}" type="button" data-act="toggle-marks"><img class="fusen" src="fusen-icon.png" alt="" width="28" height="16">付箋 (${marks})</button>
      <button class="chip ${store.ui.wrongOnly ? "on" : ""}" type="button" data-act="toggle-wrong"><span class="glyph" aria-hidden="true">❌</span>誤答のみ</button>
      <button class="random-btn" type="button" data-act="start-random"><img src="random-vortex.png" alt="" width="32" height="48"><span>ランダム</span></button>
    </div>
  </div>` + sheetHtml();
}
function sheetHtml() {
  if (!store.sheet) return "";
  const s = SUBJECTS.find(x => x.id === store.sheet);
  if (!s) return "";
  const list = qsIn(s.name);
  const c = counts(list);
  const rows = s.fields.map(f => {
    const fl = qsIn(s.name, f);
    const rate = masterRate(fl);
    return `<button class="field" type="button" data-act="start-field" data-subject="${esc(s.name)}" data-field="${esc(f)}" ${fl.length ? "" : "disabled"}>
      <span class="row"><span>${esc(f)}</span><small>${fl.length}問</small></span>
      ${bar(rate)}
      <small>マスター率: ${rate}%</small>
    </button>`;
  }).join("");
  return `<div class="backdrop" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-label="${esc(s.name)}">
      <div class="sheet-h"><h2>${esc(s.name)}（全${s.fields.length}科目）</h2><button type="button" data-act="close-sheet" aria-label="閉じる">✕</button></div>
      <button class="cta" type="button" data-act="start-subject" data-subject="${esc(s.name)}" ${list.length ? "" : "disabled"}>▶ ${esc(s.name)}をまとめて開始</button>
      <p class="cta-sub">復習待ち: ${c.review}問 / 未解答: ${c.fresh}問</p>
      ${rows}
    </div>`;
}

function renderQuiz() {
  const d = store.drill;
  const q = QMAP[d.ids[d.index]];
  if (!q) { store.view = "home"; store.drill = null; save(); renderHome(); applyTint(); return; }
  const p = prog(q.id);
  const revealed = !!d.revealed;
  const mark = { true: "○", false: "✕" };
  const yours = d.picked ? "○" : "✕";
  const head = d.correct ? "正解です。" : "不正解です。";
  const body = revealed ? `<div class="explain">
      <h3 class="${d.correct ? "ok" : "ng"}">${head}</h3>
      <p class="judge">あなたの解答：${yours} / 正解：${mark[q.answer]}　⏱ ${d.seconds}s</p>
      <p>${q.explanationHtml}</p>
      <div class="trap"><div class="pill">▲ ひっかけ注意</div><p>${q.trapHtml}</p></div>
    </div>` : "";
  const actions = revealed ? `<div class="rates">
      <button type="button" class="g" data-act="rate" data-n="3"><span class="n">3</span><span class="t">すぐ解ける</span></button>
      <button type="button" class="b" data-act="rate" data-n="2"><span class="n">2</span><span class="t">ふつう</span></button>
      <button type="button" class="r" data-act="rate" data-n="1"><span class="n">1</span><span class="t">わからない</span></button>
    </div>
    <p class="hint">タップすると記録して、次の問題へ進みます。復習の間隔は自動で決まります。</p>`
    : `<div class="ox">
      <button type="button" class="o" data-act="pick" data-val="1" aria-label="正しい">○</button>
      <button type="button" class="x" data-act="pick" data-val="0" aria-label="誤り">✕</button>
    </div>`;
  app.innerHTML = `<div class="screen quiz">
    <header class="qnav">
      <button type="button" data-act="quiz-back">← 戻る</button>
      <h2>${esc(q.subject)}・${esc(q.category)}</h2>
      <button type="button" data-act="quiz-history">📊 履歴</button>
    </header>
    <div class="qmeta">
      <div class="qstep">
        ${d.index > 0 ? `<button type="button" data-act="quiz-prev" aria-label="前の問">←</button>` : `<span class="qstep-gap" aria-hidden="true"></span>`}
        <span>問 ${esc(q.id)}　${d.index + 1}/${d.ids.length}</span>
        ${d.index < d.ids.length - 1 ? `<button type="button" data-act="quiz-next" aria-label="次の問">→</button>` : `<span class="qstep-gap" aria-hidden="true"></span>`}
      </div>
      <span class="sp"></span>
      ${d.random ? "" : `<select data-act="scope" aria-label="出題範囲">
        <option value="all" ${d.scope === "all" ? "selected" : ""}>全問</option>
        <option value="review" ${d.scope === "review" ? "selected" : ""}>復習待ち</option>
        <option value="wrong" ${d.scope === "wrong" ? "selected" : ""}>誤答のみ</option>
      </select>`}
      <button type="button" class="mark ${p.bookmarked ? "on" : ""}" data-act="bookmark" aria-label="${p.bookmarked ? "付箋を外す" : "付箋を付ける"}" aria-pressed="${p.bookmarked ? "true" : "false"}"><img class="fusen" src="fusen-icon.png" alt="" width="30" height="18"></button>
    </div>
    <div class="qbody ${revealed ? "revealed" : ""}">
      <p class="stem">${q.questionHtml}</p>
      ${body}
    </div>
    ${actions}
  </div>`;
  if (!revealed && !d.startedAt) d.startedAt = Date.now();
}

function renderHistory() {
  const rows = QUESTIONS.filter(q => store.progress[q.id] && store.progress[q.id].lastResult != null).map(q => {
    const p = prog(q.id);
    const mark = p.lastResult ? "○" : "✕";
    const u = p.understanding ? `理解度${p.understanding}` : "理解度—";
    return `<div class="hist-item"><b>問 ${esc(q.id)} ${mark}　${u}</b><span>${esc(q.subject)}・${esc(q.category)}</span></div>`;
  }).join("") || `<p class="cta-sub">まだ記録はありません。</p>`;
  app.innerHTML = `<div class="screen">
    <header class="qnav">
      <button type="button" data-act="history-back">← 戻る</button>
      <h2>履歴・結果</h2>
      <span></span>
    </header>
    <div class="scroll">
      <p class="streak">連続 ${store.stats.streakDays || 0} 日　今日 ${shownToday()}問（目標 ${store.stats.dailyGoal || GOAL}問）</p>
      ${rows}
    </div>
  </div>`;
}

function renderSettings() {
  const goal = store.stats.dailyGoal || GOAL;
  app.innerHTML = `<div class="screen">
    <header class="qnav">
      <button type="button" data-act="settings-back">← 戻る</button>
      <h2>設定</h2>
      <span></span>
    </header>
    <div class="scroll">
      <label class="set-label" for="daily-goal">1日の目標問数</label>
      <input id="daily-goal" class="set-input" type="number" inputmode="numeric" min="1" max="999" step="1" value="${goal}" data-act="goal" aria-describedby="goal-note">
      <p id="goal-note" class="set-note">自分で決められます。<br>試験の決まりではありません。</p>
      <p class="set-preview">ホームの表示は<br><span class="nowrap">今日 <span class="set-n">${shownToday()}</span>問（目標 <span class="set-g">${goal}</span>問）</span>です。</p>
      <p class="set-note">その日に初めて解いた問題だけを数えます。<br>同じ問題の再解答は入りません。<br>ランダムで解いた問題も入りません。</p>
      <button class="danger" type="button" data-act="reset-data">学習データを消去</button>
      <p class="set-note">解答・理解度・付箋・復習予定を消します。<br>目標問数は残します。</p>
      ${store.toast ? `<p class="toast">${esc(store.toast)}</p>` : ""}
    </div>
  </div>`;
}
function render() {
  recomputeToday(store.stats, store.progress, true);
  const quiz = store.view === "quiz" && !!store.drill;
  const home = !quiz && store.view !== "settings" && store.view !== "history";
  document.documentElement.classList.toggle("quiz-on", quiz);
  document.body.classList.toggle("quiz-on", quiz);
  app.classList.toggle("quiz-on", quiz);
  document.documentElement.classList.toggle("home-on", home);
  document.body.classList.toggle("home-on", home);
  app.classList.toggle("home-on", home);
  if (store.view === "settings") renderSettings();
  else if (store.view === "quiz" && store.drill) renderQuiz();
  else if (store.view === "history") renderHistory();
  else renderHome();
  applyTint();
}

function startDrill(ids, title, opts) {
  const unique = [...new Set(ids)];
  if (!unique.length) {
    store.toast = "該当する問題はまだありません。";
    store.view = "home";
    store.sheet = null;
    save(); render();
    return;
  }
  store.toast = "";
  store.drill = { ids: unique, index: 0, title, scope: "all", random: !!(opts && opts.random), revealed: false, startedAt: Date.now(), picked: null, correct: null, seconds: 0, seen: {} };
  store.view = "quiz";
  store.sheet = null;
  store.historyOpen = false;
  noteQuestion(unique[0]);
  save(); render();
}
function noteQuestion(id) {
  if (!id) return;
  if (!store.ui) store.ui = {};
  store.ui.tintQuestionId = id;
}
function filteredIds(sourceIds, scope) {
  return sourceIds.filter(id => {
    if (scope === "review") return needsReview(id);
    if (scope === "wrong") return prog(id).lastResult === false;
    return true;
  });
}

document.getElementById("app").addEventListener("click", e => {
  const origin = e.target && e.target.closest ? e.target : (e.target && e.target.parentElement);
  const b = origin && origin.closest ? origin.closest("[data-act]") : null;
  if (!b || b.disabled) return;
  const act = b.dataset.act;
  if (act === "noop") return;
  if (act === "open-settings") {
    store.settingsFrom = store.view === "settings" ? (store.settingsFrom || "home") : store.view;
    store.sheet = null;
    store.view = "settings";
    save(); render();
    return;
  }
  if (act === "settings-back") {
    store.view = store.settingsFrom && store.settingsFrom !== "settings" ? store.settingsFrom : "home";
    store.toast = "";
    save(); render();
    return;
  }
  if (act === "reset-data") {
    if (!confirm("解答・理解度・付箋・復習予定を消去します。1日の目標問数は残します。よろしいですか？")) return;
    const goal = store.stats.dailyGoal || GOAL;
    store.progress = {};
    store.stats.streakDays = 0;
    store.stats.todayCount = 0;
    store.stats.todayIds = [];
    store.stats.lastDate = "";
    store.stats.dailyGoal = goal;
    store.drill = null;
    if (store.ui) store.ui.tintQuestionId = null;
    store.toast = "学習データを消去しました。目標問数は残しています。";
    store.view = "settings";
    save(); render();
    return;
  }
  if (act === "open-subject") { store.sheet = b.dataset.id; store.toast = ""; render(); return; }
  if (act === "close-sheet") { store.sheet = null; render(); return; }
  if (act === "toggle-wrong") { store.ui.wrongOnly = !store.ui.wrongOnly; save(); render(); return; }
  if (act === "toggle-review") { store.ui.reviewOnly = !store.ui.reviewOnly; save(); render(); return; }
  if (act === "toggle-fresh") { store.ui.freshOnly = !store.ui.freshOnly; save(); render(); return; }
  if (act === "toggle-marks") { store.ui.bookmarksOnly = !store.ui.bookmarksOnly; save(); render(); return; }
  if (act === "start-today") { startDrill(todayQueue().map(q => q.id), "今日の学習"); return; }
  if (act === "start-random") { startRandom(); return; }
  if (act === "start-subject") { startDrill(applyHomeFilters(qsIn(b.dataset.subject)).map(q => q.id), b.dataset.subject); return; }
  if (act === "start-field") { startDrill(qsIn(b.dataset.subject, b.dataset.field).map(q => q.id), b.dataset.subject + "・" + b.dataset.field); return; }
  if (act === "quiz-back") { store.view = "home"; store.drill = null; save(); render(); return; }
  if (act === "quiz-history") { store.view = "history"; store.historyOpen = true; save(); render(); return; }
  if (act === "history-back") { store.view = store.drill ? "quiz" : "home"; save(); render(); return; }
  if (act === "bookmark") {
    const q = currentQ();
    if (!q) return;
    const p = ensure(q.id);
    p.bookmarked = !p.bookmarked;
    save(); render(); return;
  }
  if (act === "quiz-prev") { moveDrill(-1); return; }
  if (act === "quiz-next") { moveDrill(1); return; }
  if (act === "pick") { reveal(b.dataset.val === "1"); return; }
  if (act === "rate") { commitRate(Number(b.dataset.n)); return; }
});
document.getElementById("app").addEventListener("input", e => {
  const el = e.target.closest("[data-act='goal']");
  if (!el) return;
  const n = Math.round(Number(el.value));
  if (!(n >= 1 && n <= 999)) return;
  store.stats.dailyGoal = n;
  const nEl = document.querySelector(".set-n");
  const gEl = document.querySelector(".set-g");
  if (nEl) nEl.textContent = String(shownToday());
  if (gEl) gEl.textContent = String(n);
  save();
});
document.getElementById("app").addEventListener("change", e => {
  const s = e.target.closest("[data-act='scope']");
  if (!s || !store.drill) return;
  const scope = s.value;
  const cur = store.drill.ids[store.drill.index];
  const nextIds = filteredIds(store.drill.ids, scope);
  const ids = nextIds.includes(cur) ? [cur].concat(nextIds.filter(id => id !== cur)) : store.drill.ids;
  store.drill.scope = scope;
  if (nextIds.includes(cur)) store.drill.ids = ids;
  save(); render();
});

function startRandom() {
  const left = RANDOM_CAP - randomAnsweredToday();
  if (left <= 0) {
    store.toast = "今日のランダムは100問までです。";
    store.view = "home";
    store.sheet = null;
    save(); render();
    return;
  }
  const ids = QUESTIONS.map(q => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
  }
  startDrill(ids.slice(0, Math.min(left, ids.length)), "ランダム", { random: true });
}
function currentQ() {
  const d = store.drill;
  return d && QMAP[d.ids[d.index]];
}
function reveal(sayYes) {
  const d = store.drill;
  const q = currentQ();
  if (!d || !q || d.revealed) return;
  if (d.random && randomAnsweredToday() >= RANDOM_CAP) {
    store.toast = "今日のランダムは100問までです。";
    store.view = "home";
    store.drill = null;
    save(); render();
    return;
  }
  d.revealed = true;
  d.picked = sayYes;
  d.correct = sayYes === q.answer;
  d.seconds = Math.max(0.1, ((Date.now() - (d.startedAt || Date.now())) / 1000));
  d.seconds = Math.round(d.seconds * 10) / 10;
  const p = ensure(q.id);
  p.lastResult = d.correct;
  p.log = p.log || [];
  const entry = { at: new Date().toISOString(), correct: d.correct, picked: sayYes ? "o" : "x", seconds: d.seconds };
  if (d.random) entry.random = true;
  p.log.push(entry);
  stampToday(q.id);
  save(); render();
}
function snapshotDrill() {
  const d = store.drill;
  const q = currentQ();
  if (!d || !q) return;
  if (!d.seen) d.seen = {};
  d.seen[q.id] = { revealed: !!d.revealed, picked: d.picked, correct: d.correct, seconds: d.seconds || 0, startedAt: d.startedAt || null };
}
function restoreDrill(id) {
  const d = store.drill;
  const saved = d.seen && d.seen[id];
  if (saved) {
    d.revealed = saved.revealed;
    d.picked = saved.picked;
    d.correct = saved.correct;
    d.seconds = saved.seconds;
    d.startedAt = saved.startedAt;
  } else {
    d.revealed = false;
    d.picked = null;
    d.correct = null;
    d.seconds = 0;
    d.startedAt = Date.now();
  }
}
function moveDrill(delta) {
  const d = store.drill;
  if (!d) return;
  const next = d.index + delta;
  if (next < 0 || next >= d.ids.length) return;
  snapshotDrill();
  d.index = next;
  restoreDrill(d.ids[next]);
  noteQuestion(d.ids[next]);
  save(); render();
}
function commitRate(n) {
  const d = store.drill;
  const q = currentQ();
  if (!d || !q || !d.revealed || !(n >= 1 && n <= 3)) return;
  const p = ensure(q.id);
  p.understanding = n;
  if (p.lastResult == null) p.lastResult = d.correct;
  schedule(q.id, n);
  noteQuestion(q.id);
  snapshotDrill();
  const next = d.index + 1;
  if (next >= d.ids.length) {
    store.view = "home";
    store.drill = null;
    save(); render();
    return;
  }
  d.index = next;
  restoreDrill(d.ids[next]);
  noteQuestion(d.ids[next]);
  save(); render();
}
function noteQuestion(id) {
  if (!id) return;
  if (!store.ui) store.ui = {};
  store.ui.tintQuestionId = id;
}

render();
