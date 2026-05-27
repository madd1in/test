import * as THREE from "../assets/vendor/three.module.js";
import {
  STAGES,
  SURFACES,
  clamp,
  nearestStageInfo,
  nextPaceNote,
  roadElevation,
  sampleStage,
} from "./tracks.js";

const canvas = document.getElementById("game");
const miniMap = document.getElementById("miniMap");
const mini = miniMap.getContext("2d");

const ui = {
  menu: document.getElementById("menu"),
  results: document.getElementById("results"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  menuButton: document.getElementById("menuButton"),
  audioButton: document.getElementById("audioButton"),
  stageSelect: document.getElementById("stageSelect"),
  stageMeta: document.getElementById("stageMeta"),
  stageName: document.getElementById("stageName"),
  timeText: document.getElementById("timeText"),
  splitText: document.getElementById("splitText"),
  speedText: document.getElementById("speedText"),
  damageText: document.getElementById("damageText"),
  gripText: document.getElementById("gripText"),
  styleText: document.getElementById("styleText"),
  noteText: document.getElementById("noteText"),
  surfaceText: document.getElementById("surfaceText"),
  toast: document.getElementById("toast"),
  resultTitle: document.getElementById("resultTitle"),
  resultStats: document.getElementById("resultStats"),
};

const DRIVE_FORCE = 44;
const BRAKE_FORCE = 58;
const REVERSE_FORCE = 22;
const TURN_RATE = 2.25;
const CAR_HALF_WIDTH = 1.45;
const MAX_DAMAGE = 100;
const GRAVITY = 24;
const JUMP_TRIGGER_LENGTH = 16;
const keys = new Set();
const touch = new Set();
const clock = new THREE.Clock();
const tmpVector = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraLook = new THREE.Vector3();
const urlParams = new URLSearchParams(window.location.search);

let stage = STAGES[0];
let materials = {};
let running = false;
let paused = false;
let finished = false;
let demoMode = false;
let countdown = 0;
let elapsed = 0;
let toastTimer = 0;
let activeSurface = "road";
let currentSplit = 0;
let lastNoteText = "";
let obstacles = [];
let gates = [];
let jumpMarkers = [];
let dustParticles = [];
let weatherSystem = null;
let driftSfxBucket = 0;
let currentGrip = 1;
let activeZone = null;

const audio = {
  enabled: true,
  music: null,
  sfx: {},
  master: 0.72,
};

const car = {
  group: null,
  body: null,
  wheels: [],
  frontWheels: [],
  position: new THREE.Vector3(),
  velocity: { x: 0, z: 0 },
  heading: 0,
  yVelocity: 0,
  airborne: false,
  airTime: 0,
  suspension: 0,
  slip: 0,
  lastJumpId: "",
  progress: 0,
  bestProgress: 0,
  lateral: 0,
  damage: 0,
  driftScore: 0,
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const textureLoader = new THREE.TextureLoader();
const imagenAtlasTexture = textureLoader.load("assets/imagen/overcrest-rally-imagen-atlas.png");
imagenAtlasTexture.colorSpace = THREE.SRGBColorSpace;
imagenAtlasTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
const carDecalMaterial = new THREE.MeshStandardMaterial({
  map: atlasRegion(0.52, 0.72, 0.44, 0.2),
  roughness: 0.46,
  metalness: 0.12,
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 700);
const worldGroup = new THREE.Group();
const carGroup = new THREE.Group();
const fxGroup = new THREE.Group();

scene.add(worldGroup);
scene.add(carGroup);
scene.add(fxGroup);

const hemi = new THREE.HemisphereLight(0xffffff, 0x33443d, 1.05);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(-44, 72, 36);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 4;
sun.shadow.camera.far = 220;
sun.shadow.camera.left = -150;
sun.shadow.camera.right = 150;
sun.shadow.camera.top = 150;
sun.shadow.camera.bottom = -150;
scene.add(sun);

setupStagePicker();
setupInput();
setupButtons();
setupAudio();
car.group = createCar();
carGroup.add(car.group);
loadStage(0);
resize();
window.addEventListener("resize", resize);
renderer.setAnimationLoop(tick);

window.overcrestRally = {
  getState: () => ({
    stage: stage.name,
    running,
    paused,
    finished,
    elapsed,
    progress: car.bestProgress,
    damage: car.damage,
    driftScore: car.driftScore,
    surface: activeSurface,
    grip: currentGrip,
    airborne: car.airborne,
    airTime: car.airTime,
    slip: car.slip,
    audioEnabled: audio.enabled,
  }),
  startDemo: () => startStage(true),
};

if (urlParams.get("demo") === "1") {
  demoMode = true;
  window.setTimeout(() => startStage(true), 250);
}

function setupStagePicker() {
  for (const stageOption of STAGES) {
    const option = document.createElement("option");
    option.value = stageOption.id;
    option.textContent = stageOption.name;
    ui.stageSelect.append(option);
  }

  ui.stageSelect.addEventListener("change", () => {
    const index = STAGES.findIndex((candidate) => candidate.id === ui.stageSelect.value);
    loadStage(index < 0 ? 0 : index);
    playSfx("select");
    playMusicForStage();
  });
}

function setupButtons() {
  ui.startButton.addEventListener("click", () => startStage(false));
  ui.restartButton.addEventListener("click", () => startStage(false));
  ui.menuButton.addEventListener("click", openMenu);
  ui.audioButton.addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    ui.audioButton.textContent = audio.enabled ? "Audio On" : "Audio Off";
    if (audio.enabled) {
      playSfx("select");
      playMusicForStage();
    } else {
      stopMusic();
    }
  });
}

function setupAudio() {
  const names = ["start", "split", "hit", "finish", "select", "drift"];
  for (const name of names) {
    const clip = new Audio(audioUrl(`sfx-${name}.wav`));
    clip.preload = "auto";
    clip.volume = 0.5 * audio.master;
    audio.sfx[name] = clip;
  }
  ui.audioButton.textContent = audio.enabled ? "Audio On" : "Audio Off";
}

function setupInput() {
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }

    if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat && running && !finished) {
      paused = !paused;
      showToast(paused ? "Paused" : "Go");
    }

    if (event.code === "KeyR" && !event.repeat) {
      startStage(false);
    }

    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const press = (event) => {
      event.preventDefault();
      touch.add(control);
      button.classList.add("active");
    };
    const release = (event) => {
      event.preventDefault();
      touch.delete(control);
      button.classList.remove("active");
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });
}

