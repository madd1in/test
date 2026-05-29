const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(projectRoot, "game.js"), "utf8");

function makeGradient() {
  return { addColorStop() {} };
}

const ctx = new Proxy(
  {
    createLinearGradient: makeGradient,
    createRadialGradient: makeGradient,
    measureText: (text) => ({ width: String(text).length * 10 })
  },
  {
    get(target, prop) {
      if (!(prop in target)) target[prop] = () => {};
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  }
);

function makeElement(id = "") {
  return {
    id,
    children: [],
    style: {
      setProperty() {}
    },
    className: "",
    textContent: "",
    innerText: "",
    innerHTML: "",
    disabled: false,
    clientWidth: 960,
    clientHeight: 960,
    width: 960,
    height: 960,
    append(...items) {
      this.children.push(...items);
    },
    appendChild(item) {
      this.children.push(item);
      return item;
    },
    setAttribute() {},
    addEventListener() {},
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
    },
    classList: {
      add() {},
      remove() {},
      toggle() {}
    }
  };
}

const elements = new Map();
[
  "gameCanvas",
  "levelName",
  "movesValue",
  "parValue",
  "targetValue",
  "bestValue",
  "masteryValue",
  "tierValue",
  "stateBadge",
  "levelButtons",
  "undoButton",
  "resetButton",
  "nextButton",
  "audioButton",
  "lockState",
  "levelNote",
  "signalValue",
  "signalList"
].forEach((id) => elements.set(id, makeElement(id)));

elements.get("gameCanvas").getContext = () => ctx;

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }
  addEventListener() {}
  set src(value) {
    this._src = value;
  }
}

const storage = new Map();
const sandbox = {
  console,
  Image: FakeImage,
  performance: { now: () => 0 },
  requestAnimationFrame: () => 0,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  document: {
    getElementById: (id) => elements.get(id) ?? makeElement(id),
    createElement: (tag) => makeElement(tag),
    body: makeElement("body"),
    documentElement: { scrollWidth: 960 }
  },
  window: {
    addEventListener() {}
  }
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "game.js" });

const game = sandbox.window.LumenLock;
if (!game) {
  throw new Error("Debug API was not exposed.");
}

const solutions = [
  [
    [2, 2, 1],
    [2, 4, 1]
  ],
  [
    [2, 1, 3],
    [2, 3, 2]
  ],
  [
    [1, 0, 2],
    [1, 3, 1],
    [4, 1, 2],
    [2, 1, 2]
  ],
  [
    [2, 5, 2],
    [2, 2, 2]
  ],
  [
    [3, 1, 2],
    [3, 4, 2],
    [1, 3, 2],
    [5, 3, 1],
    [4, 5, 2],
    [4, 2, 2]
  ],
  [
    [2, 3, 2],
    [2, 1, 2],
    [2, 5, 2]
  ],
  [
    [1, 2, 2],
    [5, 2, 2],
    [2, 5, 2],
    [2, 1, 2]
  ],
  [
    [2, 2, 2],
    [2, 0, 2],
    [2, 4, 2],
    [5, 5, 2],
    [1, 5, 2],
    [6, 6, 2],
    [6, 1, 2]
  ],
  [
    [2, 4, 2],
    [2, 1, 2],
    [2, 6, 2],
    [5, 3, 2]
  ],
  [
    [3, 2, 2],
    [3, 6, 2],
    [5, 5, 2],
    [5, 1, 2]
  ],
  [
    [3, 4, 2],
    [3, 0, 2],
    [6, 6, 2]
  ],
  [
    [3, 1, 2],
    [3, 3, 2],
    [6, 5, 2],
    [4, 6, 2],
    [1, 7, 2]
  ]
];

if (typeof game.getLevelCount === "function" && solutions.length !== game.getLevelCount()) {
  throw new Error(`Expected ${game.getLevelCount()} solution sets, found ${solutions.length}.`);
}

const report = solutions.map((moves, levelIndex) => {
  game.loadLevel(levelIndex);
  const start = game.getSnapshot();
  if (start.solved) {
    throw new Error(`Level ${levelIndex + 1} starts solved.`);
  }
  moves.forEach(([x, y, count]) => {
    for (let i = 0; i < count; i += 1) {
      game.rotateCell(x, y, 1);
    }
  });
  const end = game.getSnapshot();
  if (!end.solved) {
    throw new Error(`Level ${levelIndex + 1} did not solve. ${JSON.stringify(end)}`);
  }
  return end;
});

console.log(JSON.stringify(report, null, 2));
