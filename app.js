"use strict";
/* AI択一対策 — vanilla JS / localStorage key: shoshi-ox-v1 */

const STORAGE_KEY = "shoshi-ox-v1";

const QUESTIONS = [
  { id: "001", source: "オリジナル", topic: "民法・自然人",
    stem: "未成年者が法定代理人の同意を得ないで贈与を受けた場合において、その贈与契約が負担付のものでないときは、その未成年者は、その贈与契約を取り消すことはできない。",
    correct: "o",
    explanation: "この肢は正しいです。負担のない贈与を受けた未成年者は、その契約を取り消せません。単に権利を得るだけの行為は、法定代理人の同意がなくてもできます。たとえば、知人からお年玉として現金だけもらった場合です。返す義務はないので、同意がなくても取り消せません。ひっかけは、負担付の贈与です。お礼に毎週草むしりをする約束のように義務を負う贈与は、同意がなければ取り消せます。",
    article: "民法5条1項ただし書" },
  { id: "002", source: "オリジナル", topic: "民法・自然人",
    stem: "養子である未成年者が実親の同意を得て法律行為をしたときは、その未成年者の養親は、その法律行為を取り消すことはできない。",
    correct: "x",
    explanation: "この肢は誤りです。養親は、その法律行為を取り消せます。養子が服するのは養親の親権であり、実親の同意があっても養親の取消しは防げません。たとえば、養子が実親の「いいよ」だけでスマホの分割契約をしても、養親は取り消せます。ひっかけは、同意した親が親権者だと思い込む点です。",
    article: "民法818条2項" },
  { id: "003", source: "オリジナル", topic: "民法・自然人",
    stem: "法定代理人が目的を定めないで処分を許した財産は、未成年者が自由に処分することができる。",
    correct: "o",
    explanation: "この肢は正しいです。未成年者は、その財産を自由に処分できます。目的を定めないで処分を許した財産は、使い道の制限がありません。たとえば、親が「この1万円は好きに使って」と渡したお金で、文房具でもお菓子でも買える場合です。ひっかけは、目的を定めて許した財産です。「このお金は参考書だけ」と定められたお金は、その範囲に限られます。",
    article: "民法5条3項" },
  { id: "004", source: "オリジナル", topic: "民法・自然人",
    stem: "未成年者が特定の営業について法定代理人の許可を受けた場合には、その営業に関する法律行為については、行為能力の制限を理由として取り消すことができない。",
    correct: "o",
    explanation: "この肢は正しいです。許可を受けた営業についての契約は、未成年を理由に取り消せません。その営業では、成年者と同じ行為能力があります。たとえば、新聞販売の許可を受けた未成年者が、その配達用の自転車を店で買う場合です。ひっかけは、許可の範囲です。別の店を出す契約や、遊びに使うゲーム機の購入には及びません。",
    article: "民法6条1項" },
  { id: "005", source: "オリジナル", topic: "民法・総則・私権の主体",
    stem: "陶芸教室を営む成年のAは、中学3年の生徒Bに、教室で使う電動ろくろを売る契約を結んだ。Aは、Bが未成年者であること以外に取り消しの理由となる事情がない場合でも、自分のしたその売買の意思表示を取り消すことができる。",
    correct: "x",
    explanation: "この肢は誤りです。Aは、自分の売買を取り消せません。取消しで守られるのは未成年者の側です。相手が未成年というだけでは、成年の表意者は取り消せません。たとえば、文具店の成年の店員が中学生にノートを売ったあと、相手が未成年だというだけではその売買を取り消せない場合です。ひっかけは、取消権が相手方の成年者にもあると思い込む点です。",
    article: "民法5条1項" },
  { id: "006", source: "オリジナル", topic: "民法・総則・私権の主体",
    stem: "17歳のAは、法定代理人の同意を得ないで、楽器店主のBから中古の電子ピアノを分割払いで買った。Aが18歳になった後、Bが40日の期間を定めてその売買を追認するかどうか確答するよう催告し、Aがその期間内に確答を発しなかったときは、Aはその売買を追認したものとみなされる。",
    correct: "o",
    explanation: "この肢は正しいです。Aは、その売買を追認したものとみなされます。成年になった本人に1か月以上の期間を定めて確答を求め、期間内に返事がなければ追認が擬制されます。40日は1か月以上です。たとえば、未成年のときに買った中古スマホについて、成年後に店から「40日以内に追認するか返事を」と求められ、黙っていたら追認したことになる場合です。ひっかけは、返事がないと取り消したものとみなされる、という点です。",
    article: "民法20条1項" },
  { id: "007", source: "オリジナル", topic: "民法・総則・私権の主体",
    stem: "16歳の高校生Aは、スポーツ用品店で競技用ヘルメットを買うとき、店員から年齢を尋ねられず、自分からも未成年であるとは言わなかった。成年者であるとの発言や、他人の身分証明書の提示はしていない。Aは、法定代理人の同意がないこの売買を、未成年であることを理由に取り消すことができる。",
    correct: "o",
    explanation: "この肢は正しいです。Aは、未成年であることを理由に取り消せます。年齢を黙っていただけでは、成年者だと信じさせる詐術にはなりません。たとえば、コンビニでおにぎりを買うとき年齢を聞かれず、自分からも言わなかった未成年者が、その売買を取り消せる場合です。ひっかけは、身分証を見せたり、自ら成年だと告げたりした場合です。そのときは詐術になり、取り消せなくなることがあります。",
    article: "民法21条" },
  { id: "008", source: "オリジナル", topic: "民法・総則・私権の主体",
    stem: "カフェを営むAは、来店した17歳のBについて、話し方や服装から過失なく成年者だと信じ、飲食代金の契約をした。Bは、成年者だと告げることも、年齢を示す書類を見せることもしていない。この場合、Bは法定代理人の同意がないその契約を、未成年であることを理由に取り消すことができない。",
    correct: "x",
    explanation: "この肢は誤りです。Bは、未成年であることを理由に取り消せます。相手が過失なく成年者と信じただけでは、取消しは止まりません。詐術がない限り、未成年者は取り消せます。たとえば、携帯ショップの店員が服装から成年だと信じても、客が年齢を偽っていなければ、未成年の客は契約を取り消せる場合です。ひっかけは、相手の善意・無過失があれば常に取り消せない、という理解です。",
    article: "民法21条" },
];