function loadStage(index) {
  stage = STAGES[index];
  ui.stageSelect.value = stage.id;
  ui.stageName.textContent = stage.name;
  ui.stageMeta.textContent = `${Math.round(stage.totalLength)} m | ${stage.surface} | ${stage.weather}`;
  ui.splitText.textContent = "--";
  ui.noteText.textContent = "Overcrest";
  activeSurface = "road";
  currentSplit = 0;
  lastNoteText = "";
  running = false;
  paused = false;
  finished = false;
  countdown = 0;
  elapsed = 0;

  clearGroup(worldGroup);
  clearGroup(fxGroup);
  dustParticles = [];
  obstacles = [];
  gates = [];
  jumpMarkers = [];
  activeZone = null;
  currentGrip = 1;
  materials = createStageMaterials(stage);

  scene.background = new THREE.Color(stage.palette.sky);
  scene.fog = new THREE.Fog(stage.palette.fog, 85, 430);

  worldGroup.add(createTerrain(stage));
  worldGroup.add(createRibbonMesh(stage, stage.width + 18, materials.shoulder, -0.06, 4));
  worldGroup.add(createRibbonMesh(stage, stage.width, materials.road, 0.02, 3));
  worldGroup.add(createRoadPaint(stage));
  buildSurfaceZones(stage);
  buildJumpMarkers(stage);
  buildGates(stage);
  buildObstacles(stage);
  buildImagenTrackside(stage);
  buildScenery(stage);
  weatherSystem = createWeatherSystem(stage);
  if (weatherSystem) worldGroup.add(weatherSystem.points);

  resetCar();
  updateHud();
  drawMiniMap();
  updateCamera(1);
  playMusicForStage();
}

function startStage(isDemo) {
  demoMode = isDemo;
  ui.menu.classList.add("hidden");
  ui.menu.classList.remove("active");
  ui.results.classList.add("hidden");
  ui.results.classList.remove("active");
  resetCar();
  running = true;
  paused = false;
  finished = false;
  countdown = 1.35;
  elapsed = 0;
  currentSplit = 0;
  driftSfxBucket = 0;
  showToast("Ready");
  playMusicForStage();
  playSfx("start");
}

function openMenu() {
  running = false;
  paused = false;
  finished = false;
  demoMode = false;
  ui.results.classList.add("hidden");
  ui.results.classList.remove("active");
  ui.menu.classList.remove("hidden");
  ui.menu.classList.add("active");
  resetCar();
  stopMusic();
}

function resetCar() {
  const start = sampleStage(stage, 3, 0);
  car.position.set(start.x, start.y + 0.7, start.z);
  car.velocity.x = 0;
  car.velocity.z = 0;
  car.heading = start.angle;
  car.yVelocity = 0;
  car.airborne = false;
  car.airTime = 0;
  car.suspension = 0;
  car.slip = 0;
  car.lastJumpId = "";
  car.progress = 0;
  car.bestProgress = 0;
  car.lateral = 0;
  car.damage = 0;
  car.driftScore = 0;
  car.group.position.copy(car.position);
  car.group.rotation.y = car.heading;
  car.body.rotation.set(0, 0, 0);
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.033);

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.remove("visible");
  }

  updateWeather(dt);

  if (running && !paused && !finished) {
    if (countdown > 0) {
      countdown -= dt;
      if (countdown <= 0) showToast("Go");
    } else {
      elapsed += dt;
      updateCar(dt);
      updateDust(dt);
      updateSplitsAndFinish();
    }
  } else {
    updateDust(dt);
  }

  updateCarVisual(dt);
  updateCamera(dt);
  updateHud();
  drawMiniMap();
  renderer.render(scene, camera);
}

