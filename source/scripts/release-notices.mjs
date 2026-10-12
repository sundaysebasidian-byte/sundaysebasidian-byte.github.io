import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const notices = new URL("docs/third-party-licenses/", root);
let text = `Pocket Field Trip — distribution notices\nOriginal source and artwork: MIT, see LICENSE.\nModel weights are downloaded unchanged and are not included in this build.\nFor exact dependency scope and metadata see docs/THIRD-PARTY.md and docs/DEPENDENCY-LICENSES.json in the accompanying source archive.\nThese collected notices also include development dependencies; their presence is not a claim that all such code is in the browser bundle.\n`;
for (const file of (await readdir(notices)).sort()) {
  text += `\n\n${"=".repeat(72)}\n${file}\n${"=".repeat(72)}\n`;
  text += await readFile(new URL(file, notices), "utf8");
}
await copyFile(new URL("LICENSE", root), new URL("dist/LICENSE", root));
await writeFile(new URL("dist/THIRD-PARTY-NOTICES.txt", root), text);
console.log("Release LICENSE and upstream notices copied.");
