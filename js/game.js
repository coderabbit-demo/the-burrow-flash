(function () {
  "use strict";
  const B = window.Burrow,
    C = B.config,
    $ = (id) => document.getElementById(id);
  const canvas = $("game"),
    render = B.createRenderer(canvas);
  const flaskIcons = [...document.querySelectorAll(".flask-icon")];
  const saved = B.storage.read("settings", {}),
    prefs = saved && typeof saved === "object" ? saved : {};
  const settings = {
    sound: prefs.sound === true,
    motion:
      typeof prefs.motion === "boolean"
        ? prefs.motion
        : matchMedia("(prefers-reduced-motion: reduce)").matches,
    assist: prefs.assist === true,
  };
  let state = B.createState(),
    started = false,
    paused = true,
    last = 0,
    toastTimer = 0,
    audio;
  B.state = state;
  const menu = $("menu-dialog"),
    npcDialog = $("npc-dialog"),
    victory = $("victory-dialog");
  const input = B.createInput(
    canvas,
    () => started && !paused && !state.won,
    pause,
  );
  function sound(kind) {
    if (!settings.sound) return;
    try {
      if (!audio)
        audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(),
        gain = audio.createGain();
      const frequency =
        { attack: 310, hurt: 98, heal: 620, key: 860, slam: 65, dodge: 210 }[
          kind
        ] || 430;
      oscillator.type =
        kind === "slam" || kind === "hurt" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * (kind === "key" ? 1.5 : 0.5),
        audio.currentTime + 0.17,
      );
      gain.gain.setValueAtTime(0.055, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.23);
    } catch (_) {
      /* Audio is optional; browser restrictions never block the game. */
    }
  }
  function notice(message) {
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    toastTimer = 4;
  }
  function burst(x, y, color, count) {
    if (settings.motion) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2,
        speed = 25 + Math.random() * 70;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.4 + Math.random() * 0.3,
        color,
      });
    }
  }
  const effects = {
    notice,
    burst,
    sound,
    hurt() {
      state.shake = settings.motion ? 0 : 5;
      burst(state.player.x, state.player.y, "#e18588", 12);
      sound("hurt");
    },
  };
  function pause() {
    if (!started || state.won) return;
    paused = true;
    input.clear();
    if (!menu.open && !npcDialog.open) menu.showModal();
  }
  function resume() {
    if (!started || state.won) return;
    if (menu.open) menu.close();
    if (npcDialog.open) npcDialog.close();
    paused = false;
    input.clear();
    canvas.focus({ preventScroll: true });
  }
  function restart() {
    // Close dialogs before replacing the state. No prior run flags survive.
    [menu, npcDialog, victory].forEach((d) => {
      if (d.open) d.close();
    });
    state = B.createState();
    B.state = state;
    started = true;
    paused = false;
    $("title-screen").hidden = true;
    $("pause-button").disabled = false;
    input.clear();
    canvas.focus({ preventScroll: true });
    sound("key");
    notice(
      "Welcome, little wanderer. J strikes. Shift dodges. E talks or rests.",
    );
    updateHud();
  }
  function interactTarget() {
    const room = B.rooms[state.room],
      p = state.player;
    const npc = room.npcs.find((n) => B.distance(p, n) < 65);
    if (npc) return { label: "Talk to " + npc.name, npc };
    if (room.lantern && B.distance(p, room.lantern) < 68)
      return { label: "Rest at the lantern", lantern: true };
    if (
      state.room === 1 &&
      p.x > 843 &&
      Math.abs(p.y - 267) < 67 &&
      !state.gateOpen
    )
      return {
        label: state.key ? "Unlock the hollow" : "The gate needs the bone key",
        gate: true,
      };
    return null;
  }
  function interact(target) {
    if (!target) return;
    if (target.npc) {
      paused = true;
      input.clear();
      const npc = target.npc;
      $("npc-role").textContent = npc.role;
      $("npc-title").textContent = npc.name + " has a field note.";
      $("npc-copy").textContent = npc.text;
      $("npc-guide").href = "learn.html#" + npc.lesson;
      npcDialog.showModal();
    } else if (target.lantern) {
      Object.assign(state.player, { hp: 100, stamina: 100, flasks: 3 });
      sound("heal");
      burst(state.player.x, state.player.y, "#e8bd78", 16);
      notice("Restored. Three flasks, steady paws, and another chance.");
    } else if (target.gate) {
      if (B.openGate(state)) {
        sound("key");
        notice("The bone gate opens. The Devourer is waiting.");
      } else notice("Look for the bone key on the altar in the northeast.");
    }
  }
  function update(dt) {
    const p = state.player,
      room = B.rooms[state.room];
    state.elapsed += dt;
    state.transitionCooldown = Math.max(0, state.transitionCooldown - dt);
    state.noticeCooldown = Math.max(0, state.noticeCooldown - dt);
    state.shake = Math.max(0, state.shake - dt * 25);
    B.tickPlayer(p, dt, settings.assist);
    const direction = input.direction();
    p.moving = !!(direction.x || direction.y);
    if (p.moving && p.dodge <= 0) {
      p.facingX = direction.x;
      p.facingY = direction.y;
    }
    if (input.take("KeyJ") && B.beginAttack(p)) sound("attack");
    const dodgePressed = input.take("ShiftLeft") || input.take("ShiftRight");
    if (dodgePressed && B.beginDodge(p, direction.x, direction.y))
      sound("dodge");
    if (input.take("KeyF")) {
      if (B.heal(p)) {
        sound("heal");
        burst(p.x, p.y, "#a5ba92", 12);
      } else
        notice(
          p.flasks
            ? "You are already at full vitality."
            : "No flasks left. Return to the camp lantern.",
        );
    }
    if (p.dodge > 0)
      B.move(
        p,
        p.dodgeX * C.dodgeSpeed * dt,
        p.dodgeY * C.dodgeSpeed * dt,
        room,
      );
    else
      B.move(
        p,
        direction.x * C.speed * dt * (p.attack > 0 ? 0.55 : 1),
        direction.y * C.speed * dt * (p.attack > 0 ? 0.55 : 1),
        room,
      );
    for (const enemy of state.enemies) {
      if (B.strike(p, enemy, settings.assist)) {
        burst(enemy.x, enemy.y - 10, "#e8bd78", 9);
        if (enemy.hp <= 0) {
          state.kills++;
          if (enemy.type === "boss") win();
        }
      }
      if (state.won) break;
      B.updateEnemy(enemy, state, dt, settings.assist, effects);
    }
    if (p.hp <= 0) {
      B.respawn(state);
      input.clear();
      notice(
        "The lantern calls you home. Your key is safe. Try a slower approach.",
      );
      updateHud();
      return;
    }
    if (B.collectKey(state)) {
      sound("key");
      burst(p.x, p.y, "#e8bd78", 24);
      notice("Bone key found. Find the gate on the eastern wall.");
    }
    const target = interactTarget();
    $("interaction").hidden = !target;
    $("interaction").textContent = target ? "[ E ]  " + target.label : "";
    if (input.take("KeyE")) interact(target);
    if (!paused && state.transitionCooldown <= 0 && Math.abs(p.y - 267) < 51) {
      if (p.x > 903 && state.room < 2) {
        if (state.room === 0 || state.gateOpen) {
          B.enterRoom(state, state.room + 1, false);
          notice(B.rooms[state.room].subtitle);
        } else if (!state.noticeCooldown) {
          notice(
            state.key
              ? "Press E to unlock the gate."
              : "The northern altar holds the bone key.",
          );
          state.noticeCooldown = 3;
        }
      } else if (p.x < 53 && state.room > 0) {
        B.enterRoom(state, state.room - 1, true);
        notice("A moment to catch your breath.");
      }
    }
    B.updateDoors(state, dt, settings.motion);
    state.particles = state.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      return particle.life > 0;
    });
    input.finish();
    updateHud();
  }
  function win() {
    state.won = true;
    paused = true;
    input.clear();
    sound("key");
    $("interaction").hidden = true;
    $("victory-stats").textContent =
      `${Math.floor(state.elapsed / 60)}m ${Math.floor(state.elapsed % 60)}s in the hollow · ${state.deaths} returns to the lantern${settings.assist ? " · Assist enabled" : ""}`;
    victory.showModal();
  }
  function updateHud() {
    const p = state.player;
    $("health").value = p.hp;
    $("health-value").textContent = Math.ceil(p.hp) + " / 100";
    $("stamina").value = p.stamina;
    $("stamina-value").textContent = Math.floor(p.stamina) + " / 100";
    flaskIcons.forEach((icon, index) => {
      icon.classList.toggle("is-empty", index >= p.flasks);
    });
    $("flask-icons").setAttribute(
      "aria-label",
      `${p.flasks} of 3 healing flasks remaining`,
    );
    $("flask-count").textContent = `${p.flasks} / 3`;
    $("key-status").textContent = state.key ? "BONE KEY" : "NO KEY";
    $("area-name").textContent = B.rooms[state.room].name;
    $("objective").textContent =
      state.room === 0
        ? "Rest. Meet the locals. Head east."
        : state.room === 1
          ? state.key
            ? "Open the eastern gate. [ E ]"
            : "Find the bone key on the northern altar."
          : "Dodge the warning. Strike during recovery.";
    $("assist-indicator").hidden = !settings.assist;
  }
  $("start-button").addEventListener("click", restart);
  $("pause-button").addEventListener("click", pause);
  $("settings-button").addEventListener("click", () => {
    paused = true;
    input.clear();
    if (!menu.open) menu.showModal();
  });
  $("resume-button").addEventListener("click", () => {
    if (started) resume();
    else menu.close();
  });
  $("restart-button").addEventListener("click", restart);
  $("play-again").addEventListener("click", restart);
  $("npc-close").addEventListener("click", resume);
  [menu, npcDialog].forEach((dialog) =>
    dialog.addEventListener("close", () => {
      if (
        paused &&
        started &&
        !state.won &&
        !menu.open &&
        !npcDialog.open &&
        !victory.open
      )
        resume();
    }),
  );
  // Keep Tab navigation within the active dialog, including at browser-chrome boundaries.
  [menu, npcDialog, victory].forEach((dialog) =>
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          "button:not(:disabled), a[href], input:not(:disabled)",
        ),
      ];
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }),
  );
  victory.addEventListener("cancel", (e) => e.preventDefault());
  document.querySelectorAll("[data-guide]").forEach((link) =>
    link.addEventListener("click", () => {
      if (started && !paused) pause();
    }),
  );
  for (const [id, key] of [
    ["sound-setting", "sound"],
    ["motion-setting", "motion"],
    ["assist-setting", "assist"],
  ]) {
    $(id).checked = settings[key];
    $(id).addEventListener("change", () => {
      settings[key] = $(id).checked;
      B.storage.write("settings", settings);
      if (key === "sound") sound("key");
      if (key === "motion" && settings.motion) {
        state.particles = [];
        state.shake = 0;
      }
      updateHud();
    });
  }
  // Title scene is a living preview of the same world, with no simulated combat.
  function frame(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.033);
    last = now;
    if (started && !paused) update(dt);
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) $("toast").classList.remove("visible");
    }
    render(state, settings, now / 1000, !started);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
