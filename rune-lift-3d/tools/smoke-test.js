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
  [html.includes("assist-mode-button"), "assist mode selector is present"],
  [html.includes("normal-mode-button"), "normal mode selector is present"],
  [html.includes("quality-button"), "turbo quality toggle is present"],
  [html.includes("fullscreen-button"), "fullscreen toggle is present"],
  [html.includes("Sammle 14 Runen"), "expanded objective count is shown"],
  [html.includes("0/14"), "expanded shard count is shown"],
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
  [js.includes("assistProfiles"), "assist versus normal profiles are wired"],
  [js.includes("setAssistMode"), "runtime assist toggle is wired"],
  [js.includes("toggleFullscreen"), "fullscreen action is wired"],
  [js.includes("requestFullscreen"), "fullscreen request API is wired"],
  [js.includes("fullscreenchange"), "fullscreen state listener is wired"],
  [js.includes("echo-bridge"), "new echo level bridge is present"],
  [js.includes("sunrise-gate"), "new final level island is present"],
  [js.includes("aurora-drift"), "aurora extension platform is present"],
  [js.includes("crown-garden"), "new crown finale island is present"],
  [js.includes("eclipse-causeway"), "new eclipse route is present"],
  [js.includes("star-forge"), "new forge finale island is present"],
  [js.includes("addEclipseHalo"), "eclipse ring graphics are wired"],
  [js.includes("Ebene VI"), "sixth level objectives are present"],
  [js.includes("chrono-archive"), "new chrono archive level is present"],
  [js.includes("zenith-vault"), "new zenith finale island is present"],
  [js.includes("addTimeAnchor"), "two-anchor chrono gate mechanic is wired"],
  [js.includes("addDriftField"), "drift field mechanic is wired"],
  [js.includes("Ebene VII"), "seventh level objectives are present"],
  [js.includes("addGuideCompass"), "target compass is wired"],
  [js.includes("addRouteRails"), "route rail graphics are wired"],
  [js.includes("addWindZone"), "lightweight wind boost zones are wired"],
  [js.includes("addRelayNode"), "relay puzzle nodes are wired"],
  [js.includes("relay-vault"), "relay vault side route is present"],
  [js.includes("addConstellationWeb"), "lightweight constellation graphics are wired"],
  [js.includes("geometryCache"), "platform geometry cache is wired"],
  [js.includes("new THREE.InstancedMesh(new THREE.PlaneGeometry"), "safety nets are batched"],
  [js.includes("Turbo-Modus aktiv"), "manual turbo mode is wired"],
  [js.includes("preload = \"none\""), "audio assets are lazy-loaded"],
  [js.includes("synth(name"), "instant synthetic sfx fallback is wired"],
  [js.includes("Ebene V"), "fifth level objectives are present"],
  [js.includes("performanceMode ? null : new THREE.PointLight"), "mobile point lights are reduced"],
  [js.includes("applyAdaptiveQuality"), "adaptive performance mode is wired"],
  [js.includes("Ebene IV"), "new level objectives are present"],
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
