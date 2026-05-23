import { accessSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/vendor/three.module.js",
  "assets/art/catacomb-hall.png",
  "assets/art/castle-props.png",
  "assets/art/gothic-atlas.png",
  "assets/audio/bgm/jet-fuel-glory.mp3",
  "assets/audio/bgm/steel-punch-parade.mp3",
  "assets/audio/bgm/gasket-thunder.mp3",
  "assets/audio/bgm/dojo-crash-duel.mp3",
  "assets/audio/bgm/bamboo-arcade.mp3",
  "assets/audio/bgm/turbo-banana-cup.mp3",
  "assets/audio/sfx/arcade-start.mp3",
  "assets/audio/sfx/checkpoint.mp3",
  "assets/audio/sfx/dash.mp3",
  "assets/audio/sfx/gem-pickup.mp3",
  "assets/audio/sfx/impact.mp3",
  "assets/audio/sfx/jump.mp3",
  "assets/audio/sfx/relic-ping.mp3",
  "assets/audio/sfx/curse-fizzle.mp3",
  "assets/audio/sfx/surge-burst.mp3",
  "assets/audio/sfx/danger-tick.mp3"
];

for (const file of requiredFiles) {
  accessSync(join(root, file));
}

const syntax = spawnSync(process.execPath, ["--check", join(root, "js/game.js")], { encoding: "utf8" });
if (syntax.status !== 0) {
  console.error(syntax.stderr || syntax.stdout);
  process.exit(syntax.status || 1);
}

for (const file of requiredFiles.filter((entry) => entry.endsWith(".png"))) {
  const buffer = readFileSync(join(root, file));
  const png = buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG";
  if (!png || buffer.length < 1000) {
    console.error(`Invalid PNG asset: ${file}`);
    process.exit(1);
  }
}

for (const file of requiredFiles.filter((entry) => entry.endsWith(".mp3"))) {
  const buffer = readFileSync(join(root, file));
  const id3 = buffer.toString("ascii", 0, 3);
  const frame = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  if ((id3 !== "ID3" && !frame) || buffer.length < 1000) {
    console.error(`Invalid MP3 asset: ${file}`);
    process.exit(1);
  }
}

const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "style.css"), "utf8");
const js = readFileSync(join(root, "js/game.js"), "utf8");
const removedHudMarker = "f" + "ret-board";
const removedSpawnMarker = "spawn" + "R" + "iffPhrase";

const checks = [
  [html.includes("scene") && html.includes("top-hud"), "canvas and HUD are present"],
  [html.includes("data-touch=\"dash\"") && html.includes("results"), "touch and result UI are present"],
  [html.includes("fever-fill") && html.includes("run-status") && !html.includes(removedHudMarker), "treasure fever HUD is present"],
  [css.includes("@media") && css.includes("grid-template-columns"), "responsive CSS is present"],
  [css.includes("gothic-atlas.png") && css.includes("castle-props.png"), "asset-driven UI polish is present"],
  [js.includes("import * as THREE") && js.includes("WebGLRenderer"), "Three.js renderer is wired"],
  [js.includes("class CryptRunnerGame") && js.includes("createState"), "game state class is wired"],
  [js.includes("spawnPattern") && js.includes("collide(entity)"), "runner spawning and collisions are wired"],
  [js.includes("AudioDeck") && js.includes("gasket-thunder.mp3"), "download audio manifest is wired"],
  [js.includes("buildRelic") && js.includes("relic-ping.mp3"), "relic pickup gameplay is wired"],
  [js.includes("startFever") && js.includes("feverCharge"), "treasure fever gameplay is wired"],
  [js.includes("createMotes") && js.includes("updateLighting"), "atmosphere polish is wired"],
  [js.includes("makeTreasurePile") && js.includes("makeRuneSlab"), "side prop variety is wired"],
  [js.includes("setEnabled(true)") && js.includes("BGM an"), "BGM auto-start path is wired"],
  [!js.includes(removedSpawnMarker), "old note-chain concept is removed"],
  [js.includes("catacomb-hall.png") && js.includes("gothic-atlas.png"), "download image assets are wired"],
  [js.includes("preserveDrawingBuffer") && js.includes("autoplay"), "browser visual test hooks are present"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  failed.forEach(([, label]) => console.error(`Missing check: ${label}`));
  process.exit(1);
}

console.log("Crypt Runner 3D smoke test passed.");
