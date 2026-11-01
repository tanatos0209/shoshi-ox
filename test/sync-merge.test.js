"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { reconcile, unionLogs } = require("../sync-merge.js");

function bundle(updatedAt, payload, extras) {
  return { updatedAt: updatedAt, payload: payload, extras: extras || {} };
}

test("newer answer wins SRS for that question and both logs stay", () => {
  const local = bundle(100, {
    version: 3,
    stats: { dailyGoal: 40, streakDays: 2 },
    ui: { wrongOnly: true, onlyUnknown: false },
    progress: {
      "001": {
        understanding: 3, lastResult: true, bookmarked: false, reps: 2, interval: 6, ease: 2.6,
        nextReviewDate: "2026-11-07T03:00:00.000Z",
        log: [{ at: "2026-11-01T01:00:00.000Z", correct: true, picked: "o", understanding: 3 }]
      }
    }
  });
  const remote = bundle(50, {
    version: 3,
    stats: { dailyGoal: 80, streakDays: 1 },
    ui: { wrongOnly: false, onlyUnknown: true },
    progress: {
      "001": {
        understanding: 1, lastResult: false, bookmarked: true, reps: 0, interval: 1, ease: 2.3,
        nextReviewDate: "2026-11-02T03:00:00.000Z",
        log: [{ at: "2026-10-31T01:00:00.000Z", correct: false, picked: "x", understanding: 1 }]
      }
    }
  });
  const merged = reconcile(local, remote);
  const q = merged.payload.progress["001"];
  assert.equal(q.understanding, 3);
  assert.equal(q.interval, 6);
  assert.equal(q.bookmarked, false);
  assert.equal(q.log.length, 2);
  assert.equal(q.log[0].at, "2026-10-31T01:00:00.000Z");
  assert.equal(q.log[1].understanding, 3);
  assert.equal(merged.payload.stats.dailyGoal, 40);
  assert.equal(merged.payload.ui.wrongOnly, true);
  assert.equal(merged.payload.ui.onlyUnknown, false);
  assert.equal(merged.writeBack, true);
  assert.equal(merged.applyLocal, true);
});

test("remote-only question and local-only question both remain", () => {
  const local = bundle(10, {
    progress: { "001": { understanding: 2, lastResult: true, log: [{ at: "2026-11-01T00:00:00.000Z", correct: true, picked: "o" }] } },
    stats: { dailyGoal: 80 },
    ui: { reviewOnly: true }
  });
  const remote = bundle(20, {
    progress: { "002": { understanding: 1, lastResult: false, log: [{ at: "2026-11-01T02:00:00.000Z", correct: false, picked: "x" }] } },
    stats: { dailyGoal: 30 },
    ui: { freshOnly: true }
  });
  const merged = reconcile(local, remote);
  assert.equal(merged.payload.progress["001"].understanding, 2);
  assert.equal(merged.payload.progress["002"].understanding, 1);
  assert.equal(merged.payload.stats.dailyGoal, 30);
  assert.equal(merged.payload.ui.freshOnly, true);
  assert.equal(merged.payload.ui.reviewOnly, true);
});

test("unknown memo fields survive a newer answer on another question", () => {
  const local = bundle(10, {
    progress: {
      "001": { understanding: 2, lastResult: true, memo: { strokes: "local" }, log: [{ at: "2026-11-01T00:00:00.000Z", correct: true, picked: "o" }] }
    },
    memos: { "001": "手書きA", "003": "端末だけ" },
    stats: {},
    ui: {}
  });
  const remote = bundle(30, {
    progress: {
      "001": { understanding: 2, lastResult: true, log: [{ at: "2026-11-01T00:00:00.000Z", correct: true, picked: "o" }] },
      "002": { understanding: 3, lastResult: true, log: [{ at: "2026-11-01T04:00:00.000Z", correct: true, picked: "o", understanding: 3 }] }
    },
    memos: { "002": "手書きB" },
    stats: { dailyGoal: 80 },
    ui: { bookmarksOnly: true }
  });
  const merged = reconcile(local, remote);
  assert.equal(merged.payload.progress["001"].memo.strokes, "local");
  assert.equal(merged.payload.progress["002"].understanding, 3);
  assert.equal(merged.payload.memos["001"], "手書きA");
  assert.equal(merged.payload.memos["002"], "手書きB");
  assert.equal(merged.payload.memos["003"], "端末だけ");
  assert.equal(merged.payload.ui.bookmarksOnly, true);
});

test("same attempt keeps understanding filled in later", () => {
  const logs = unionLogs(
    [{ at: "2026-11-01T00:00:00.000Z", correct: true, picked: "o" }],
    [{ at: "2026-11-01T00:00:00.000Z", correct: true, picked: "o", understanding: 2 }]
  );
  assert.equal(logs.length, 1);
  assert.equal(logs[0].understanding, 2);
});

test("extra localStorage keys follow their own timestamps", () => {
  const local = bundle(5, { progress: {}, stats: {}, ui: {} }, {
    "shoshi-ox-memo-v1": { updatedAt: 100, value: "新しいメモ" }
  });
  const remote = bundle(90, { progress: {}, stats: { dailyGoal: 10 }, ui: {} }, {
    "shoshi-ox-memo-v1": { updatedAt: 40, value: "古いメモ" }
  });
  const merged = reconcile(local, remote);
  assert.equal(merged.extras["shoshi-ox-memo-v1"].value, "新しいメモ");
  assert.equal(merged.payload.stats.dailyGoal, 10);
});

test("tombstone extra wins when it is newer", () => {
  const local = bundle(1, { progress: {}, stats: {}, ui: {} }, {
    "shoshi-ox-memo-v1": { updatedAt: 10, value: "残す" }
  });
  const remote = bundle(2, { progress: {}, stats: {}, ui: {} }, {
    "shoshi-ox-memo-v1": { updatedAt: 20, value: null }
  });
  const merged = reconcile(local, remote);
  assert.equal(merged.extras["shoshi-ox-memo-v1"].value, null);
});

test("identical bundles do not ask for another write", () => {
  const payload = {
    version: 3,
    progress: { "001": { understanding: 1, lastResult: false, log: [] } },
    stats: { dailyGoal: 80 },
    ui: { onlyUnknown: false }
  };
  const one = bundle(15, payload, {});
  const two = bundle(15, JSON.parse(JSON.stringify(payload)), {});
  const merged = reconcile(one, two);
  assert.equal(merged.applyLocal, false);
  assert.equal(merged.writeBack, false);
});

test("ephemeral quiz fields are not part of the merged payload", () => {
  const local = bundle(3, {
    progress: {},
    stats: { dailyGoal: 80 },
    ui: {},
    view: "quiz",
    drill: { ids: ["001"], index: 0 },
    toast: "途中"
  });
  const remote = bundle(1, { progress: {}, stats: { dailyGoal: 20 }, ui: {} });
  const merged = reconcile(local, remote);
  assert.equal(merged.payload.view, undefined);
  assert.equal(merged.payload.drill, undefined);
  assert.equal(merged.payload.toast, undefined);
  assert.equal(merged.payload.stats.dailyGoal, 80);
});