function updateCar(dt) {
  const controls = readControls();
  const before = nearestStageInfo(stage, car.position.x, car.position.z);
  const absLateral = Math.abs(before.lateral);
  const roadEdge = stage.width / 2;

  activeSurface = "road";
  if (absLateral > roadEdge) activeSurface = "shoulder";
  if (absLateral > roadEdge + 8) activeSurface = "offroad";
  activeZone = findSurfaceZone(stage, before.progress, before.lateral);
  if (activeZone) activeSurface = activeZone.type;

  const surface = SURFACES[activeSurface];
  const wetFactor = stage.weather === "rain" ? 0.82 : 1;
  const snowFactor = stage.weather === "snow" ? 0.9 : 1;
  const airborneFactor = car.airborne ? 0.22 : 1;
  const forwardX = Math.sin(car.heading);
  const forwardZ = Math.cos(car.heading);
  const rightX = Math.cos(car.heading);
  const rightZ = -Math.sin(car.heading);
  const forwardSpeed = car.velocity.x * forwardX + car.velocity.z * forwardZ;
  const lateralSpeed = car.velocity.x * rightX + car.velocity.z * rightZ;
  const speed = Math.hypot(car.velocity.x, car.velocity.z);
  car.slip = speed > 0.1 ? Math.abs(lateralSpeed) / Math.max(speed, 1) : 0;
  currentGrip = clamp((surface.grip / SURFACES.road.grip) * wetFactor * airborneFactor, 0.08, 1.15);
  const throttle = controls.throttle;
  const brake = controls.brake;

  let drive = throttle * DRIVE_FORCE * snowFactor;
  if (brake > 0 && forwardSpeed > 1.5) {
    drive -= BRAKE_FORCE * brake;
  } else if (brake > 0) {
    drive -= REVERSE_FORCE * brake;
  }

  car.velocity.x += forwardX * drive * dt;
  car.velocity.z += forwardZ * drive * dt;

  const steerSpeed = clamp(Math.abs(forwardSpeed) / 34, 0.18, 1.18);
  const handbrakeBoost = controls.handbrake ? 1.48 : 1;
  const damageSteer = 1 - car.damage * 0.003;
  car.heading += controls.steer * TURN_RATE * handbrakeBoost * steerSpeed * damageSteer * airborneFactor * dt * Math.sign(forwardSpeed || 1);

  const lateralGrip = (controls.handbrake ? surface.handbrakeGrip : surface.grip) * wetFactor * airborneFactor;
  car.velocity.x -= rightX * lateralSpeed * lateralGrip * dt;
  car.velocity.z -= rightZ * lateralSpeed * lateralGrip * dt;

  const drag = surface.drag + (car.damage / MAX_DAMAGE) * 0.35 + Math.min(car.slip, 1.8) * 0.08;
  const dragFactor = Math.max(0, 1 - drag * dt);
  car.velocity.x *= dragFactor;
  car.velocity.z *= dragFactor;

  const speedAfterDrag = Math.hypot(car.velocity.x, car.velocity.z);
  const maxSpeed = surface.maxSpeed * (1 - car.damage * 0.0035);
  if (speedAfterDrag > maxSpeed) {
    const scale = maxSpeed / speedAfterDrag;
    car.velocity.x *= scale;
    car.velocity.z *= scale;
  }

  car.position.x += car.velocity.x * dt;
  car.position.z += car.velocity.z * dt;

  const after = nearestStageInfo(stage, car.position.x, car.position.z);
  car.progress = after.progress;
  car.lateral = after.lateral;
  const forwardAlongStage = car.velocity.x * after.tangent.x + car.velocity.z * after.tangent.z;
  if (after.progress > car.bestProgress && forwardAlongStage > -8 && Math.abs(after.lateral) < stage.width + 16) {
    car.bestProgress = after.progress;
  }

  const roadY = roadElevation(stage, after.progress);
  triggerJumpIfNeeded(after, speed);
  updateVerticalPhysics(dt, roadY, speed);

  if (Math.abs(after.lateral) > roadEdge + 16) {
    const side = Math.sign(after.lateral);
    const overshoot = Math.abs(after.lateral) - (roadEdge + 16);
    car.position.x -= after.normal.x * side * overshoot * clamp(dt * 4.5, 0, 1);
    car.position.z -= after.normal.z * side * overshoot * clamp(dt * 4.5, 0, 1);
    car.velocity.x *= 0.86;
    car.velocity.z *= 0.86;
    addDamage(dt * 9, "Boundary");
  }

  if (activeSurface === "offroad" && speed > 18) {
    addDamage((speed - 18) * dt * 0.06, "");
  }

  collideWithObstacles(dt);
  updateDriftScore(dt, lateralSpeed, speed, controls.handbrake);

  if (speed > 13 && (activeSurface !== "road" || Math.abs(lateralSpeed) > 7 || throttle > 0.5)) {
    spawnDust(activeSurface, speed);
  }
}

function findSurfaceZone(activeStage, progress, lateral) {
  for (const zone of activeStage.surfaceZones) {
    const distance = Math.abs(progress - zone.progress);
    if (distance <= zone.length / 2 && Math.abs(lateral - zone.lateral) <= zone.width / 2) {
      return zone;
    }
  }
  return null;
}

function triggerJumpIfNeeded(trackInfo, speed) {
  if (car.airborne || speed < 23) return;

  const jump = stage.jumps.find((candidate) => {
    const distance = Math.abs(trackInfo.progress - candidate.progress);
    return distance < JUMP_TRIGGER_LENGTH / 2 && Math.abs(trackInfo.lateral) < candidate.width / 2;
  });

  if (!jump || car.lastJumpId === jump.id) return;

  car.lastJumpId = jump.id;
  car.airborne = true;
  car.airTime = 0;
  car.yVelocity = jump.force + speed * 0.055;
  car.driftScore += Math.round(speed * 0.9);
  showToast(jump.label);
  playSfx("drift");
}

function updateVerticalPhysics(dt, roadY, speed) {
  const targetY = roadY + 0.7;
  if (car.airborne) {
    car.airTime += dt;
    car.yVelocity -= GRAVITY * dt;
    car.position.y += car.yVelocity * dt;

    if (car.position.y <= targetY && car.yVelocity < 0) {
      const landingForce = Math.abs(car.yVelocity);
      car.position.y = targetY;
      car.airborne = false;
      car.suspension = clamp(landingForce / 18, 0, 1.8);
      if (landingForce > 13.5 || Math.abs(car.lateral) > stage.width * 0.58) {
        addDamage((landingForce - 10) * 0.65, "Landing");
        playSfx("hit");
      } else {
        car.driftScore += Math.round(car.airTime * speed * 7);
        showToast("Clean landing");
        playSfx("split");
      }
    }
    return;
  }

  const bump = Math.sin(car.progress * 0.16 + stage.scenerySeed) * 0.025 + Math.sin(car.progress * 0.047) * 0.035;
  car.position.y += (targetY + bump - car.position.y) * clamp(dt * 12, 0, 1);
  car.suspension += ((Math.abs(bump) * 12 + car.slip * 0.15) - car.suspension) * clamp(dt * 8, 0, 1);

  if (car.lastJumpId) {
    const oldJump = stage.jumps.find((jump) => jump.id === car.lastJumpId);
    if (!oldJump || Math.abs(car.progress - oldJump.progress) > JUMP_TRIGGER_LENGTH * 1.8) {
      car.lastJumpId = "";
    }
  }
}

function readControls() {
  if (demoMode) {
    const target = sampleStage(stage, clamp(car.bestProgress + 38, 0, stage.totalLength));
    const desired = Math.atan2(target.x - car.position.x, target.z - car.position.z);
    const diff = angleDelta(car.heading, desired);
    const speed = Math.hypot(car.velocity.x, car.velocity.z);
    return {
      throttle: 1,
      brake: diff > 0.95 && speed > 28 ? 0.45 : 0,
      steer: clamp(diff * 1.45, -1, 1),
      handbrake: Math.abs(diff) > 0.55 && speed > 24,
    };
  }

  const left = isDown("KeyA", "ArrowLeft") || touch.has("left");
  const right = isDown("KeyD", "ArrowRight") || touch.has("right");
  return {
    throttle: isDown("KeyW", "ArrowUp") || touch.has("accelerate") ? 1 : 0,
    brake: isDown("KeyS", "ArrowDown") || touch.has("brake") ? 1 : 0,
    steer: (left ? 1 : 0) - (right ? 1 : 0),
    handbrake: isDown("Space", "ShiftLeft", "ShiftRight") || touch.has("handbrake"),
  };
}

