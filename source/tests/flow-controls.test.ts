import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeFilterLabels,
  startDiscovery,
  writingStarters,
} from "../src/flow-controls.ts";

test("manual writing starters never replace existing content, including whitespace/Unicode, or accept arbitrary generated text", () => {
  for (const prefix of writingStarters)
    assert.equal(startDiscovery("", prefix), prefix);
  for (const text of [
    " ",
    "已写发现",
    "<script>literal</script>",
    "x".repeat(280),
  ])
    for (const prefix of writingStarters)
      assert.equal(startDiscovery(text, prefix), null);
  assert.equal(startDiscovery("", "A made-up observation."), null);
});
test("active filter labels disclose every selected constraint without inventing a filter or interpreting notebook content", () => {
  const empty = {
    search: " ",
    tag: "any",
    scene: "any",
    lens: "any",
    month: "any",
    from: "",
    to: "",
    family: "",
  };
  assert.deepEqual(activeFilterLabels(empty), []);
  assert.deepEqual(
    activeFilterLabels({
      ...empty,
      search: " <x> 中文 ",
      tag: "edges",
      scene: "Park",
      lens: "Surfaces & texture",
      month: "2026-10",
      from: "2026-10-01",
      to: "2026-10-09",
      family: "boundaries",
    }),
    [
      "Search: “<x> 中文”",
      "Tag: edges",
      "Scene: Park",
      "Lens: Surfaces & texture",
      "Month: 2026-10",
      "From 2026-10-01 (UTC)",
      "Through 2026-10-09 (UTC)",
      "Family: boundaries",
    ],
  );
});
