(function () {
  "use strict";
  const B = window.Burrow;
  B.createInput = function (canvas, active, pause) {
    const held = new Set(),
      pressed = new Set();
    const relevant = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
      "KeyJ",
      "ShiftLeft",
      "ShiftRight",
      "KeyF",
      "KeyE",
      "Escape",
    ]);
    const clear = () => {
      held.clear();
      pressed.clear();
    };
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        if (active()) {
          event.preventDefault();
          pause();
        }
        return;
      }
      if (
        !active() ||
        document.activeElement !== canvas ||
        !relevant.has(event.code)
      )
        return;
      event.preventDefault();
      if (!held.has(event.code) && !event.repeat) pressed.add(event.code);
      held.add(event.code);
    });
    window.addEventListener("keyup", (event) => held.delete(event.code));
    window.addEventListener("blur", () => {
      clear();
      if (active()) pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clear();
        if (active()) pause();
      }
    });
    canvas.addEventListener("blur", clear);
    return {
      clear,
      direction() {
        let x =
          Number(held.has("KeyD") || held.has("ArrowRight")) -
          Number(held.has("KeyA") || held.has("ArrowLeft"));
        let y =
          Number(held.has("KeyS") || held.has("ArrowDown")) -
          Number(held.has("KeyW") || held.has("ArrowUp"));
        const length = Math.hypot(x, y);
        if (length) {
          x /= length;
          y /= length;
        }
        return { x, y };
      },
      take(code) {
        const value = pressed.has(code);
        pressed.delete(code);
        return value;
      },
      finish() {
        pressed.clear();
      },
    };
  };
})();
