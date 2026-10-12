import test from "node:test";
import assert from "node:assert/strict";
import {
  literalMatches,
  searchGuide,
  searchNotes,
  sortNotes,
  cardPlainText,
  undoFeedbackChange,
} from "../src/local-tools.ts";
import { activities } from "../src/catalog.ts";
import { emptyJournal, saveDiscovery, snapshot } from "../src/journal.ts";
import { filteredNotes, validPair } from "../src/notebook-view.ts";

test("literal search treats punctuation literally and compares Unicode without rewriting it", () => {
  assert.equal(literalMatches(" [.*] ", "A [.*] detail"), true);
  assert.equal(literalMatches("[.*]", "any detail"), false);
  assert.equal(literalMatches("CAFÉ", "Cafe\u0301 near the path"), true);
  assert.equal(literalMatches("声", "一条声音"), true);
  assert.equal(literalMatches(" ", "anything"), true);
});

test("note text and task-title search compose with existing scene/tag/date filters without changing journal bytes", () => {
  let journal = emptyJournal();
  for (const [id, text, scene, tags, date] of [
    [
      "a",
      "一条声音 Cafe\u0301 [.*]",
      "street",
      ["sound"],
      "2026-10-07T12:00:00Z",
    ],
    ["b", "A shadow appeared", "park", ["light"], "2026-10-06T12:00:00Z"],
  ] as const)
    journal = saveDiscovery(
      journal,
      {
        id,
        text,
        scene,
        tags: [...tags],
        task: snapshot(activities[0]),
        markDone: false,
      },
      date,
    );
  const raw = JSON.stringify(journal);
  const filter = {
    tag: "sound",
    scene: "street",
    from: "2026-10-07",
    to: "2026-10-07",
  };
  assert.deepEqual(
    searchNotes(filteredNotes(journal.entries, filter), "CAFÉ").map(
      (n) => n.id,
    ),
    ["a"],
  );
  assert.equal(searchNotes(journal.entries, "MAKE A SOUND MAP").length, 2);
  assert.equal(searchNotes(journal.entries, "[.*]").length, 1);
  assert.equal(
    searchNotes(
      filteredNotes(journal.entries, { ...filter, scene: "park" }),
      "声音",
    ).length,
    0,
  );
  assert.equal(
    searchNotes(
      filteredNotes(journal.entries, { ...filter, from: "2026-10-08" }),
      "",
    ).length,
    0,
  );
  assert.equal(JSON.stringify(journal), raw);
});

test("guide search only filters supplied eligible rows and keeps original source order", () => {
  const rows = activities.filter((a) => a.still && a.minutes === 5);
  const ids = rows.map((a) => a.id);
  const found = searchGuide(rows, "sound");
  assert.ok(found.length > 0);
  assert.ok(found.every((a) => ids.includes(a.id)));
  assert.deepEqual(
    rows.map((a) => a.id),
    ids,
  );
  assert.deepEqual(searchGuide(rows, " "), rows);
  assert.deepEqual(searchGuide(rows, "[not a regex]"), []);
  assert.deepEqual(searchGuide([], "sound"), []);
});

test("creation-time sort handles imported order and fractional UTC dates, keeps equivalent times stable and never mutates storage or comparison", () => {
  const template = saveDiscovery(
    emptyJournal(),
    {
      id: "base",
      text: "A retained line",
      tags: [],
      task: snapshot(activities[0]),
      markDone: false,
    },
    "2026-10-07T10:00:00Z",
  ).entries[0];
  const rows = Object.freeze([
    { ...template, id: "fraction", createdAt: "2026-10-07T10:00:00.1Z" },
    { ...template, id: "later", createdAt: "2026-10-07T10:00:01Z" },
    { ...template, id: "zero", createdAt: "2026-10-07T10:00:00Z" },
    { ...template, id: "equivalent", createdAt: "2026-10-07T10:00:00.000Z" },
  ]);
  const raw = JSON.stringify(rows);
  const oldest = sortNotes(rows, "oldest"),
    newest = sortNotes(rows, "newest");
  assert.deepEqual(
    oldest.map((n) => n.id),
    ["zero", "equivalent", "fraction", "later"],
  );
  assert.deepEqual(
    newest.map((n) => n.id),
    ["later", "fraction", "zero", "equivalent"],
  );
  assert.equal(JSON.stringify(rows), raw);
  assert.deepEqual(
    validPair(oldest, "later", "zero")?.map((n) => n.id),
    ["later", "zero"],
  );
  assert.deepEqual(
    validPair(newest, "later", "zero")?.map((n) => n.id),
    ["later", "zero"],
  );
});

test("card takeaway uses the actual composed steps, complete cues and safety without private context", () => {
  const card = {
    ...activities[0],
    steps: [
      "Current composed first",
      "Current composed second",
      "Current composed third",
    ],
  };
  const text = cardPlainText(
    card,
    ["cue one", "cue two", "cue three"],
    [
      "Leave things as you found them.",
      "Choose a safe accessible place; check local weather and hazards.",
    ],
  );
  for (const line of [
    card.title,
    card.subtitle,
    ...card.steps,
    "cue one",
    "cue two",
    "cue three",
    card.takeaway,
    "Leave things",
    "local weather",
    `${card.minutes} min`,
  ])
    assert.ok(text.includes(line));
  assert.ok(!text.includes(card.meaning));
  assert.ok(!text.includes("ranking"));
});

test("feedback undo restores exact action and retry state while preserving later unrelated families and rejecting conflicting family/capacity", () => {
  const before = { done: ["sound-map"], skipped: [] };
  const after = { done: [], skipped: ["sound-map"] };
  const undo = { before, after };
  assert.deepEqual(undoFeedbackChange(after, undo), before);
  assert.deepEqual(undoFeedbackChange(before, undo), before); // session undo retry
  const later = { done: ["shadow-study"], skipped: ["sound-map", "sky-pause"] };
  const bytes = JSON.stringify(later);
  assert.deepEqual(undoFeedbackChange(later, undo), {
    done: ["shadow-study", "sound-map"],
    skipped: ["sky-pause"],
  });
  assert.equal(JSON.stringify(later), bytes);
  assert.equal(
    undoFeedbackChange(
      {
        done: ["shadow-study", "sky-pause", "texture-walk"],
        skipped: ["sound-map"],
      },
      undo,
    ),
    null,
  );
  // A sibling is the same family, not permission to replace a later decision.
  const sibling = activities.find(
    (a) => a.family === activities[0].family && a.id !== activities[0].id,
  );
  if (sibling)
    assert.equal(
      undoFeedbackChange({ done: [sibling.id], skipped: [] }, undo),
      null,
    );
});
