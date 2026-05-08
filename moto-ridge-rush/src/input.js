(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});

  const keyMap = new Map([
    ["ArrowRight", "throttle"],
    ["KeyD", "throttle"],
    ["ArrowLeft", "brake"],
    ["KeyA", "brake"],
    ["ArrowUp", "leanBack"],
    ["KeyW", "leanBack"],
    ["ArrowDown", "leanForward"],
    ["KeyS", "leanForward"],
    ["Space", "hop"],
    ["ShiftLeft", "turbo"],
    ["ShiftRight", "turbo"],
    ["KeyR", "restart"],
    ["Escape", "pause"]
  ]);

  function createInput() {
    const held = new Set();
    const pressed = new Set();
    const released = new Set();

    function setAction(action, down) {
      if (down) {
        if (!held.has(action)) pressed.add(action);
        held.add(action);
      } else {
        if (held.has(action)) released.add(action);
        held.delete(action);
      }
    }

    window.addEventListener("keydown", (event) => {
      const action = keyMap.get(event.code);
      if (!action) return;
      event.preventDefault();
      setAction(action, true);
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap.get(event.code);
      if (!action) return;
      event.preventDefault();
      setAction(action, false);
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.dataset.action;
      const activate = (event) => {
        event.preventDefault();
        button.dataset.active = "true";
        setAction(action, true);
      };
      const deactivate = (event) => {
        event.preventDefault();
        button.dataset.active = "false";
        setAction(action, false);
      };
      button.addEventListener("pointerdown", activate);
      button.addEventListener("pointerup", deactivate);
      button.addEventListener("pointercancel", deactivate);
      button.addEventListener("pointerleave", deactivate);
    });

    return {
      held,
      pressed,
      released,
      isDown(action) {
        return held.has(action);
      },
      wasPressed(action) {
        return pressed.has(action);
      },
      wasReleased(action) {
        return released.has(action);
      },
      endFrame() {
        pressed.clear();
        released.clear();
      },
      clear(action) {
        held.delete(action);
        pressed.delete(action);
        released.delete(action);
      }
    };
  }

  MotoRidge.createInput = createInput;
})();