const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const MARK = { o: "○", x: "×" };

/* ---------- storage ---------- */
function emptyStore() {
  return { version: 1, history: {}, sessions: [], current: null, understanding: {}, ui: { mode: "practice" } };
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const d = JSON.parse(raw);
    const next = Object.assign(emptyStore(), d, {
      history: d.history || {}, sessions: d.sessions || [], understanding: d.understanding || {} });
    delete next.tint;
    return next;
  } catch (e) {
    console.warn("履歴の読み込みに失敗しました", e);
    return emptyStore();
  }
}
let store = load();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch (e) { console.warn("履歴の保存に失敗しました", e); }
}

/* ---------- helpers ---------- */
const hist = id => store.history[id] || [];
const wrongCount = id => hist(id).filter(h => !h.correct).length;
const weakIds = () => QUESTIONS.filter(q => wrongCount(q.id) > 0).map(q => q.id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmt = iso => {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function startSession(kind, ids) {
  store.current = { id: "s" + Date.now(), kind, startedAt: new Date().toISOString(), ids, index: 0, picked: null, results: {} };
  save();
}
function finishSession() {
  const c = store.current;
  if (!c) return;
  const answered = Object.keys(c.results);
  if (answered.length) {
    const ok = answered.filter(id => c.results[id].correct).length;
    store.sessions.unshift({ id: c.id, kind: c.kind, startedAt: c.startedAt, endedAt: new Date().toISOString(),
      total: c.ids.length, answered: answered.length, ok, ng: answered.length - ok, results: c.results });
    store.sessions = store.sessions.slice(0, 100);
  }
  store.lastSession = store.sessions[0] && store.sessions[0].id === c.id ? c.id : null;
  store.current = null;
  save();
}

/* ---------- actions ---------- */
function setMode(mode) { store.ui.mode = mode; save(); render(); }

function choose(ans) {
  const c = store.current;
  if (!c || c.picked) return;
  const q = QMAP[c.ids[c.index]];
  const correct = ans === q.correct;
  const at = new Date().toISOString();
  c.picked = ans;
  c.results[q.id] = { at, correct, picked: ans };
  (store.history[q.id] = store.history[q.id] || []).push({ at, correct, picked: ans });
  save(); render();
}
function rate(n) {
  const c = store.current;
  if (!c || !c.picked) return;
  const qid = c.ids[c.index];
  n = Number(n);
  if (!(n >= 1 && n <= 5)) return;
  if (!store.understanding) store.understanding = {};
  store.understanding[qid] = n;
  save(); render();
}
function next() {
  const c = store.current;
  if (!c) return;
  if (c.index >= c.ids.length - 1) { finishSession(); setMode("review"); return; }
  c.index++; c.picked = null; save(); render();
}
function begin(kind, ids) {
  if (store.current && Object.keys(store.current.results).length) finishSession();
  startSession(kind, ids);
  store.ui.mode = kind === "weak" ? "weak" : "practice";
  save(); render();
}
function retryOne(id) { begin("single", [id]); store.ui.mode = "practice"; save(); render(); }
function resetAll() {
  if (!confirm("学習履歴と結果をすべて消去します。よろしいですか？")) return;
  store = emptyStore(); save(); render();
}

/* ---------- views ---------- */
const app = document.getElementById("app");

function viewQuestion() {
  const c = store.current;
  const q = QMAP[c.ids[c.index]];
  const h = hist(q.id);
  const label = { all: "全問", weak: "弱点", single: "個別" }[c.kind] || "";
  const rateN = ratingOf(q.id);
  const rateClass = rateN ? ` rate-${rateN}` : "";
  let body = `
  <section class="card${rateClass}">
    <div class="meta">
      <span class="counter">問 ${esc(q.id)}　${c.index + 1}/${c.ids.length}</span>
      <span>論点 <b>${esc(q.topic)}</b></span><span>${label}</span>
    </div>
    <p class="stem">${esc(q.stem)}</p>`;
  if (!c.picked) {
    body += `<div class="ox">
      <button class="o" data-act="o" aria-label="正しい（○）">〇</button>
      <button class="x" data-act="x" aria-label="誤り（×）">×</button></div>`;
  } else {
    const r = c.results[q.id];
    body += `<div class="result ${r.correct ? "ok" : "ng"}${rateClass}">
      <div class="lead">${r.correct ? "正解です" : "不正解です"}</div>
      <div>あなたの解答：${MARK[r.picked]}　正解：${MARK[q.correct]}</div>
      <div>${esc(q.explanation)}</div>
      <div class="article">（${esc(q.article)}）</div></div>
      <div class="grasp" role="group" aria-label="理解度">
        <span class="grasp-label">理解度</span>
        <div class="grasp-row">${[[5,"すぐ解ける"],[4,"だいたい分かる"],[3,"ふつう"],[2,"あやしい"],[1,"わからない"]].map(([n, label]) => {
          const on = store.understanding && store.understanding[q.id] === n;
          return `<button type="button" class="grasp-btn" data-act="rate" data-n="${n}" aria-pressed="${on ? "true" : "false"}" aria-label="${n} ${label}"><span class="grasp-n">${n}</span><span class="grasp-t">${label}</span></button>`;
        }).join("")}</div>
      </div>
      <button class="btn primary block" data-act="next">${c.index >= c.ids.length - 1 ? "結果を見る" : "次の問へ"}</button>`;
  }
  body += `<p class="muted" style="margin-top:12px">この肢の通算：${h.length}回解答／誤答${wrongCount(q.id)}回</p>
    <div class="btn-row"><button class="btn" data-act="quit">中断して結果へ</button></div>
  </section>`;
  return body;
}

function viewPractice() {
  if (store.current && store.current.kind !== "weak") return viewQuestion();
  return `<section class="card"><h2>練習</h2>
    <p>全${QUESTIONS.length}問を順に解きます。途中で閉じても、続きから再開できます。</p>
    <button class="btn primary block" data-act="start-all">全問を始める</button></section>`;
}

function viewWeak() {
  if (store.current && store.current.kind === "weak") return viewQuestion();
  const ids = weakIds();
  if (!ids.length) return `<section class="card"><h2>弱点</h2>
    <p>誤答の履歴がある肢はまだありません。まずは練習で解いてみてください。</p></section>`;
  const rows = ids.map(id => { const q = QMAP[id];
    return `<tr><td>${id}</td><td class="col-stem">${esc(q.stem.slice(0, 30))}…</td><td>誤答${wrongCount(id)}／${hist(id).length}回</td></tr>`; }).join("");
  return `<section class="card"><h2>弱点（誤答履歴のある肢）</h2>
    <p>過去に一度でも誤答した肢が ${ids.length} 問あります。</p>
    <table><thead><tr><th>No.</th><th>肢</th><th>履歴</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="btn-row"><button class="btn primary block" data-act="start-weak">弱点だけ解く</button></div></section>`;
}

function histStrip(id) {
  const h = hist(id).slice(-10);
  if (!h.length) return `<span class="muted">—</span>`;
  return `<span class="hist">${h.map(x => `<span class="${x.correct ? "h-ok" : "h-ng"}">${x.correct ? "○" : "×"}</span>`).join("")}</span>`;
}

function viewReview() {
  let html = "";
  const s = store.lastSession ? store.sessions.find(x => x.id === store.lastSession) : null;
  if (store.current) {
    const c = store.current; const n = Object.keys(c.results).length;
    html += `<section class="card"><h2>進行中のセッション</h2><p>${c.ids.length}問中 ${n}問解答済みです。</p>
      <div class="btn-row"><button class="btn primary" data-act="resume">続きから再開</button>
      <button class="btn" data-act="end-current">ここで終了して記録</button></div></section>`;
  }
  if (s) {
    const rows = Object.keys(s.results).map(id => { const r = s.results[id], q = QMAP[id];
      return `<tr><td>${id}</td><td class="col-stem">${q ? esc(q.stem.slice(0, 30)) + "…" : ""}</td>
        <td><span class="tag ${r.correct ? "ok" : "ng"}">${r.correct ? "正解" : "誤答"}</span></td></tr>`; }).join("");
    const wrong = Object.keys(s.results).filter(id => !s.results[id].correct);
    html += `<section class="card"><h2>今回の結果</h2>
      <div class="score">${s.ok} / ${s.answered}</div>
      <p class="muted">${s.answered}問中 ${s.ok}問正解／誤答 ${s.ng}問（${fmt(s.endedAt)}）</p>
      <table><thead><tr><th>No.</th><th>肢</th><th>判定</th></tr></thead><tbody>${rows}</tbody></table>
      ${wrong.length ? `<p style="margin-top:12px">誤答だけもう一度：</p><div class="btn-row">${wrong.map(id => `<button class="btn" data-act="retry" data-id="${id}">問${id}をやり直す</button>`).join("")}</div>` : ""}
      <div class="btn-row"><button class="btn primary" data-act="start-all">最初からやり直す</button></div></section>`;
  }
  const qrows = QUESTIONS.map(q => { const h = hist(q.id); const ok = h.filter(x => x.correct).length;
    const last = h[h.length - 1];
    const tag = !last ? `<span class="tag na">未解答</span>` : last.correct ? `<span class="tag ok">直近正解</span>` : `<span class="tag ng">直近誤答</span>`;
    return `<tr><td><button class="qlink" data-act="retry" data-id="${q.id}">${q.id}</button></td>
      <td>${h.length ? `${ok}/${h.length}（${Math.round(ok / h.length * 100)}%）` : "—"}</td><td>${histStrip(q.id)}</td><td>${tag}</td></tr>`; }).join("");
  html += `<section class="card"><h2>肢ごとの通算成績</h2>
    <table><thead><tr><th>No.</th><th>正答率</th><th>直近10回</th><th>状態</th></tr></thead><tbody>${qrows}</tbody></table>
    <p class="muted">番号を押すと、その肢だけ解き直せます。</p></section>`;
  const srows = store.sessions.slice(0, 20).map(x => `<tr><td>${fmt(x.endedAt)}</td><td>${{ all: "全問", weak: "弱点", single: "個別" }[x.kind] || ""}</td>
    <td>${x.ok}/${x.answered}</td><td>${x.answered ? Math.round(x.ok / x.answered * 100) : 0}%</td></tr>`).join("");
  html += `<section class="card"><h2>セッション履歴</h2>
    ${srows ? `<table><thead><tr><th>終了日時</th><th>種別</th><th>正解</th><th>正答率</th></tr></thead><tbody>${srows}</tbody></table>` : `<p class="muted">まだ記録はありません。</p>`}
    <div class="btn-row"><button class="btn danger" data-act="reset">履歴をすべて消去</button></div></section>`;
  return html;
}

const TINT_PAGE = { 5: "#0c1a14", 4: "#14180c", 3: "#161416", 2: "#1a100c", 1: "#1a0c10" };
function ratingOf(id) {
  const n = Number(store.understanding && store.understanding[id]);
  return n >= 1 && n <= 5 ? n : 0;
}
function visibleQuestionId() {
  const c = store.current;
  const mode = store.ui.mode || "practice";
  if (!c || mode === "review") return null;
  if (mode === "weak" ? c.kind !== "weak" : c.kind === "weak") return null;
  return c.ids[c.index];
}
function applyTint() {
  const n = ratingOf(visibleQuestionId());
  for (let i = 1; i <= 5; i++) {
    const on = n === i;
    document.documentElement.classList.toggle("tint-" + i, on);
    document.body.classList.toggle("tint-" + i, on);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", n ? TINT_PAGE[n] : "#14080c");
}
function render() {
  const mode = store.ui.mode || "practice";
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.mode === mode)));
  app.innerHTML = mode === "review" ? viewReview() : mode === "weak" ? viewWeak() : viewPractice();
  applyTint();
  document.getElementById("seedinfo").textContent =
    `収録 ${QUESTIONS.length}問（民法・総則・私権の主体）・弱点 ${weakIds().length}問`;
}

