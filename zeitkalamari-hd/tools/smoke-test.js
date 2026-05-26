const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const gameJs = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");

class Element {
  constructor(selector) {
    this.selector = selector;
    this.children = [];
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach((name) => this.classList.values.add(name)),
      remove: (...names) => names.forEach((name) => this.classList.values.delete(name)),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !this.classList.values.has(name) : force;
        if (shouldAdd) this.classList.values.add(name);
        else this.classList.values.delete(name);
      },
      contains: (name) => this.classList.values.has(name),
    };
    this.style = { setProperty() {} };
    this.attributes = {};
    this.listeners = {};
    this._text = "";
    this._html = "";
  }

  set textContent(value) {
    this._text = String(value);
  }

  get textContent() {
    return this._text;
  }

  set innerHTML(value) {
    this._html = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._html;
  }

  set src(value) {
    this.attributes.src = value;
  }

  get src() {
    return this.attributes.src;
  }

  set alt(value) {
    this.attributes.alt = value;
  }

  append(child) {
    this.children.push(child);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }
}

const elements = new Map();
const documentStub = {
  documentElement: new Element("html"),
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, new Element(selector));
    return elements.get(selector);
  },
  createElement(tag) {
    return new Element(tag);
  },
};

const storage = new Map();
const context = {
  console,
  document: documentStub,
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  window: {
    addEventListener() {},
    clearTimeout() {},
    setTimeout: (fn) => {
      fn();
      return 0;
    },
  },
  setTimeout: (fn) => {
    fn();
    return 0;
  },
};

vm.createContext(context);
vm.runInContext(`${gameJs}\nthis.__test = { state, handleHotspot, useItemOnHotspot, setVerb, selectRoom, advanceDialog, closeDialog, ROOMS };`, context);

const test = context.__test;

function hotspot(room, id) {
  return test.ROOMS[room].hotspots.find((entry) => entry.id === id);
}

function drain() {
  for (let i = 0; i < 10; i += 1) test.advanceDialog();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

drain();
test.setVerb("take");
test.handleHotspot(hotspot("lab", "mug"));
drain();
assert(test.state.inventory.includes("mug"), "mug was not collected");

test.useItemOnHotspot("mug", hotspot("lab", "coffeeMachine"));
drain();
assert(test.state.inventory.includes("coffee"), "coffee was not brewed");

test.selectRoom("past");
test.useItemOnHotspot("coffee", hotspot("past", "chef"));
drain();
assert(test.state.inventory.includes("coupon"), "coupon was not printed");

test.setVerb("take");
test.handleHotspot(hotspot("past", "dough"));
drain();
assert(test.state.inventory.includes("yeastGel"), "yeast gel was not collected");

test.selectRoom("future");
test.useItemOnHotspot("coupon", hotspot("future", "vending"));
drain();
assert(test.state.inventory.includes("snack"), "snack was not dispensed");

test.useItemOnHotspot("snack", hotspot("future", "guard"));
drain();
assert(test.state.flags.guardDistracted, "guard was not distracted");

test.setVerb("take");
test.handleHotspot(hotspot("future", "case"));
drain();
assert(test.state.inventory.includes("tuningFork"), "tuning fork was not collected");

test.selectRoom("lab");
test.setVerb("take");
test.handleHotspot(hotspot("lab", "locker"));
drain();
assert(test.state.inventory.includes("glove"), "glove was not collected");

test.useItemOnHotspot("glove", hotspot("lab", "fusebox"));
drain();
assert(test.state.inventory.includes("chargedFork"), "charged fork was not created");

test.useItemOnHotspot("chargedFork", hotspot("lab", "engine"));
drain();
test.useItemOnHotspot("yeastGel", hotspot("lab", "engine"));
drain();
assert(test.state.flags.won, "ending was not reached");

console.log("Smoke test passed: full puzzle chain reaches the ending.");
