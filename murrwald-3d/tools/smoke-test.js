import { accessSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/vendor/three.module.js",
  "assets/audio/bgm/marzipan-compass.mp3",
  "assets/audio/bgm/sky-garden-relay.mp3",
  "assets/audio/sfx/collect.mp3",
  "assets/audio/sfx/switch.mp3",
  "assets/audio/sfx/push.mp3",
  "assets/audio/sfx/portal.mp3",
  "assets/art/alchemy-cellar.png",
  "assets/art/mushroom-glade.png",
  "assets/art/tower-library.png",
  "assets/art/wizard-garden.png"
];

for (const file of requiredFiles) {
  accessSync(join(root, file));
}

const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "style.css"), "utf8");
const js = readFileSync(join(root, "js/game.js"), "utf8");

const checks = [
  [html.includes("three.module.js"), "local Three.js import map is present"],
  [html.includes("verb-button") && html.includes("Inventar"), "verb and inventory UI are present"],
  [html.includes("guide-button") && html.includes("quest-pointer"), "idiot-proof guide UI is present"],
  [html.includes("star-panel"), "star map puzzle panel is present"],
  [css.includes("grid-template-columns") && css.includes("@media"), "responsive layout rules are present"],
  [css.includes(".quest-pointer") && css.includes(".guide-button"), "guide visuals are styled"],
  [js.includes("class MurrwaldGame"), "game class is present"],
  [js.includes("createPlayer"), "3D player is created"],
  [js.includes("addInteractive"), "interactive object registry is wired"],
  [js.includes("tryUseItemOnObject"), "inventory combination flow is wired"],
  [js.includes("openStarPanel") && js.includes("moon\")"), "star puzzle flow is wired"],
  [js.includes("gatePotion") && js.includes("finishGame"), "endgame potion and finale are wired"],
  [js.includes("createSwitchPuzzle") && js.includes("pushObject"), "switch and push-block puzzle are wired"],
  [js.includes("getGuide") && js.includes("followGuide"), "next-objective guide flow is wired"],
  [js.includes("ASSETS") && js.includes("marzipan-compass.mp3"), "local asset manifest is wired"],
  [js.includes("AudioContext") && js.includes("playTone"), "browser audio feedback is wired"],
  [js.includes("pointerdown") && js.includes("raycaster"), "3D click interaction is wired"],
  [js.includes("nearestInteractive") && js.includes("keydown"), "keyboard interaction fallback is wired"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, label] of failed) {
    console.error(`Missing check: ${label}`);
  }
  process.exit(1);
}

console.log("Murrwald 3D smoke test passed.");
