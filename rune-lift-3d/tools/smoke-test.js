import { accessSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/vendor/three.module.js",
  "assets/audio/bgm/catacomb-bell-vault.mp3",
  "assets/audio/sfx/jump.mp3",
  "assets/audio/sfx/land.mp3",
  "assets/audio/sfx/switch.mp3",
  "assets/audio/sfx/reset.mp3"
];

for (const file of requiredFiles) {
  accessSync(join(root, file));
}

const html = readFileSync(join(root, "index.html"), "utf8");
const js = readFileSync(join(root, "js/game.js"), "utf8");

const checks = [
  [html.includes("type=\"module\""), "module script is present"],
  [html.includes("three.module.js"), "local Three.js import map is present"],
  [js.includes("class RuneLiftGame"), "game class is present"],
  [js.includes("pointermove"), "touch drag input is wired"],
  [js.includes("swipe"), "swipe handling is wired"],
  [js.includes("jumpsRemaining"), "double jump assist is wired"],
  [js.includes("recoverPlayer"), "safety recovery is wired"],
  [js.includes("landingForgiveness"), "forgiving platform landing is wired"],
  [js.includes("guideWisps"), "route guide wisps are wired"],
  [js.includes("addSafetyNets"), "visible safety nets are wired"],
  [js.includes("south-helper-bridge"), "easy helper bridges are present"],
  [js.includes("supportWhenGhost"), "visible ghost platforms can stay solid"],
  [js.includes("applyAdaptiveQuality"), "adaptive performance mode is wired"],
  [js.includes("Ebene III"), "expanded level objectives are present"],
  [js.includes("catacomb-bell-vault.mp3"), "BGM is referenced"],
  [js.includes("CanvasTexture"), "generated texture assets are used"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length > 0) {
  for (const [, label] of failed) {
    console.error(`Missing check: ${label}`);
  }
  process.exit(1);
}

console.log("Rune Lift 3D smoke checks passed.");