function isDown(...codes) {
  return codes.some((code) => keys.has(code));
}

function collideWithObstacles(dt) {
  for (const obstacle of obstacles) {
    obstacle.cooldown = Math.max(0, obstacle.cooldown - dt);
    const dx = car.position.x - obstacle.position.x;
    const dz = car.position.z - obstacle.position.z;
    const distance = Math.hypot(dx, dz);
    const limit = obstacle.radius + CAR_HALF_WIDTH;

    if (distance > limit) continue;

    const nx = distance === 0 ? 1 : dx / distance;
    const nz = distance === 0 ? 0 : dz / distance;
    const speed = Math.hypot(car.velocity.x, car.velocity.z);
    const overlap = limit - distance;
    car.position.x += nx * overlap;
    car.position.z += nz * overlap;
    car.velocity.x = car.velocity.x * -0.22 + nx * speed * 0.18;
    car.velocity.z = car.velocity.z * -0.22 + nz * speed * 0.18;

    if (obstacle.cooldown <= 0 && speed > 6) {
      obstacle.cooldown = 0.6;
      addDamage(clamp(speed * 0.18, 1.2, 12), "Impact");
      obstacle.mesh.rotation.y += 0.35;
      showToast("Impact");
      playSfx("hit");
    }
  }
}

function updateDriftScore(dt, lateralSpeed, speed, handbrake) {
  if ((handbrake || Math.abs(lateralSpeed) > 9) && speed > 22 && activeSurface !== "offroad") {
    const gain = Math.abs(lateralSpeed) * speed * dt * 0.08;
    car.driftScore += gain;
    const bucket = Math.floor(car.driftScore / 220);
    if (bucket > driftSfxBucket) {
      driftSfxBucket = bucket;
      playSfx("drift");
    }
  }
}

function updateSplitsAndFinish() {
  while (currentSplit < stage.splits.length && car.bestProgress >= stage.splits[currentSplit].progress) {
    const split = stage.splits[currentSplit];
    ui.splitText.textContent = `${split.label} ${formatTime(elapsed)}`;
    showToast(`${split.label} ${formatTime(elapsed)}`);
    playSfx("split");
    gates[currentSplit]?.mesh.traverse((child) => {
      if (child.material?.emissive) child.material.emissive.setHex(stage.palette.accent);
    });
    currentSplit += 1;
  }

  if (car.bestProgress >= stage.totalLength - 8) {
    finishStage();
  }
}

function finishStage() {
  finished = true;
  running = false;
  const delta = elapsed - stage.goalTime;
  const rank = delta <= -5 && car.damage < 20 ? "Gold" : delta <= 8 && car.damage < 45 ? "Silver" : "Bronze";
  ui.resultTitle.textContent = `${rank} Finish`;
  ui.resultStats.textContent = `${formatTime(elapsed)} | Damage ${Math.round(car.damage)}% | Style ${Math.round(car.driftScore)}`;
  ui.results.classList.remove("hidden");
  ui.results.classList.add("active");
  showToast("Stage complete");
  playSfx("finish");
}

function addDamage(amount, label) {
  if (amount <= 0 || car.damage >= MAX_DAMAGE) return;
  const before = car.damage;
  car.damage = clamp(car.damage + amount, 0, MAX_DAMAGE);
  if (label && Math.floor(before / 20) !== Math.floor(car.damage / 20)) {
    showToast(`${label} damage`);
  }
}

function updateCarVisual(dt) {
  const speed = Math.hypot(car.velocity.x, car.velocity.z);
  const nearest = nearestStageInfo(stage, car.position.x, car.position.z);
  const roadY = roadElevation(stage, nearest.progress);
  car.group.position.set(car.position.x, roadY + 0.72, car.position.z);
  car.group.rotation.y = car.heading;

  const lateralTilt = clamp(car.lateral / (stage.width * 3), -0.16, 0.16);
  const speedTilt = clamp(speed / 80, 0, 1) * 0.06;
  const jumpPitch = car.airborne ? clamp(car.yVelocity * 0.025, -0.28, 0.22) : 0;
  const suspensionDip = clamp(car.suspension * 0.08, 0, 0.18);
  car.body.rotation.z += (-lateralTilt - car.body.rotation.z) * clamp(dt * 8, 0, 1);
  car.body.rotation.x += ((speedTilt - 0.04 - suspensionDip + jumpPitch) - car.body.rotation.x) * clamp(dt * 7, 0, 1);

  for (const wheel of car.wheels) {
    wheel.rotation.x -= speed * dt * 2.5;
  }

  const steer = readControls().steer;
  for (const wheel of car.frontWheels) {
    wheel.rotation.y = steer * 0.42;
  }
}

function updateCamera(dt) {
  const speed = Math.hypot(car.velocity.x, car.velocity.z);
  const forwardX = Math.sin(car.heading);
  const forwardZ = Math.cos(car.heading);
  const distance = 13 + speed * 0.08;
  const height = 6.5 + speed * 0.035;

  tmpVector.set(
    car.group.position.x - forwardX * distance,
    car.group.position.y + height,
    car.group.position.z - forwardZ * distance,
  );
  camera.position.lerp(tmpVector, clamp(dt * 5.8, 0, 1));

  cameraLook.set(
    car.group.position.x + forwardX * (10 + speed * 0.08),
    car.group.position.y + 2.2,
    car.group.position.z + forwardZ * (10 + speed * 0.08),
  );
  cameraTarget.lerp(cameraLook, clamp(dt * 7, 0, 1));
  camera.lookAt(cameraTarget);
}

