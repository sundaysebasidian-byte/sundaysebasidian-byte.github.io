import { curatedCombinations, baseMetadata, type Lens } from "./lenses.ts";
import type { CompositionReceipt } from "./combinations.ts";
export type Feature = "light" | "plant";
export type Setting = "street" | "park" | "garden" | "water";
export type BaseActivity = {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  settings: Setting[];
  still: boolean;
  requires?: Feature[];
  tags: string[];
  meaning: string;
  steps: [string, string, string];
  takeaway: string;
};
export type Activity = BaseActivity & {
  family: string;
  lens: Lens;
  version: string;
  prompt: string;
  cues?: [string, string, string];
  composition?: CompositionReceipt;
};
const baseActivities: BaseActivity[] = [
  {
    id: "sound-map",
    title: "Make a sound map",
    subtitle: "Let the world come to you.",
    minutes: 5,
    settings: ["street", "park", "garden", "water"],
    still: true,
    tags: ["listen", "quiet", "sound", "birds"],
    meaning:
      "Slow down an overwhelmed busy mind. Pause in one place and listen to nearby and distant sounds, birdsong, wind and rustling. Ground yourself without walking.",
    steps: [
      "Find a safe place to sit or stand. Leave your headphones off.",
      "Listen for three layers: close, across the space, and far away.",
      "Choose the smallest sound. Follow it with your attention for one minute.",
    ],
    takeaway: "Bring back one sound you had been missing.",
  },
  {
    id: "shadow-study",
    title: "Follow a little shadow",
    subtitle: "A tiny lesson in paying attention.",
    minutes: 5,
    settings: ["street", "park", "garden"],
    still: true,
    requires: ["light"],
    tags: ["shadow", "light", "notice", "shapes"],
    meaning:
      "Discover overlooked beauty in ordinary places. Study sunlight, shadows, patterns and shapes cast by a plant, railing or tree. A small creative observation.",
    steps: [
      "Choose one interesting shadow on a safe patch of ground.",
      "Trace its outline with your eyes. Find a shape inside the shape.",
      "Look up at what made it. Compare the object with its silhouette.",
    ],
    takeaway: "Bring back a shape, not a photograph.",
  },
  {
    id: "sky-pause",
    title: "Borrow a piece of sky",
    subtitle: "Room for a thought to loosen.",
    minutes: 5,
    settings: ["street", "park", "garden", "water"],
    still: true,
    tags: ["sky", "clouds", "rest", "calm"],
    meaning:
      "Need a break and a wider perspective. Quietly watch clouds and the open sky from a safe outdoor spot. Rest eyes and allow thoughts to wander.",
    steps: [
      "Settle where you can see the sky without looking at the sun.",
      "Pick one cloud edge or patch of blue. Notice how it changes.",
      "Let one unfinished thought wait until you go back inside.",
    ],
    takeaway: "Bring back a little more room.",
  },
  {
    id: "texture-walk",
    title: "Read the world in textures",
    subtitle: "An ordinary block, freshly seen.",
    minutes: 10,
    settings: ["street", "park", "garden"],
    still: false,
    tags: ["texture", "creative", "details", "walk"],
    meaning:
      "Get unstuck creatively with a short walk. Notice rough bark, smooth stones, weathered walls and surprising tiny details. Find inspiration without a camera.",
    steps: [
      "Take a familiar, accessible path. Look for three different surfaces.",
      "Notice rough, smooth, and something in between. You can simply look.",
      "Choose a texture you would use to describe today.",
    ],
    takeaway: "Bring back one new word for a familiar place.",
  },
  {
    id: "color-quest",
    title: "Collect a color, with your eyes",
    subtitle: "A little treasure hunt.",
    minutes: 10,
    settings: ["street", "park", "garden"],
    still: false,
    tags: ["color", "curious", "explore", "play"],
    meaning:
      "Feel curious and playful. Explore your neighborhood and search for colors in leaves, doors, flowers and tiny details. A short visual treasure hunt.",
    steps: [
      "Pick a color before you start walking along a safe route.",
      "Find it in three different things. Leave each exactly where it is.",
      "Find the softest version of that color before heading back.",
    ],
    takeaway: "Bring back a color you will notice tomorrow.",
  },
  {
    id: "tree-neighbor",
    title: "Meet your tree neighbor",
    subtitle: "One tree. More than you expected.",
    minutes: 10,
    settings: ["park", "garden", "street"],
    still: true,
    requires: ["plant"],
    tags: ["tree", "nature", "bark", "leaves"],
    meaning:
      "Feel connected to nature and learn about a nearby tree. Observe bark, leaf shapes and how branches move. Tree appreciation without species identification.",
    steps: [
      "Choose a tree you can observe from an accessible spot.",
      "Notice its bark pattern, one leaf shape, and the way its branches move.",
      "Imagine one thing that changed here since this tree was young.",
    ],
    takeaway: "Bring back a neighbor you can recognize again.",
  },
  {
    id: "bird-listen",
    title: "Listen for a feathered neighbor",
    subtitle: "No identification required.",
    minutes: 10,
    settings: ["park", "garden", "water"],
    still: true,
    tags: ["bird", "birds", "song", "wildlife"],
    meaning:
      "Observe birds and wildlife without disturbing them. Listen for birdsong and notice where a bird lands or moves. Quiet birdwatching from a stationary place.",
    steps: [
      "Wait quietly away from nests and feeding animals.",
      "Listen for a repeated phrase. Notice where the sound seems to come from.",
      "If a bird appears, observe from a distance. If none appears, listen to the wind.",
    ],
    takeaway: "Bring back a rhythm, even if the bird stays hidden.",
  },
  {
    id: "garden-watch",
    title: "Visit a very small world",
    subtitle: "The drama below eye level.",
    minutes: 10,
    settings: ["garden", "park"],
    still: true,
    requires: ["plant"],
    tags: ["garden", "plant", "insect", "tiny"],
    meaning:
      "Explore gardening, plants and small creatures. Look closely at a planted bed and observe petals, insects and new growth without touching or picking.",
    steps: [
      "Find a plant or planted bed you can observe without leaving the path.",
      "Look for one new leaf, one older leaf, and a tiny visitor or movement.",
      "Notice how many colors fit inside this one small scene.",
    ],
    takeaway: "Bring back proof that small things are happening.",
  },
  {
    id: "water-rhythm",
    title: "Find the water’s rhythm",
    subtitle: "A softer kind of reset.",
    minutes: 10,
    settings: ["water"],
    still: true,
    tags: ["water", "waves", "rest", "listen"],
    meaning:
      "Unwind by a pond, river or waterfront. Listen to water and notice repeating ripples from a safe dry accessible path. A calming pause without approaching the edge.",
    steps: [
      "Stay on a safe, dry path away from the water’s edge.",
      "Choose a repeating ripple, reflection or sound to follow.",
      "Notice one thing that interrupts the pattern, then let it pass.",
    ],
    takeaway: "Bring back a rhythm slower than your inbox.",
  },
  {
    id: "different-route",
    title: "Take the familiar unfamiliar",
    subtitle: "Your usual walk, one new detail.",
    minutes: 20,
    settings: ["street", "park"],
    still: false,
    tags: ["walk", "move", "explore", "energy"],
    meaning:
      "Move your body and stretch your legs after sitting indoors. Take a longer walk on a familiar accessible route while discovering something new in the neighborhood.",
    steps: [
      "Choose a familiar, safe route you can finish within your time.",
      "Walk at a comfortable pace. Look for a detail you usually pass by.",
      "On the way back, see whether you can spot that detail from a new angle.",
    ],
    takeaway: "Bring back a reason to like your usual route.",
  },
  {
    id: "leaf-story",
    title: "Read a leaf’s little story",
    subtitle: "A season in the palm of your attention.",
    minutes: 5,
    settings: ["park", "garden", "street"],
    still: true,
    requires: ["plant"],
    tags: ["leaf", "autumn", "season", "nature"],
    meaning:
      "Notice autumn and seasonal change. Observe fallen leaves, their colors and veins. A close detail study without picking living plants or removing anything.",
    steps: [
      "Find a fallen leaf you can see from the path. Leave it there.",
      "Notice its edge, veins, and the place where one color becomes another.",
      "Find a second leaf. What looks the same, and what changed?",
    ],
    takeaway: "Bring back one sign of the season.",
  },
  {
    id: "horizon-lines",
    title: "Find three horizon lines",
    subtitle: "A drawing you don’t have to draw.",
    minutes: 5,
    settings: ["street", "park", "garden", "water"],
    still: true,
    tags: ["perspective", "creative", "lines", "look"],
    meaning:
      "Find artistic inspiration and change perspective. Observe the lines of buildings, trees and the horizon. A creative outdoor composition exercise you can do sitting still.",
    steps: [
      "Find a safe place with an open view. Sitting is welcome.",
      "Find three lines: one nearby, one in the middle, one far away.",
      "Notice where they meet. Imagine the scene as a quick sketch.",
    ],
    takeaway: "Bring back a composition only you noticed.",
  },
  {
    id: "small-loop",
    title: "Walk one small loop",
    subtitle: "A little movement. A familiar way back.",
    minutes: 5,
    settings: ["street", "park", "garden"],
    still: false,
    tags: ["walk", "move", "energy", "nearby"],
    meaning:
      "Stretch your legs after sitting indoors. Take a very short comfortable walk on a familiar accessible path, notice one nearby detail and return within five minutes. Gentle movement without a destination.",
    steps: [
      "Choose a short, familiar stretch of safe path. Leave time to return.",
      "Walk at an easy pace. Notice one detail you could see only by moving.",
      "Turn back while the way is still familiar. Notice what changed from this angle.",
    ],
    takeaway: "Bring back a different angle on a familiar place.",
  },
  {
    id: "silent-scene",
    title: "Watch the world on mute",
    subtitle: "Something moves. Something stays.",
    minutes: 5,
    settings: ["street", "park", "garden", "water"],
    still: true,
    tags: ["silent", "quiet", "visual", "movement"],
    meaning:
      "A quiet visual break without listening or walking. Watch one small movement such as fabric, a branch or a passing cloud, then contrast it with something still. Notice ordinary outdoor details with your eyes.",
    steps: [
      "Settle in a safe spot. Find one small thing moving in your view.",
      "Find something still beside it. Shift your attention between the two.",
      "Notice which detail you missed the first time. Leave everything in place.",
    ],
    takeaway: "Bring back a contrast, without needing a sound.",
  },
  {
    id: "water-minute",
    title: "Read one ripple",
    subtitle: "A waterfront pause that fits five minutes.",
    minutes: 5,
    settings: ["water"],
    still: true,
    tags: ["water", "ripple", "reflection", "notice"],
    meaning:
      "Only five minutes beside water. Observe a ripple or reflection from a safe dry stationary spot without approaching the edge. A short visual observation of water patterns; no listening or walking needed.",
    steps: [
      "Stay on a safe dry path, away from the edge. Choose a small patch of water.",
      "Follow one ripple or reflection. Notice where its shape changes.",
      "Look at the same patch once more. Name one difference just to yourself.",
    ],
    takeaway: "Bring back one change you could have walked past.",
  },
  {
    id: "near-far-loop",
    title: "Walk between two views",
    subtitle: "A small walk, a wider picture.",
    minutes: 5,
    settings: ["street", "park", "garden", "water"],
    still: false,
    tags: ["walk", "move", "perspective", "nearby"],
    meaning:
      "Stretch your legs with a five minute out and back walk along a familiar safe accessible path, including a dry waterfront path away from the edge. Compare one near detail with a distant view; gentle movement and a change of perspective.",
    steps: [
      "Choose a short safe path you know. Beside water, stay dry and away from the edge.",
      "Walk a little. Notice one close detail, then one distant shape.",
      "Turn back with time to spare. Find the same two details from your starting spot.",
    ],
    takeaway: "Bring back two ways of seeing the same place.",
  },
];

export const activities: Activity[] = [
  ...baseActivities.map((a) => ({ ...a, ...baseMetadata(a.id) })),
  ...curatedCombinations,
];
