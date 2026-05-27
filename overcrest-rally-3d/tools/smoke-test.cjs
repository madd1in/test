const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "README.md",
  "package.json",
  "assets/vendor/three.module.js",
  "js/tracks.js",
  "js/game.js",
  "tools/serve.cjs",
];

for (const file of required) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing ${file}`);
  }
}

for (const file of ["js/tracks.js", "js/game.js"]) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
}

(async () => {
  const { STAGES, sampleStage, nearestStageInfo, nextPaceNote } = await import(
    pathToFileURL(path.join(root, "js/tracks.js"))
  );

  if (!Array.isArray(STAGES) || STAGES.length !== 3) {
    throw new Error("Expected exactly three rally stages");
  }

  for (const stage of STAGES) {
    if (stage.totalLength < 700) throw new Error(`${stage.name} is too short`);
    if (stage.segments.length !== stage.points.length - 1) throw new Error(`${stage.name} segment mismatch`);
    if (stage.splits.length < 3) throw new Error(`${stage.name} needs more splits`);
    if (stage.notes.length < 8) throw new Error(`${stage.name} needs more pace notes`);
    if (stage.obstacles.length < 6) throw new Error(`${stage.name} needs more hazards`);

    const sample = sampleStage(stage, stage.totalLength * 0.42, 2);
    const nearest = nearestStageInfo(stage, sample.x, sample.z);
    if (nearest.distance > 2.2) throw new Error(`${stage.name} nearest lookup drifted`);

    const note = nextPaceNote(stage, stage.totalLength * 0.5);
    if (!note || typeof note.text !== "string") throw new Error(`${stage.name} pace note lookup failed`);
  }

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  if (!html.includes('type="module" src="js/game.js"')) {
    throw new Error("Game module script tag is missing");
  }

  const vendorSize = fs.statSync(path.join(root, "assets/vendor/three.module.js")).size;
  if (vendorSize < 1000000) {
    throw new Error("Three.js vendor file looks truncated");
  }

  console.log("Overcrest Rally 3D smoke test passed");
  console.log(`Stages: ${STAGES.map((stage) => stage.name).join(", ")}`);
})();