function updateHud() {
  const speed = Math.round(Math.hypot(car.velocity.x, car.velocity.z) * 3.2);
  const note = nextPaceNote(stage, car.bestProgress);
  if (note.text !== lastNoteText) {
    lastNoteText = note.text;
    ui.noteText.textContent = note.text;
  }

  ui.timeText.textContent = formatTime(elapsed);
  ui.speedText.textContent = String(speed);
  ui.damageText.textContent = `${Math.round(car.damage)}%`;
  ui.gripText.textContent = `${Math.round(currentGrip * 100)}`;
  ui.styleText.textContent = `${Math.round(car.driftScore)}`;
  ui.surfaceText.textContent = activeZone?.label || SURFACES[activeSurface].label;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  toastTimer = 1.5;
}

function playMusicForStage() {
  if (!audio.enabled || !stage.music) return;
  const src = audioUrl(stage.music);
  if (!audio.music) {
    audio.music = new Audio(src);
    audio.music.loop = true;
    audio.music.volume = 0.24 * audio.master;
  }
  if (audio.music.src !== src) {
    audio.music.pause();
    audio.music.src = src;
    audio.music.currentTime = 0;
  }
  audio.music.play().catch(() => {});
}

function stopMusic() {
  if (!audio.music) return;
  audio.music.pause();
}

function playSfx(name) {
  if (!audio.enabled || !audio.sfx[name]) return;
  const clip = audio.sfx[name].cloneNode();
  clip.volume = audio.sfx[name].volume;
  clip.play().catch(() => {});
}

function audioUrl(fileName) {
  return new URL(`../assets/audio/${fileName}`, import.meta.url).href;
}

