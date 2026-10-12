import { activities, type Activity } from "./catalog.ts";
import {
  parseFeedback,
  emptyFeedback,
  recordFeedback,
  pocketCues,
  type Feedback,
} from "./pocket.ts";
export const JOURNAL_KEY = "pft-journal-v1";
export const MAX_DISCOVERIES = 100;
export const noteTags = [
  "light",
  "sound",
  "texture",
  "movement",
  "change",
  "edges",
] as const;
export type NoteTag = (typeof noteTags)[number];
export const scenes = ["street", "park", "garden", "water"] as const;
export type Scene = (typeof scenes)[number];
export const sceneLabels: Record<Scene, string> = {
  street: "Street",
  park: "Park",
  garden: "Garden",
  water: "Waterside",
};
export const sceneLabel = (scene?: Scene) =>
  scene ? sceneLabels[scene] : "Unclassified";
export type Snapshot = Pick<
  Activity,
  | "id"
  | "title"
  | "family"
  | "lens"
  | "version"
  | "steps"
  | "prompt"
  | "minutes"
  | "settings"
  | "still"
  | "requires"
> & { cues: [string, string, string] };
export type Discovery = {
  id: string;
  createdAt: string;
  updatedAt: string;
  task: Snapshot;
  text: string;
  tags: NoteTag[];
  scene?: Scene;
};
export type Journal = {
  schema: 1 | 2;
  entries: Discovery[];
  feedback: Feedback;
};
export const emptyJournal = (): Journal => ({
  schema: 1,
  entries: [],
  feedback: emptyFeedback(),
});
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function date(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() ===
      value.replace(
        /(?:\.(\d{1,3}))?Z$/,
        (_, fraction: string | undefined) =>
          `.${(fraction || "").padEnd(3, "0")}Z`,
      )
  );
}
export function parseJournal(raw: string | null): Journal {
  if (raw === null) return emptyJournal();
  const j = JSON.parse(raw);
  if (
    ![1, 2].includes(j?.schema) ||
    !Array.isArray(j.entries) ||
    j.entries.length > MAX_DISCOVERIES ||
    !j.feedback
  )
    throw Error(
      "Stored notebook format is unsupported or damaged. Existing data was kept; saving is paused.",
    );
  const ids = new Set<string>();
  for (const n of j.entries) {
    const a = n?.task;
    if (
      !text(n?.id, 80) ||
      ids.has(n.id) ||
      !text(n?.text, 280) ||
      /[\r\n]/.test(n.text) ||
      !date(n.createdAt) ||
      !date(n.updatedAt) ||
      !Array.isArray(n.tags) ||
      n.tags.length > 3 ||
      new Set(n.tags).size !== n.tags.length ||
      !n.tags.every((t: unknown) => noteTags.includes(t as NoteTag)) ||
      (Object.hasOwn(n, "scene") &&
        (j.schema !== 2 || !scenes.includes(n.scene))) ||
      !a ||
      !text(a.id, 80) ||
      !text(a.family, 80) ||
      !text(a.version, 80) ||
      !text(a.title, 160) ||
      !text(a.prompt, 280) ||
      !["sound", "perspective", "change", "texture", "edges"].includes(
        a.lens,
      ) ||
      !Array.isArray(a.steps) ||
      a.steps.length !== 3 ||
      !a.steps.every((s: unknown) => text(s, 600)) ||
      !Array.isArray(a.cues) ||
      a.cues.length !== 3 ||
      !a.cues.every((s: unknown) => text(s, 64)) ||
      ![5, 10, 20].includes(a.minutes) ||
      typeof a.still !== "boolean" ||
      !Array.isArray(a.settings) ||
      !a.settings.length ||
      a.settings.length > 4 ||
      new Set(a.settings).size !== a.settings.length ||
      !a.settings.every((s: unknown) =>
        ["street", "park", "garden", "water"].includes(s as string),
      ) ||
      !Array.isArray(a.requires) ||
      a.requires.length > 2 ||
      new Set(a.requires).size !== a.requires.length ||
      !a.requires.every((s: unknown) =>
        ["light", "plant"].includes(s as string),
      )
    )
      throw Error(
        "Stored discovery data could not be read safely. Existing data was kept; saving is paused.",
      );
    ids.add(n.id);
  }
  // Reconstruct only supported fields; do not retain unrecognized personal data.
  return {
    schema: j.schema,
    feedback: parseFeedback(JSON.stringify(j.feedback)),
    entries: j.entries.map((n: Discovery) => ({
      id: n.id,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      text: n.text,
      tags: [...n.tags],
      ...(n.scene === undefined ? {} : { scene: n.scene }),
      task: {
        id: n.task.id,
        title: n.task.title,
        family: n.task.family,
        lens: n.task.lens,
        version: n.task.version,
        steps: [...n.task.steps],
        cues: [...n.task.cues],
        prompt: n.task.prompt,
        minutes: n.task.minutes,
        settings: [...n.task.settings],
        still: n.task.still,
        requires: [...(n.task.requires || [])],
      },
    })),
  };
}
export function snapshot(a: Activity): Snapshot {
  return {
    id: a.id,
    title: a.title,
    family: a.family,
    lens: a.lens,
    version: a.version,
    steps: [...a.steps],
    cues: [...pocketCues[a.id]],
    prompt: a.prompt,
    minutes: a.minutes,
    settings: [...a.settings],
    still: a.still,
    requires: [...(a.requires || [])],
  };
}
export function saveDiscovery(
  j: Journal,
  input: {
    id: string;
    text: string;
    tags: NoteTag[];
    task: Snapshot;
    markDone: boolean;
    scene?: Scene | null;
  },
  now: string,
): Journal {
  const line = input.text.trim().replace(/\s+/g, " ");
  if (!line || line.length > 280)
    throw Error("Write one discovery, up to 280 characters.");
  if (
    input.tags.length > 3 ||
    new Set(input.tags).size !== input.tags.length ||
    input.tags.some((t) => !noteTags.includes(t))
  )
    throw Error("Choose up to three tags.");
  const previous = j.entries.find((n) => n.id === input.id);
  if (input.scene != null && !scenes.includes(input.scene))
    throw Error("Choose a supported scene, or leave it unclassified.");
  // Omitted fields preserve API callers' previous choice; null explicitly clears it.
  const scene = input.scene === undefined ? previous?.scene : input.scene;
  if (!previous && j.entries.length >= MAX_DISCOVERIES)
    throw Error(
      "This notebook has 100 discoveries. Keep or remove an existing entry before adding another; nothing was overwritten.",
    );
  const entry: Discovery = {
    id: input.id,
    text: line,
    tags: [...input.tags],
    task: previous ? previous.task : input.task,
    createdAt: previous ? previous.createdAt : now,
    updatedAt: now,
    ...(scene == null ? {} : { scene }),
  };
  return {
    schema: 2,
    entries: previous
      ? j.entries.map((n) => (n.id === input.id ? entry : n))
      : [entry, ...j.entries],
    feedback:
      !previous && input.markDone
        ? recordFeedback(j.feedback, input.task.id, "done")
        : j.feedback,
  };
}
export function removeDiscovery(j: Journal, id: string): Journal {
  return { ...j, entries: j.entries.filter((n) => n.id !== id) };
}
export function restoreDiscovery(
  j: Journal,
  entry: Discovery,
  index: number,
): Journal {
  if (j.entries.some((n) => n.id === entry.id)) return j;
  if (j.entries.length >= MAX_DISCOVERIES)
    throw Error(
      "Notebook is full. Your deleted discovery is still available to undo after removing another entry.",
    );
  const entries = [...j.entries];
  entries.splice(Math.min(index, entries.length), 0, entry);
  return { ...j, entries };
}
export function knownActivity(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}
