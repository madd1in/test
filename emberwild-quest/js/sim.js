export const MAX_HEALTH = 8;
export const REQUIRED_SHARDS = 4;
export const REQUIRED_SIGILS = 4;
export const REQUIRED_LENSES = 3;

const SAVE_KEY = "emberwild-quest-save-v1";

export function createInitialState() {
  return {
    health: MAX_HEALTH,
    ember: 0,
    shards: [],
    sigils: [],
    key: false,
    ward: true,
    chests: [],
    beacons: [],
    obelisks: [],
    moonBlooms: [],
    lenses: [],
    focusCharged: false,
    enemiesDefeated: 0,
    bossDefeated: false,
    gateOpen: false,
    areaName: "Southwatch Grove",
    objective: "Find four ember shards in the old forest.",
    lastCheckpoint: { x: 208, y: 1200 },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const state = { ...createInitialState(), ...JSON.parse(raw) };
    state.health = Math.min(MAX_HEALTH, Math.max(0, state.health));
    state.sigils = Array.isArray(state.sigils) ? state.sigils : [];
    state.obelisks = Array.isArray(state.obelisks) ? state.obelisks : [];
    state.moonBlooms = Array.isArray(state.moonBlooms) ? state.moonBlooms : [];
    state.lenses = Array.isArray(state.lenses) ? state.lenses : [];
    state.focusCharged = Boolean(state.focusCharged);
    normalizeObjective(state);
    return state;
  } catch {
    return createInitialState();
  }
}

function normalizeObjective(state) {
  if (state.bossDefeated) {
    state.objective = "The Emberwild is free.";
  } else if (state.gateOpen) {
    state.objective = "The gate is open. Face the Ash Warden.";
  } else if (state.key && state.shards.length >= REQUIRED_SHARDS) {
    state.objective = "Use the sunken key at the sealed north gate.";
  } else if (state.shards.length > 0) {
    state.objective = `Find ember shards (${state.shards.length}/${REQUIRED_SHARDS}).`;
  } else if (state.focusCharged) {
    state.objective = "Star lenses aligned. Pulse can crack nearby foes.";
  } else if (state.lenses.length > 0) {
    state.objective = `Find star lenses (${state.lenses.length}/${REQUIRED_LENSES}).`;
  } else {
    state.objective = "Find four ember shards in the old forest.";
  }
}

export function saveState(state) {
  const snapshot = {
    health: state.health,
    ember: state.ember,
    shards: state.shards,
    sigils: state.sigils,
    key: state.key,
    ward: state.ward,
    chests: state.chests,
    beacons: state.beacons,
    obelisks: state.obelisks,
    moonBlooms: state.moonBlooms,
    lenses: state.lenses,
    focusCharged: state.focusCharged,
    enemiesDefeated: state.enemiesDefeated,
    bossDefeated: state.bossDefeated,
    gateOpen: state.gateOpen,
    areaName: state.areaName,
    objective: state.objective,
    lastCheckpoint: state.lastCheckpoint,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Save skipped", error);
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn("Clear save skipped", error);
  }
}

export function addShard(state, id) {
  if (state.shards.includes(id)) return false;
  state.shards.push(id);
  state.ember = Math.min(99, state.ember + 12);
  state.objective =
    state.shards.length >= REQUIRED_SHARDS
      ? "All shards glow. Break the Ash Warden in the north ruin."
      : `Find ember shards (${state.shards.length}/${REQUIRED_SHARDS}).`;
  saveState(state);
  return true;
}

export function addSigil(state, id) {
  if (state.sigils.includes(id)) return false;
  state.sigils.push(id);
  state.ember = Math.min(99, state.ember + 8);
  if (state.sigils.length >= REQUIRED_SIGILS && state.shards.length < REQUIRED_SHARDS) {
    state.objective = "The echo sigils hum. Pulse points farther through the forest.";
  }
  saveState(state);
  return true;
}

export function addKey(state) {
  if (state.key) return false;
  state.key = true;
  state.objective = "Use the sunken key at the sealed north gate.";
  saveState(state);
  return true;
}

export function markChest(state, id) {
  if (state.chests.includes(id)) return false;
  state.chests.push(id);
  saveState(state);
  return true;
}

export function touchBeacon(state, id, x, y) {
  if (!state.beacons.includes(id)) state.beacons.push(id);
  state.lastCheckpoint = { x, y };
  state.health = MAX_HEALTH;
  state.ward = true;
  state.objective =
    state.shards.length >= REQUIRED_SHARDS
      ? "Carry the full ember to the north ruin."
      : "A beacon remembers you. Ember ward renewed.";
  saveState(state);
}

export function touchObelisk(state, id) {
  if (state.obelisks.includes(id)) return false;
  state.obelisks.push(id);
  state.ember = Math.min(99, state.ember + 18);
  state.ward = true;
  state.objective = id === "moonwell" ? "Moonwell light refreshes pulse and ward." : "A rune echo fills your ward with ember.";
  saveState(state);
  return true;
}

export function markMoonBloom(state, id) {
  if (state.moonBlooms.includes(id)) return false;
  state.moonBlooms.push(id);
  state.ember = Math.min(99, state.ember + 10);
  state.ward = true;
  state.objective = state.moonBlooms.length >= 3
    ? "Moonwell blooms hum. Your ward is bright."
    : "A moonwell bloom refreshes your ward.";
  saveState(state);
  return true;
}

export function addLens(state, id) {
  if (state.lenses.includes(id)) return false;
  state.lenses.push(id);
  state.ember = Math.min(99, state.ember + 9);
  if (state.lenses.length >= REQUIRED_LENSES) {
    state.focusCharged = true;
    state.objective = "Star lenses aligned. Pulse can crack nearby foes.";
  } else {
    state.objective = `Find star lenses (${state.lenses.length}/${REQUIRED_LENSES}).`;
  }
  saveState(state);
  return true;
}

export function takeDamage(state, amount) {
  state.health = Math.max(0, state.health - amount);
  saveState(state);
  return state.health === 0;
}

export function heal(state, amount) {
  state.health = Math.min(MAX_HEALTH, state.health + amount);
  saveState(state);
}

export function openGate(state) {
  if (!state.key) return false;
  state.gateOpen = true;
  state.objective = "The gate is open. Face the Ash Warden.";
  saveState(state);
  return true;
}

export function markEnemyDefeated(state) {
  state.enemiesDefeated += 1;
  state.ember = Math.min(99, state.ember + 4);
  saveState(state);
}

export function markBossDefeated(state) {
  state.bossDefeated = true;
  state.objective = "The Emberwild is free.";
  saveState(state);
}