function createStageMaterials(activeStage) {
  const textures = createTextures(activeStage);
  return {
    terrain: new THREE.MeshStandardMaterial({
      color: activeStage.palette.ground,
      map: textures.ground,
      roughness: 0.92,
      metalness: 0.02,
    }),
    shoulder: new THREE.MeshStandardMaterial({
      color: activeStage.palette.shoulder,
      map: textures.shoulder,
      roughness: 0.95,
      metalness: 0.01,
    }),
    road: new THREE.MeshStandardMaterial({
      color: activeStage.palette.road,
      map: textures.road,
      roughness: activeStage.weather === "rain" ? 0.4 : 0.82,
      metalness: activeStage.weather === "rain" ? 0.08 : 0.02,
    }),
    paint: new THREE.MeshStandardMaterial({
      color: activeStage.palette.accent,
      emissive: activeStage.palette.accent,
      emissiveIntensity: 0.28,
      roughness: 0.65,
    }),
    pole: new THREE.MeshStandardMaterial({ color: 0xf4f7ef, roughness: 0.58 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x141819, roughness: 0.8 }),
    rock: new THREE.MeshStandardMaterial({ color: 0x5e625c, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6a4730, roughness: 0.86 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x245f45, roughness: 0.78 }),
    accent: new THREE.MeshStandardMaterial({
      color: activeStage.palette.accent,
      emissive: activeStage.palette.accent,
      emissiveIntensity: 0.2,
      roughness: 0.5,
    }),
    imagenPoster: new THREE.MeshStandardMaterial({
      map: atlasRegion(0, 0.5, 0.5, 0.5),
      roughness: 0.5,
      metalness: 0.05,
    }),
    imagenChevron: new THREE.MeshStandardMaterial({
      map: atlasRegion(0.52, 0.42, 0.44, 0.22),
      roughness: 0.62,
      metalness: 0.04,
    }),
    imagenSplash: new THREE.MeshBasicMaterial({
      map: atlasRegion(0.43, 0.08, 0.5, 0.18),
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    }),
    dust: new THREE.MeshBasicMaterial({
      color: activeStage.weather === "snow" ? 0xf1f6f2 : activeStage.weather === "rain" ? 0xbad2d5 : 0xd9b17c,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  };
}

function atlasRegion(x, y, width, height) {
  const texture = imagenAtlasTexture.clone();
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.offset.set(x, y);
  texture.repeat.set(width, height);
  texture.needsUpdate = true;
  return texture;
}

function createTextures(activeStage) {
  return {
    road: canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = hex(activeStage.palette.road);
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 180; i += 1) {
        const gray = 70 + Math.floor(randomHash(i + activeStage.scenerySeed) * 55);
        ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.22)`;
        ctx.fillRect(randomHash(i * 2) * 256, randomHash(i * 3) * 256, 1 + randomHash(i) * 18, 1);
      }
      if (activeStage.weather === "rain") {
        ctx.fillStyle = "rgba(190, 225, 230, 0.16)";
        for (let i = 0; i < 20; i += 1) {
          ctx.fillRect(0, i * 14 + 4, 256, 2);
        }
      }
    }, 10, 4),
    shoulder: canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = hex(activeStage.palette.shoulder);
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 220; i += 1) {
        ctx.fillStyle = `rgba(45, 38, 28, ${0.08 + randomHash(i) * 0.18})`;
        ctx.beginPath();
        ctx.arc(randomHash(i * 5) * 256, randomHash(i * 7) * 256, 1 + randomHash(i * 9) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }, 9, 9),
    ground: canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = hex(activeStage.palette.ground);
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 120; i += 1) {
        ctx.strokeStyle = `rgba(255,255,255,${activeStage.weather === "snow" ? 0.14 : 0.04})`;
        ctx.beginPath();
        ctx.moveTo(randomHash(i) * 256, randomHash(i + 10) * 256);
        ctx.lineTo(randomHash(i + 20) * 256, randomHash(i + 30) * 256);
        ctx.stroke();
      }
    }, 18, 18),
  };
}

function canvasTexture(width, height, draw, repeatX, repeatY) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = width;
  textureCanvas.height = height;
  const ctx = textureCanvas.getContext("2d");
  draw(ctx);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
  return texture;
}

function createTerrain(activeStage) {
  const bounds = activeStage.bounds;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const size = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) + 260;
  const geometry = new THREE.PlaneGeometry(size, size, 72, 72);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i) + centerX;
    const z = position.getZ(i) + centerZ;
    position.setY(i, terrainHeight(activeStage, x, z));
  }
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, materials.terrain);
  mesh.position.set(centerX, 0, centerZ);
  mesh.receiveShadow = true;
  return mesh;
}

function terrainHeight(activeStage, x, z) {
  const seed = activeStage.scenerySeed;
  return (
    -3.8 +
    Math.sin((x + seed * 7) * 0.018) * 2.2 +
    Math.cos((z - seed * 5) * 0.022) * 1.8 +
    Math.sin((x + z) * 0.009) * 2.4
  );
}

function createRibbonMesh(activeStage, width, material, yOffset, stepSize) {
  const geometry = createRibbonGeometry(activeStage, width, yOffset, stepSize);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createRibbonGeometry(activeStage, width, yOffset, stepSize) {
  const steps = Math.ceil(activeStage.totalLength / stepSize);
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= steps; i += 1) {
    const progress = (activeStage.totalLength * i) / steps;
    const center = sampleStage(activeStage, progress, 0);
    const left = sampleStage(activeStage, progress, -width / 2);
    const right = sampleStage(activeStage, progress, width / 2);
    vertices.push(left.x, center.y + yOffset, left.z, right.x, center.y + yOffset, right.z);
    uvs.push(progress / 18, 0, progress / 18, 1);

    if (i < steps) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRoadPaint(activeStage) {
  const group = new THREE.Group();
  const markerGeometry = new THREE.BoxGeometry(0.55, 0.06, 6.5);

  for (let progress = 24; progress < activeStage.totalLength - 18; progress += 42) {
    const sample = sampleStage(activeStage, progress, 0);
    const marker = new THREE.Mesh(markerGeometry, materials.paint);
    marker.position.set(sample.x, sample.y + 0.08, sample.z);
    marker.rotation.y = sample.angle;
    marker.castShadow = false;
    marker.receiveShadow = true;
    group.add(marker);
  }

  return group;
}

function buildSurfaceZones(activeStage) {
  for (const zone of activeStage.surfaceZones) {
    const sample = sampleStage(activeStage, zone.progress, zone.lateral);
    const geometry = new THREE.PlaneGeometry(zone.width, zone.length);
    geometry.rotateX(-Math.PI / 2);
    const material = materials.imagenSplash.clone();
    material.opacity = zone.type === "ice" || zone.type === "water" ? 0.5 : 0.62;
    const decal = new THREE.Mesh(geometry, material);
    decal.position.set(sample.x, sample.y + 0.12, sample.z);
    decal.rotation.y = sample.angle;
    decal.renderOrder = 2;
    worldGroup.add(decal);
  }
}

function buildJumpMarkers(activeStage) {
  const rampGeometry = new THREE.BoxGeometry(1, 0.24, 4.8);
  for (const jump of activeStage.jumps) {
    const sample = sampleStage(activeStage, jump.progress, 0);
    const ramp = new THREE.Mesh(rampGeometry, materials.imagenChevron);
    ramp.scale.set(jump.width, 1, 1);
    ramp.position.set(sample.x, sample.y + 0.2, sample.z);
    ramp.rotation.y = sample.angle;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    jumpMarkers.push(ramp);
    worldGroup.add(ramp);
  }
}

function buildImagenTrackside(activeStage) {
  const boardGeometry = new THREE.BoxGeometry(10, 6, 0.42);
  const chevronGeometry = new THREE.BoxGeometry(8, 2.4, 0.38);
  const postGeometry = new THREE.CylinderGeometry(0.14, 0.18, 4.2, 10);
  const placements = [0.08, 0.22, 0.39, 0.57, 0.72, 0.91];

  placements.forEach((ratio, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const progress = activeStage.totalLength * ratio;
    const lateral = side * (activeStage.width / 2 + 7.5);
    const sample = sampleStage(activeStage, progress, lateral);
    const group = new THREE.Group();
    group.position.set(sample.x, sample.y, sample.z);
    group.rotation.y = sample.angle + (side > 0 ? Math.PI : 0);

    const board = new THREE.Mesh(index % 3 === 0 ? boardGeometry : chevronGeometry, index % 3 === 0 ? materials.imagenPoster : materials.imagenChevron);
    board.position.set(0, index % 3 === 0 ? 4.2 : 2.8, 0);
    board.castShadow = true;
    group.add(board);

    for (const postX of [-3.8, 3.8]) {
      const post = new THREE.Mesh(postGeometry, materials.dark);
      post.position.set(postX, 2, 0.18);
      post.castShadow = true;
      group.add(post);
    }

    worldGroup.add(group);
  });
}

function buildGates(activeStage) {
  const allGates = [
    { progress: 0, label: "Start", finish: false },
    ...activeStage.splits.map((split) => ({ progress: split.progress, label: split.label, finish: false })),
    { progress: activeStage.totalLength - 4, label: "Finish", finish: true },
  ];

  for (const gate of allGates) {
    const mesh = createGate(activeStage, gate.progress, gate.label, gate.finish);
    gates.push({ ...gate, mesh });
    worldGroup.add(mesh);
  }
}

function createGate(activeStage, progress, label, finish) {
  const sample = sampleStage(activeStage, progress, 0);
  const group = new THREE.Group();
  group.position.set(sample.x, sample.y, sample.z);
  group.rotation.y = sample.angle;

  const poleGeometry = new THREE.CylinderGeometry(0.18, 0.24, 5.4, 12);
  const bannerGeometry = new THREE.BoxGeometry(activeStage.width + 5, 1.1, 0.42);
  const signGeometry = new THREE.BoxGeometry(2.2, 0.42, 0.46);
  const poleOffset = activeStage.width / 2 + 2.2;

  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(poleGeometry, materials.pole);
    pole.position.set(side * poleOffset, 2.65, 0);
    pole.castShadow = true;
    group.add(pole);
  }

  const banner = new THREE.Mesh(bannerGeometry, finish ? materials.accent : materials.dark);
  banner.position.set(0, 5.05, 0);
  banner.castShadow = true;
  group.add(banner);

  const sign = new THREE.Mesh(signGeometry, finish ? materials.dark : materials.accent);
  sign.position.set(0, 4.36, -0.34);
  sign.castShadow = true;
  group.add(sign);

  group.userData.label = label;
  return group;
}

function buildObstacles(activeStage) {
  for (const hazard of activeStage.obstacles) {
    const sample = sampleStage(activeStage, hazard.progress, hazard.lateral);
    const mesh = createHazardMesh(hazard.type, hazard.radius);
    mesh.position.set(sample.x, sample.y + 0.45, sample.z);
    mesh.rotation.y = sample.angle + Math.PI * randomHash(hazard.progress);
    worldGroup.add(mesh);
    obstacles.push({
      mesh,
      position: mesh.position,
      radius: hazard.radius,
      cooldown: 0,
    });
  }
}

function createHazardMesh(type, radius) {
  const group = new THREE.Group();

  if (type.includes("rock") || type.includes("boulder")) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), materials.rock);
    rock.scale.y = 0.72 + randomHash(radius) * 0.4;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  } else if (type.includes("log")) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.42, radius * 0.52, radius * 2.1, 12), materials.wood);
    log.rotation.z = Math.PI / 2;
    log.castShadow = true;
    group.add(log);
  } else if (type.includes("barrel") || type.includes("cone")) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.42, radius * 0.5, radius * 1.15, 16), materials.accent);
    barrel.castShadow = true;
    group.add(barrel);
  } else {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.1, radius * 0.9, radius * 1.1), materials.wood);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
  }

  return group;
}

function buildScenery(activeStage) {
  const bounds = activeStage.bounds;
  const rng = mulberry32(activeStage.scenerySeed * 1009);
  const sceneryCount = activeStage.weather === "rain" ? 120 : 150;

  for (let i = 0; i < sceneryCount; i += 1) {
    const x = bounds.minX - 90 + rng() * (bounds.maxX - bounds.minX + 180);
    const z = bounds.minZ - 90 + rng() * (bounds.maxZ - bounds.minZ + 180);
    const nearest = nearestStageInfo(activeStage, x, z);
    if (nearest.distance < activeStage.width + 18) continue;

    const prop = activeStage.weather === "dust" ? createCanyonProp(rng) : activeStage.weather === "rain" ? createHarborProp(rng) : createPineProp(rng);
    const y = terrainHeight(activeStage, x, z) + 0.25;
    prop.position.set(x, y, z);
    prop.rotation.y = rng() * Math.PI * 2;
    worldGroup.add(prop);
  }

  for (let progress = 34; progress < activeStage.totalLength; progress += 58) {
    for (const side of [-1, 1]) {
      const sample = sampleStage(activeStage, progress, side * (activeStage.width / 2 + 1.4));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.6, 0.28), materials.pole);
      post.position.set(sample.x, sample.y + 0.8, sample.z);
      post.castShadow = true;
      worldGroup.add(post);
    }
  }
}

function createPineProp(rng) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.6, 8), materials.wood);
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  group.add(trunk);

  const tiers = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < tiers; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5 - i * 0.24, 2.6, 9), materials.foliage);
    cone.position.y = 2.6 + i * 0.92;
    cone.castShadow = true;
    group.add(cone);
  }
  group.scale.setScalar(0.8 + rng() * 0.8);
  return group;
}

function createCanyonProp(rng) {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + rng() * 1.6, 0), materials.rock);
  rock.scale.y = 0.55 + rng() * 0.6;
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);
  return group;
}

function createHarborProp(rng) {
  const group = new THREE.Group();
  const crateCount = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < crateCount; i += 1) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), i % 2 ? materials.wood : materials.dark);
    crate.position.set((rng() - 0.5) * 2.5, 0.55 + i * 0.28, (rng() - 0.5) * 2.5);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
  }
  return group;
}

function createWeatherSystem(activeStage) {
  if (activeStage.weather === "dust") return null;

  const count = activeStage.weather === "rain" ? 820 : 520;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 180;
    positions[i * 3 + 1] = Math.random() * 70 + 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: activeStage.weather === "rain" ? 0xb8e0ef : 0xffffff,
    size: activeStage.weather === "rain" ? 0.08 : 0.22,
    transparent: true,
    opacity: activeStage.weather === "rain" ? 0.58 : 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  return { points, positions, count, kind: activeStage.weather };
}

function updateWeather(dt) {
  if (!weatherSystem) return;

  const fallSpeed = weatherSystem.kind === "rain" ? 62 : 18;
  const driftX = weatherSystem.kind === "rain" ? -8 : 2;
  const driftZ = weatherSystem.kind === "rain" ? 5 : -1;

  for (let i = 0; i < weatherSystem.count; i += 1) {
    const base = i * 3;
    weatherSystem.positions[base] += driftX * dt;
    weatherSystem.positions[base + 1] -= fallSpeed * dt;
    weatherSystem.positions[base + 2] += driftZ * dt;

    const wx = weatherSystem.positions[base] - car.group.position.x;
    const wz = weatherSystem.positions[base + 2] - car.group.position.z;
    if (
      weatherSystem.positions[base + 1] < car.group.position.y - 5 ||
      Math.abs(wx) > 95 ||
      Math.abs(wz) > 95
    ) {
      weatherSystem.positions[base] = car.group.position.x + (Math.random() - 0.5) * 170;
      weatherSystem.positions[base + 1] = car.group.position.y + 35 + Math.random() * 35;
      weatherSystem.positions[base + 2] = car.group.position.z + (Math.random() - 0.5) * 170;
    }
  }

  weatherSystem.points.geometry.attributes.position.needsUpdate = true;
}

function createCar() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({
    color: 0xf25b2d,
    emissive: 0x2b0702,
    roughness: 0.42,
    metalness: 0.16,
  });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f7ef, roughness: 0.52, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x8cc8d8,
    roughness: 0.18,
    metalness: 0.25,
    transparent: true,
    opacity: 0.72,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101315, roughness: 0.9 });
  const light = new THREE.MeshStandardMaterial({
    color: 0xffefb0,
    emissive: 0xffd47a,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.52, 4.65), orange);
  base.position.y = 0.72;
  base.castShadow = true;
  body.add(base);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.34, 1.45), white);
  hood.position.set(0, 1.03, 1.12);
  hood.castShadow = true;
  body.add(hood);

  const hoodDecal = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.72), carDecalMaterial);
  hoodDecal.position.set(0, 1.23, 1.16);
  hoodDecal.castShadow = true;
  body.add(hoodDecal);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.92, 1.62), glass);
  cabin.position.set(0, 1.35, -0.45);
  cabin.castShadow = true;
  body.add(cabin);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.42), orange);
  wing.position.set(0, 1.45, -2.25);
  wing.castShadow = true;
  body.add(wing);

  for (const side of [-1, 1]) {
    const sideDecal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 2.2), carDecalMaterial);
    sideDecal.position.set(side * 1.56, 0.96, -0.18);
    sideDecal.rotation.z = side * 0.03;
    sideDecal.castShadow = true;
    body.add(sideDecal);
  }

  for (const x of [-0.72, 0.72]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.12), light);
    lamp.position.set(x, 0.9, 2.38);
    body.add(lamp);
  }

  group.add(body);
  car.body = body;

  const wheelGeometry = new THREE.CylinderGeometry(0.46, 0.46, 0.46, 20);
  const wheelPositions = [
    [-1.54, 0.45, 1.48, true],
    [1.54, 0.45, 1.48, true],
    [-1.54, 0.45, -1.46, false],
    [1.54, 0.45, -1.46, false],
  ];

  for (const [x, y, z, front] of wheelPositions) {
    const wheelPivot = new THREE.Group();
    wheelPivot.position.set(x, y, z);
    const wheel = new THREE.Mesh(wheelGeometry, rubber);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    wheelPivot.add(wheel);
    group.add(wheelPivot);
    car.wheels.push(wheel);
    if (front) car.frontWheels.push(wheelPivot);
  }

  return group;
}

function spawnDust(surfaceName, speed) {
  if (dustParticles.length > 95) return;

  const backwardX = -Math.sin(car.heading);
  const backwardZ = -Math.cos(car.heading);
  const side = (Math.random() - 0.5) * 2.5;
  const rightX = Math.cos(car.heading);
  const rightZ = -Math.sin(car.heading);
  const geometry = new THREE.SphereGeometry(0.32 + Math.random() * 0.32, 8, 6);
  const material = materials.dust.clone();
  const color = {
    ice: 0xe7f7ff,
    snowpack: 0xf3f7ef,
    dustwash: 0xd8a162,
    mud: 0x7a5136,
    water: 0x73c7d9,
    slick: 0x2d3537,
  }[surfaceName];
  if (color) material.color.setHex(color);
  material.opacity = surfaceName === "road" ? 0.18 : 0.42;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    car.group.position.x + backwardX * 2.2 + rightX * side,
    car.group.position.y - 0.35,
    car.group.position.z + backwardZ * 2.2 + rightZ * side,
  );
  mesh.userData.velocity = {
    x: backwardX * (3 + Math.random() * 4) + rightX * side,
    y: 1 + Math.random() * 2.3,
    z: backwardZ * (3 + Math.random() * 4) + rightZ * side,
  };
  mesh.userData.life = 0.55 + Math.random() * 0.35 + speed * 0.002;
  mesh.userData.maxLife = mesh.userData.life;
  fxGroup.add(mesh);
  dustParticles.push(mesh);
}

function updateDust(dt) {
  for (let i = dustParticles.length - 1; i >= 0; i -= 1) {
    const particle = dustParticles[i];
    particle.userData.life -= dt;
    particle.position.x += particle.userData.velocity.x * dt;
    particle.position.y += particle.userData.velocity.y * dt;
    particle.position.z += particle.userData.velocity.z * dt;
    const lifeRatio = clamp(particle.userData.life / particle.userData.maxLife, 0, 1);
    particle.scale.setScalar(1 + (1 - lifeRatio) * 2.8);
    particle.material.opacity = 0.42 * lifeRatio;

    if (particle.userData.life <= 0) {
      fxGroup.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      dustParticles.splice(i, 1);
    }
  }
}

function drawMiniMap() {
  const width = miniMap.width;
  const height = miniMap.height;
  const padding = 14;
  const bounds = stage.bounds;
  const spanX = bounds.maxX - bounds.minX || 1;
  const spanZ = bounds.maxZ - bounds.minZ || 1;
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanZ);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanZ * scale) / 2;
  const mapX = (x) => offsetX + (x - bounds.minX) * scale;
  const mapY = (z) => offsetY + (z - bounds.minZ) * scale;

  mini.clearRect(0, 0, width, height);
  mini.fillStyle = "rgba(8, 14, 16, 0.76)";
  mini.fillRect(0, 0, width, height);
  mini.lineCap = "round";
  mini.lineJoin = "round";
  mini.lineWidth = 5;
  mini.strokeStyle = "rgba(244, 247, 239, 0.28)";
  mini.beginPath();
  stage.points.forEach((point, index) => {
    const x = mapX(point.x);
    const y = mapY(point.z);
    if (index === 0) mini.moveTo(x, y);
    else mini.lineTo(x, y);
  });
  mini.stroke();

  mini.lineWidth = 2;
  mini.strokeStyle = "#ffe06c";
  mini.beginPath();
  const steps = 120;
  for (let i = 0; i <= steps; i += 1) {
    const sample = sampleStage(stage, (stage.totalLength * i) / steps, 0);
    const x = mapX(sample.x);
    const y = mapY(sample.z);
    if (i === 0) mini.moveTo(x, y);
    else mini.lineTo(x, y);
  }
  mini.stroke();

  for (const split of stage.splits) {
    const sample = sampleStage(stage, split.progress, 0);
    mini.fillStyle = "rgba(103, 241, 255, 0.9)";
    mini.fillRect(mapX(sample.x) - 2, mapY(sample.z) - 2, 4, 4);
  }

  mini.fillStyle = "#f25b2d";
  mini.beginPath();
  mini.arc(mapX(car.group.position.x), mapY(car.group.position.z), 4.5, 0, Math.PI * 2);
  mini.fill();
}

function resize() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  const hundredths = Math.floor((value - Math.floor(value)) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function angleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function hex(value) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

function randomHash(value) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clearGroup(group) {
  for (let i = group.children.length - 1; i >= 0; i -= 1) {
    const child = group.children[i];
    group.remove(child);
    disposeObject(child);
  }
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
