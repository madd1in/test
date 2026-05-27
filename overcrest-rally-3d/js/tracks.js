const RAW_STAGES = [
  {
    id: "frostpine-pass",
    name: "Frostpine Pass",
    music: "bgm-frostpine.wav",
    surface: "Snow gravel",
    weather: "snow",
    goalTime: 96,
    width: 13,
    scenerySeed: 11,
    elevationRise: 18,
    elevationWave: 4.2,
    palette: {
      sky: 0xaed8ef,
      fog: 0xaed8ef,
      ground: 0xc3d5d2,
      road: 0x6c7577,
      shoulder: 0xd8e3df,
      accent: 0xffd36a,
    },
    points: [
      { x: -164, z: 98 },
      { x: -126, z: 34 },
      { x: -74, z: -12 },
      { x: -44, z: -82 },
      { x: 22, z: -112 },
      { x: 86, z: -80 },
      { x: 120, z: -22 },
      { x: 72, z: 34 },
      { x: 108, z: 94 },
      { x: 48, z: 148 },
      { x: -22, z: 118 },
      { x: -82, z: 158 },
      { x: -132, z: 132 },
      { x: -178, z: 178 },
    ],
    splits: [
      { ratio: 0.27, label: "Pine Split" },
      { ratio: 0.55, label: "Overcrest" },
      { ratio: 0.78, label: "Village Run" },
    ],
    notes: [
      { ratio: 0.06, text: "4 right into crest" },
      { ratio: 0.14, text: "Hairpin left" },
      { ratio: 0.24, text: "Long 3 right" },
      { ratio: 0.36, text: "Keep middle over jump" },
      { ratio: 0.49, text: "2 left tightens" },
      { ratio: 0.62, text: "Flat right over snowbank" },
      { ratio: 0.72, text: "Square left" },
      { ratio: 0.86, text: "Crest into finish" },
    ],
    obstacles: [
      { ratio: 0.18, lateral: 11, radius: 3.2, type: "snow-boulder" },
      { ratio: 0.31, lateral: -12, radius: 2.8, type: "pine-log" },
      { ratio: 0.43, lateral: 10, radius: 3.5, type: "snow-boulder" },
      { ratio: 0.61, lateral: -11, radius: 2.6, type: "pine-log" },
      { ratio: 0.73, lateral: 12, radius: 3.1, type: "snow-boulder" },
      { ratio: 0.9, lateral: -10, radius: 3.4, type: "snow-boulder" },
    ],
  },
  {
    id: "cinderwash-canyon",
    name: "Cinderwash Canyon",
    music: "bgm-cinderwash.wav",
    surface: "Hardpack",
    weather: "dust",
    goalTime: 88,
    width: 14,
    scenerySeed: 29,
    elevationRise: -8,
    elevationWave: 3.5,
    palette: {
      sky: 0xf0bd87,
      fog: 0xdba56e,
      ground: 0x9a6542,
      road: 0x7e5a44,
      shoulder: 0xc08249,
      accent: 0x67f1ff,
    },
    points: [
      { x: -152, z: -116 },
      { x: -92, z: -146 },
      { x: -28, z: -122 },
      { x: 24, z: -158 },
      { x: 92, z: -128 },
      { x: 142, z: -76 },
      { x: 104, z: -12 },
      { x: 146, z: 42 },
      { x: 86, z: 96 },
      { x: 20, z: 70 },
      { x: -38, z: 112 },
      { x: -112, z: 74 },
      { x: -154, z: 10 },
      { x: -126, z: -54 },
      { x: -174, z: -82 },
    ],
    splits: [
      { ratio: 0.25, label: "Mine Road" },
      { ratio: 0.52, label: "Canyon Gate" },
      { ratio: 0.81, label: "Switchback" },
    ],
    notes: [
      { ratio: 0.07, text: "Fast 5 left" },
      { ratio: 0.17, text: "Caution dip" },
      { ratio: 0.27, text: "4 right over bridge" },
      { ratio: 0.39, text: "Hairpin right" },
      { ratio: 0.5, text: "Narrows into 3 left" },
      { ratio: 0.64, text: "Flat over wash" },
      { ratio: 0.76, text: "2 right opens" },
      { ratio: 0.89, text: "Long left to finish" },
    ],
    obstacles: [
      { ratio: 0.12, lateral: -12, radius: 3.2, type: "canyon-rock" },
      { ratio: 0.28, lateral: 12, radius: 3.6, type: "barrel" },
      { ratio: 0.45, lateral: -11, radius: 3.4, type: "canyon-rock" },
      { ratio: 0.58, lateral: 11, radius: 2.9, type: "barrel" },
      { ratio: 0.7, lateral: -12, radius: 3.3, type: "canyon-rock" },
      { ratio: 0.88, lateral: 12, radius: 3.5, type: "canyon-rock" },
    ],
  },
  {
    id: "rainline-harbor",
    name: "Rainline Harbor",
    music: "bgm-rainline.wav",
    surface: "Wet tarmac",
    weather: "rain",
    goalTime: 91,
    width: 12,
    scenerySeed: 47,
    elevationRise: 4,
    elevationWave: 2.7,
    palette: {
      sky: 0x6e8fa4,
      fog: 0x577585,
      ground: 0x3f6d68,
      road: 0x3a464d,
      shoulder: 0x5b7c7d,
      accent: 0xff7a64,
    },
    points: [
      { x: -170, z: 0 },
      { x: -132, z: -58 },
      { x: -64, z: -84 },
      { x: -16, z: -32 },
      { x: 44, z: -58 },
      { x: 108, z: -18 },
      { x: 132, z: 54 },
      { x: 78, z: 104 },
      { x: 12, z: 82 },
      { x: -36, z: 134 },
      { x: -96, z: 112 },
      { x: -146, z: 58 },
      { x: -104, z: 8 },
      { x: -158, z: -26 },
      { x: -188, z: 34 },
    ],
    splits: [
      { ratio: 0.23, label: "Dockside" },
      { ratio: 0.51, label: "Breakwater" },
      { ratio: 0.77, label: "Old Quay" },
    ],
    notes: [
      { ratio: 0.05, text: "3 right wet" },
      { ratio: 0.16, text: "Flat left past cranes" },
      { ratio: 0.29, text: "Square right" },
      { ratio: 0.43, text: "Crest into 4 left" },
      { ratio: 0.56, text: "Hairpin left slick" },
      { ratio: 0.68, text: "Keep right over bridge" },
      { ratio: 0.8, text: "2 left tightens" },
      { ratio: 0.91, text: "Final chicane" },
    ],
    obstacles: [
      { ratio: 0.1, lateral: 11, radius: 2.9, type: "cone-stack" },
      { ratio: 0.27, lateral: -10, radius: 3.4, type: "dock-crate" },
      { ratio: 0.42, lateral: 10, radius: 3.1, type: "dock-crate" },
      { ratio: 0.59, lateral: -11, radius: 3.2, type: "cone-stack" },
      { ratio: 0.74, lateral: 10, radius: 3.4, type: "dock-crate" },
      { ratio: 0.88, lateral: -10, radius: 3.1, type: "dock-crate" },
    ],
  },
];

