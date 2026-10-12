import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAppearance,
  effectiveDepth,
  themes,
} from "../src/appearance-preferences.ts";

test("appearance defaults safely for invalid, oversized and future records", () => {
  for (const raw of [
    null,
    "",
    "{",
    "null",
    "[]",
    '"forest"',
    '{"version":2,"theme":"tidal","depth":true}',
    '{"version":1,"theme":"<script>","depth":true}',
    '{"version":1,"theme":"clay","depth":"yes"}',
    "x".repeat(1025),
  ])
    assert.deepEqual(parseAppearance(raw), {
      version: 1,
      theme: "forest",
      depth: false,
    });
});
test("every supported theme and independent depth choice survive serialization", () => {
  for (const theme of themes)
    for (const depth of [false, true]) {
      const choice = { version: 1, theme, depth };
      assert.deepEqual(parseAppearance(JSON.stringify(choice)), choice);
    }
});
test("parser returns a clean allowlisted record without retaining unrelated properties", () => {
  const raw =
    '{"version":1,"theme":"tidal","depth":true,"__proto__":{"polluted":true},"notes":"excluded"}';
  assert.deepEqual(parseAppearance(raw), {
    version: 1,
    theme: "tidal",
    depth: true,
  });
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  const one = parseAppearance(null);
  one.theme = "clay";
  assert.equal(parseAppearance(null).theme, "forest");
});
test("each device gate flattens 3D without changing the saved choice", () => {
  const choice = { version: 1, theme: "clay", depth: true } as const;
  const ordinary = {
    reducedMotion: false,
    simpleEffects: false,
    hidden: false,
    saveData: false,
  };
  const before = JSON.stringify(choice);
  assert.equal(effectiveDepth(choice, ordinary), true);
  for (const key of Object.keys(ordinary))
    assert.equal(effectiveDepth(choice, { ...ordinary, [key]: true }), false);
  assert.equal(JSON.stringify(choice), before);
});
test("user off wins even when all device gates clear", () => {
  assert.equal(
    effectiveDepth(
      { version: 1, theme: "forest", depth: false },
      {
        reducedMotion: false,
        simpleEffects: false,
        hidden: false,
        saveData: false,
      },
    ),
    false,
  );
});