/* ---------- events ---------- */
document.querySelector(".tabs").addEventListener("click", e => {
  const t = e.target.closest(".tab"); if (t) setMode(t.dataset.mode);
});
app.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "o" || act === "x") choose(act);
  else if (act === "rate") rate(b.dataset.n);
  else if (act === "next") next();
  else if (act === "start-all") begin("all", QUESTIONS.map(q => q.id));
  else if (act === "start-weak") begin("weak", weakIds());
  else if (act === "retry") retryOne(b.dataset.id);
  else if (act === "quit" || act === "end-current") { finishSession(); setMode("review"); }
  else if (act === "resume") setMode(store.current.kind === "weak" ? "weak" : "practice");
  else if (act === "reset") resetAll();
});
document.addEventListener("keydown", e => {
  if (!store.current || store.ui.mode === "review") return;
  if (!store.current.picked && (e.key === "o" || e.key === "1" || e.key === "ArrowLeft")) choose("o");
  else if (!store.current.picked && (e.key === "x" || e.key === "2" || e.key === "ArrowRight")) choose("x");
  else if (store.current.picked && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
});
window.addEventListener("storage", e => { if (e.key === STORAGE_KEY) { store = load(); render(); } });

/* 初回は自動で全問セッションを開始 */
if (!store.current && !store.sessions.length) startSession("all", QUESTIONS.map(q => q.id));
render();