export const SURFACES = {
  road: { label: "Road", grip: 7.6, handbrakeGrip: 2.2, drag: 0.35, maxSpeed: 73 },
  shoulder: { label: "Shoulder", grip: 5.1, handbrakeGrip: 1.55, drag: 0.72, maxSpeed: 55 },
  offroad: { label: "Offroad", grip: 3.5, handbrakeGrip: 1.15, drag: 1.2, maxSpeed: 35 },
};

export const STAGES = RAW_STAGES.map(prepareStage);

export function prepareStage(rawStage) {
  const points = rawStage.points.map((point) => ({ x: point.x, z: point.z }));
  const segments = [];
  const cumulative = [0];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    const tangent = { x: dx / length, z: dz / length };
    const normal = { x: -tangent.z, z: tangent.x };
    segments.push({ start, end, length, tangent, normal, distance: totalLength });
    totalLength += length;
    cumulative.push(totalLength);
  }

  const stage = {
    ...rawStage,
    points,
    segments,
    cumulative,
    totalLength,
  };

  stage.splits = rawStage.splits.map((split) => ({
    ...split,
    progress: split.ratio * totalLength,
  }));
  stage.notes = rawStage.notes.map((note) => ({
    ...note,
    progress: note.ratio * totalLength,
  }));
  stage.obstacles = rawStage.obstacles.map((obstacle) => ({
    ...obstacle,
    progress: obstacle.ratio * totalLength,
  }));
  stage.bounds = getBounds(stage.points);

  return stage;
}

export function sampleStage(stage, progress, lateral = 0) {
  const clamped = clamp(progress, 0, stage.totalLength);
  const segment = segmentAt(stage, clamped);
  const local = clamp(clamped - segment.distance, 0, segment.length);
  const ratio = segment.length === 0 ? 0 : local / segment.length;
  const x = segment.start.x + (segment.end.x - segment.start.x) * ratio + segment.normal.x * lateral;
  const z = segment.start.z + (segment.end.z - segment.start.z) * ratio + segment.normal.z * lateral;
  const y = roadElevation(stage, clamped);

  return {
    x,
    y,
    z,
    progress: clamped,
    tangent: segment.tangent,
    normal: segment.normal,
    angle: Math.atan2(segment.tangent.x, segment.tangent.z),
    segment,
  };
}

export function nearestStageInfo(stage, x, z) {
  let best = null;

  for (const segment of stage.segments) {
    const vx = segment.end.x - segment.start.x;
    const vz = segment.end.z - segment.start.z;
    const wx = x - segment.start.x;
    const wz = z - segment.start.z;
    const denom = segment.length * segment.length || 1;
    const t = clamp((wx * vx + wz * vz) / denom, 0, 1);
    const px = segment.start.x + vx * t;
    const pz = segment.start.z + vz * t;
    const dx = x - px;
    const dz = z - pz;
    const distance = Math.hypot(dx, dz);
    const lateral = dx * segment.normal.x + dz * segment.normal.z;
    const progress = segment.distance + segment.length * t;

    if (!best || distance < best.distance) {
      best = {
        x: px,
        z: pz,
        distance,
        lateral,
        progress,
        tangent: segment.tangent,
        normal: segment.normal,
        angle: Math.atan2(segment.tangent.x, segment.tangent.z),
        segment,
      };
    }
  }

  return best;
}

export function roadElevation(stage, progress) {
  const normalized = clamp(progress / stage.totalLength, 0, 1);
  const wave = Math.sin(normalized * Math.PI * 5 + stage.scenerySeed) * stage.elevationWave;
  const crest = Math.sin(normalized * Math.PI) * stage.elevationWave * 0.7;
  return normalized * stage.elevationRise + wave + crest;
}

export function progressDelta(previous, current) {
  return current - previous;
}

export function nextPaceNote(stage, progress) {
  return stage.notes.find((note) => note.progress > progress + 10) || {
    progress: stage.totalLength,
    text: "Finish",
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function segmentAt(stage, progress) {
  for (const segment of stage.segments) {
    if (progress >= segment.distance && progress <= segment.distance + segment.length) {
      return segment;
    }
  }

  return stage.segments[stage.segments.length - 1];
}

function getBounds(points) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minZ: Math.min(bounds.minZ, point.z),
      maxZ: Math.max(bounds.maxZ, point.z),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
    },
  );
}
