export const LEVEL_TARGET_STARS = 8;

export const START = { x: 0, y: 1.08, z: 2 };
export const GOAL = { x: -22, y: 9.8, z: -92 };

export const PLATFORMS = [
  { id: "home", x: 0, y: 0, z: 0, w: 15, h: 1.2, d: 15, texture: "grass_tile" },
  { id: "step-a", x: 2, y: 1.2, z: -13, w: 8, h: 1, d: 6, texture: "cliff_tile" },
  { id: "step-b", x: -4, y: 2.2, z: -24, w: 7, h: 1, d: 7, texture: "grass_tile" },
  { id: "bridge-a", x: 6, y: 3, z: -35, w: 12, h: 0.8, d: 4, texture: "brick_tile" },
  { id: "flower-bowl", x: 18, y: 3.5, z: -46, w: 14, h: 1.1, d: 14, texture: "flower_tile" },
  { id: "thin-run", x: 7, y: 4.7, z: -57, w: 5, h: 0.75, d: 14, texture: "brick_tile" },
  { id: "left-rise", x: -8, y: 5.8, z: -62, w: 8, h: 1, d: 8, texture: "grass_tile" },
  { id: "lift-a", x: -20, y: 6.2, z: -65, w: 5, h: 0.7, d: 5, texture: "cloud_tile", moving: { axis: "x", distance: 12, speed: 0.7 } },
  { id: "tower-low", x: -28, y: 7.2, z: -76, w: 9, h: 1, d: 9, texture: "cliff_tile" },
  { id: "ring-east", x: -12, y: 7.4, z: -82, w: 6, h: 0.7, d: 6, texture: "brick_tile" },
  { id: "moving-hop", x: -2, y: 7.9, z: -92, w: 5, h: 0.7, d: 5, texture: "cloud_tile", moving: { axis: "z", distance: 10, speed: 0.82 } },
  { id: "gate-island", x: -22, y: 8.8, z: -92, w: 16, h: 1.2, d: 16, texture: "flower_tile" },
  { id: "bonus-a", x: 29, y: 5.8, z: -34, w: 6, h: 0.75, d: 6, texture: "cloud_tile" },
  { id: "bonus-b", x: 37, y: 7.2, z: -43, w: 7, h: 0.75, d: 7, texture: "grass_tile" },
  { id: "bonus-c", x: 30, y: 8.4, z: -55, w: 6, h: 0.75, d: 6, texture: "brick_tile" },
];

export const STARS = [
  { id: "star-home", x: -5, y: 2.1, z: -4 },
  { id: "star-step", x: -5, y: 3.8, z: -24 },
  { id: "star-bowl", x: 20, y: 5.2, z: -46 },
  { id: "star-run", x: 7, y: 6.4, z: -61 },
  { id: "star-rise", x: -8, y: 7.5, z: -62 },
  { id: "star-tower", x: -28, y: 8.9, z: -76 },
  { id: "star-bonus", x: 37, y: 8.9, z: -43 },
  { id: "star-gate", x: -22, y: 10.6, z: -97 },
];

export const COINS = [
  { x: 3, y: 2.0, z: -10 },
  { x: 2, y: 2.1, z: -14 },
  { x: 0, y: 2.2, z: -18 },
  { x: -2, y: 3.2, z: -24 },
  { x: 2, y: 3.3, z: -27 },
  { x: 8, y: 4.2, z: -35 },
  { x: 12, y: 4.2, z: -35 },
  { x: 16, y: 5.0, z: -42 },
  { x: 20, y: 5.0, z: -42 },
  { x: 23, y: 5.0, z: -47 },
  { x: 17, y: 5.0, z: -51 },
  { x: 7, y: 6.1, z: -53 },
  { x: 7, y: 6.2, z: -57 },
  { x: 7, y: 6.3, z: -61 },
  { x: -5, y: 7.1, z: -62 },
  { x: -11, y: 7.1, z: -62 },
  { x: -22, y: 7.8, z: -67 },
  { x: -26, y: 8.6, z: -76 },
  { x: -30, y: 8.6, z: -76 },
  { x: -12, y: 8.6, z: -82 },
  { x: -3, y: 9.0, z: -92 },
  { x: -18, y: 10.2, z: -90 },
  { x: -22, y: 10.2, z: -92 },
  { x: -26, y: 10.2, z: -94 },
  { x: 29, y: 7.1, z: -34 },
  { x: 33, y: 8.4, z: -40 },
  { x: 37, y: 8.6, z: -43 },
  { x: 30, y: 9.6, z: -55 },
];

export const SPRINGS = [
  { x: -1, y: 1.0, z: -6, power: 13 },
  { x: 18, y: 4.3, z: -52, power: 15 },
  { x: -8, y: 6.8, z: -66, power: 14 },
  { x: 30, y: 9.0, z: -55, power: 17 },
];

export const BOOST_RINGS = [
  { id: "ring-home", x: 2, y: 4.8, z: -18, yaw: 0.05, power: 10 },
  { id: "ring-bowl", x: 11, y: 7.0, z: -55, yaw: -0.55, power: 12 },
  { id: "ring-lift", x: -17, y: 9.0, z: -68, yaw: 0.85, power: 11 },
  { id: "ring-gate", x: -11, y: 11.0, z: -90, yaw: -1.15, power: 13 },
];

export const ENEMIES = [
  { id: "bouncer-a", x: 18, y: 4.4, z: -45, radius: 5, speed: 1.2 },
  { id: "bouncer-b", x: -28, y: 8.1, z: -76, radius: 4, speed: 1.45 },
  { id: "bouncer-c", x: 35, y: 8.0, z: -43, radius: 4, speed: 1.1 },
];

export const DECOR = [
  { type: "tree", x: -6, y: 0.8, z: 5, scale: 1.1 },
  { type: "tree", x: 6, y: 0.8, z: -4, scale: 0.9 },
  { type: "tree", x: 15, y: 4.2, z: -41, scale: 1.0 },
  { type: "tree", x: 23, y: 4.2, z: -53, scale: 0.9 },
  { type: "tree", x: -31, y: 7.9, z: -80, scale: 0.9 },
  { type: "cloud", x: 14, y: 10, z: -19, scale: 1.4 },
  { type: "cloud", x: -34, y: 13, z: -50, scale: 1.7 },
  { type: "cloud", x: 44, y: 11, z: -61, scale: 1.3 },
  { type: "flower", x: 2, y: 0.72, z: 4, scale: 1.0 },
  { type: "flower", x: 16, y: 4.12, z: -49, scale: 1.1 },
  { type: "flower", x: -25, y: 7.92, z: -73, scale: 0.9 },
  { type: "flag", x: -4, y: 0.8, z: -5, scale: 1.0 },
  { type: "flag", x: -28, y: 7.8, z: -72, scale: 0.9 },
  { type: "arch", x: -22, y: 9.8, z: -101, scale: 1 },
];
