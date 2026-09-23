(function () {
  "use strict";
  const B = window.Burrow,
    A = window.BurrowArt;
  B.createRenderer = function (canvas) {
    const ctx = canvas.getContext("2d"),
      cache = new Map();
    ctx.imageSmoothingEnabled = false;
    function sprite(group, frame, x, y, scale, flip) {
      const rows = A[group] && A[group][frame];
      if (!rows) return;
      const key = group + frame;
      if (!cache.has(key)) {
        const art = document.createElement("canvas");
        art.width = Math.max(...rows.map((row) => row.length));
        art.height = rows.length;
        const ac = art.getContext("2d");
        rows.forEach((row, yy) =>
          [...row].forEach((pixel, xx) => {
            const color = A.PALETTE[parseInt(pixel, 16)];
            if (color) {
              ac.fillStyle = color;
              ac.fillRect(xx, yy, 1, 1);
            }
          }),
        );
        cache.set(key, art);
      }
      const art = cache.get(key);
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(
        art,
        -Math.floor((art.width * scale) / 2),
        -art.height * scale + 10,
        art.width * scale,
        art.height * scale,
      );
      ctx.restore();
    }
    function text(value, x, y, color, size) {
      ctx.font = `${size || 11}px monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(value, x, y);
    }
    function glow(x, y, radius, color) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    function shadow(x, y, radius) {
      ctx.fillStyle = "#07071160";
      ctx.beginPath();
      ctx.ellipse(x, y + 3, radius, radius * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    function door(x, openness) {
      const height = Math.round(52 * (1 - openness));
      ctx.fillStyle = "#201725";
      ctx.fillRect(x + 2, 214, 32, 104);
      if (height) {
        ctx.fillStyle = "#594456";
        ctx.fillRect(x + 4, 214, 28, height);
        ctx.fillRect(x + 4, 318 - height, 28, height);
        if (height > 4) {
          ctx.fillStyle = "#b2967c";
          ctx.fillRect(x + 4, 211 + height, 28, 3);
          ctx.fillRect(x + 4, 318 - height, 28, 3);
        }
      }
      ctx.fillStyle = "#836e7d";
      ctx.fillRect(x, 210, 4, 110);
      ctx.fillRect(x + 32, 210, 4, 110);
    }
    function random(seed) {
      const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    const backgrounds = B.rooms.map((room, index) => {
      const bg = document.createElement("canvas");
      bg.width = 960;
      bg.height = 528;
      const c = bg.getContext("2d");
      c.fillStyle = room.color;
      c.fillRect(0, 0, 960, 528);
      // Hand-laid paving, scattered mineral flecks, roots and moss. All local drawing.
      for (let y = 32; y < 502; y += 24)
        for (let x = 24; x < 936; x += 24) {
          const seed = x * 2 + y * 31 + index * 97,
            r = random(seed);
          c.fillStyle = ["#2c2638", "#302838", "#282432", "#322a3d", "#292331"][
            Math.floor(r * 5)
          ];
          c.fillRect(x, y, 23, 23);
          c.fillStyle = "#63516a22";
          c.fillRect(x + 2, y + 1, 19, 1);
          if (r > 0.65) {
            c.fillStyle = "#7d69712e";
            c.fillRect(x + 6, y + 7, 3, 2);
            c.fillRect(x + 15, y + 17, 2, 2);
          }
          if (r < 0.12) {
            c.fillStyle = "#697c4928";
            c.fillRect(x + 3, y + 14, 8, 3);
            c.fillRect(x + 8, y + 10, 4, 6);
          }
        }
      // Winding pale path keeps the route legible in the dark.
      for (let x = 48; x < 930; x += 30) {
        const y = 272 + Math.sin(x / 119 + index) * 20;
        c.fillStyle = "#9a85920f";
        c.fillRect(x, y - 25, 27, 48);
        c.fillStyle = "#ad95921a";
        c.fillRect(x + 4, y + 11, 12, 2);
      }
      if (index === 0) {
        c.fillStyle = "#4c4053";
        c.fillRect(416, 241, 146, 118);
        c.fillStyle = "#393341";
        c.fillRect(423, 248, 132, 105);
        c.strokeStyle = "#7b686458";
        c.lineWidth = 1;
        [38, 52].forEach((r) => {
          c.beginPath();
          c.ellipse(490, 306, r, r * 0.6, 0, 0, Math.PI * 2);
          c.stroke();
        });
      }
      if (index === 1) {
        c.fillStyle = "#55434f";
        c.fillRect(765, 67, 84, 61);
        c.fillStyle = "#3a2d3e";
        c.fillRect(772, 73, 70, 48);
      }
      if (index === 2) {
        c.strokeStyle = "#ae66622c";
        c.lineWidth = 2;
        [120, 172, 188].forEach((r) => {
          c.beginPath();
          c.ellipse(508, 275, r * 1.2, r, 0, 0, Math.PI * 2);
          c.stroke();
        });
        for (let a = 0; a < 12; a++) {
          const angle = (a * Math.PI) / 6;
          c.fillStyle = "#ad737442";
          c.fillRect(
            508 + Math.cos(angle) * 216,
            275 + Math.sin(angle) * 180,
            4,
            4,
          );
        }
      }
      function wall(x, y, w, h) {
        c.fillStyle = "#0b0a1399";
        c.fillRect(x + 7, y + 12, w + 3, h + 4);
        c.fillStyle = "#191520";
        c.fillRect(x, y, w, h);
        for (let yy = y; yy < y + h; yy += 16)
          for (let xx = x; xx < x + w; xx += 32) {
            const ww = Math.min(30, x + w - xx),
              hh = Math.min(14, y + h - yy);
            c.fillStyle = random(xx + yy * 19) > 0.5 ? "#393044" : "#332b3f";
            c.fillRect(xx, yy, ww, hh);
            c.fillStyle = "#70607844";
            c.fillRect(xx + 1, yy, Math.max(1, ww - 2), 2);
          }
        c.fillStyle = "#75637c";
        c.fillRect(x, y, w, 3);
        c.fillStyle = "#110e19";
        c.fillRect(x, y + h - 4, w, 4);
        for (let i = 8; i < w; i += 31) {
          c.fillStyle = "#60724780";
          c.fillRect(x + i, y, 9, 3);
          c.fillRect(x + i + 3, y + 3, 3, 7);
        }
      }
      wall(0, 0, 960, 43);
      wall(0, 494, 960, 34);
      wall(0, 43, 32, 451);
      wall(928, 43, 32, 451);
      room.obstacles.forEach((o) => wall(o.x, o.y, o.w, o.h));
      // Doorways sit inside the boundary, where the transition trigger can be reached.
      const sides = index === 0 ? [1] : index === 1 ? [0, 1] : [0];
      sides.forEach((side) => {
        const x = side ? 892 : 32;
        c.fillStyle = "#17101f";
        c.fillRect(x, 213, 36, 107);
        c.fillStyle = "#705b70";
        c.fillRect(x, 209, 36, 5);
        c.fillRect(x, 319, 36, 5);
      });
      return bg;
    });
    return function render(state, settings, time, title) {
      ctx.save();
      if (!settings.motion && state.shake > 0)
        ctx.translate(
          Math.sin(time * 101) * state.shake,
          Math.cos(time * 83) * state.shake,
        );
      ctx.drawImage(backgrounds[state.room], 0, 0);
      const room = B.rooms[state.room];
      // Light pools retain texture, rather than washing out the cave.
      if (room.lantern)
        glow(room.lantern.x, room.lantern.y - 28, 205, "#b4773725");
      glow(state.player.x, state.player.y, 140, "#ae91be13");
      if (state.room === 2) glow(640, 260, 220, "#9e35451c");
      for (const prop of room.props)
        sprite("PROPS", prop[0], prop[1], prop[2], prop[3]);
      // Lantern sconces on both sides of the path.
      for (const x of [60, 903]) {
        glow(x, 198, 73, "#d89b3835");
        sprite(
          "ITEMS",
          "grace_" + (settings.motion ? 1 : 1 + (Math.floor(time * 7) % 3)),
          x,
          202,
          1.8,
        );
      }
      if (room.lantern) {
        sprite(
          "ITEMS",
          "grace_" + (settings.motion ? 1 : 1 + (Math.floor(time * 7) % 3)),
          room.lantern.x,
          room.lantern.y,
          3.2,
        );
        text(
          "LANTERN OF RETURN",
          room.lantern.x,
          room.lantern.y + 35,
          "#b4a080",
          9,
        );
      }
      if (room.key && !state.key) {
        glow(room.key.x, room.key.y, 62, "#e5c77235");
        sprite(
          "ITEMS",
          "bone_key",
          room.key.x,
          room.key.y + (settings.motion ? 0 : Math.sin(time * 3) * 3),
          2.5,
        );
        text("BONE KEY", room.key.x, room.key.y + 31, "#e8cc8d", 9);
      }
      if (state.room > 0) door(32, state.doors.left);
      if (state.room < B.rooms.length - 1) door(892, state.doors.right);
      if (state.room === 1 && !state.gateOpen) {
        for (let y = 224; y < 310; y += 21) {
          ctx.fillStyle = "#b7a0a0";
          ctx.fillRect(901, y, 18, 4);
        }
        text(state.key ? "[ E ] UNLOCK" : "LOCKED", 863, 340, "#d8bb80", 9);
      }
      if (state.room === 0) text("TO THE CAVE →", 830, 270, "#b6a083", 10);
      if (state.room === 1) text("← CAMP", 92, 338, "#a08eaa", 9);
      for (const npc of room.npcs) {
        shadow(npc.x, npc.y, 19);
        sprite(
          "RABBIT",
          npc.name === "Pip" ? "idle_down_1" : "idle_up_1",
          npc.x,
          npc.y + (settings.motion ? 0 : Math.sin(time * 2) * 1),
          3,
        );
        ctx.fillStyle = npc.name === "Pip" ? "#bd984f" : "#638567";
        ctx.fillRect(npc.x - 10, npc.y - 17, 20, 4);
        text(npc.name.toUpperCase(), npc.x, npc.y + 28, "#d9c4a1", 10);
        text("[ E ]", npc.x, npc.y + 42, "#8f819c", 8);
      }
      // Combat warnings are geometric and visible even with reduced motion enabled.
      for (const e of state.enemies)
        if (e.hp > 0 && e.state === "windup") {
          const r =
            e.type === "boss"
              ? e.phase === 2
                ? 116
                : 88
              : e.type === "spider"
                ? 40
                : 43;
          const x = e.type === "spider" ? e.attackX : e.x,
            y = e.type === "spider" ? e.attackY : e.y;
          ctx.fillStyle = "#df6e6033";
          ctx.strokeStyle = "#f2a07d";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          text("!", e.x, e.y - (e.type === "boss" ? 78 : 50), "#ffe4a0", 18);
        }
      const actors = state.enemies
        .filter((e) => e.hp > 0)
        .map((e) => ({ ...e, enemy: e }));
      actors.push({ ...state.player, player: true });
      actors.sort((a, b) => a.y - b.y);
      for (const actor of actors) {
        if (actor.player) {
          const p = state.player,
            side = Math.abs(p.facingX) > Math.abs(p.facingY),
            direction = side ? "side" : p.facingY < 0 ? "up" : "down";
          let frame = p.moving
            ? "walk_" + direction + "_" + (1 + (Math.floor(time * 10) % 2))
            : "idle_" + direction + "_1";
          if (p.attack > 0) frame = "attack_" + direction;
          if (p.dodge > 0) frame = "roll_" + (1 + (Math.floor(time * 18) % 2));
          shadow(p.x, p.y, 19);
          if (p.invulnerable > 0 && !settings.motion)
            ctx.globalAlpha = 0.65 + Math.sin(time * 35) * 0.25;
          sprite("RABBIT", frame, p.x, p.y, 3, p.facingX < 0 && side);
          ctx.globalAlpha = 1;
          if (p.attack > 0) {
            const angle = Math.atan2(p.facingY, p.facingX),
              progress = 1 - p.attack / B.config.attackDuration;
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#f5ddae";
            ctx.beginPath();
            ctx.arc(
              p.x,
              p.y - 12,
              49,
              angle - 1 + progress,
              angle + 0.8 + progress,
            );
            ctx.stroke();
          }
        } else {
          const e = actor.enemy,
            boss = e.type === "boss";
          shadow(e.x, e.y, boss ? 43 : 19);
          let frame =
            e.type === "spider"
              ? "scuttle_" + (1 + (Math.floor(time * 8) % 2))
              : "idle_" + (1 + (Math.floor(time * 4) % 2));
          if (boss && e.phase === 2) frame = "enraged";
          if (boss && e.state === "windup") frame = "rear_up";
          if (e.flash) ctx.globalAlpha = 0.55;
          sprite(
            e.type.toUpperCase(),
            frame,
            e.x,
            e.y,
            boss ? 3 : 2.6,
            e.x > state.player.x,
          );
          ctx.globalAlpha = 1;
          if (!boss && e.hp < e.maxHp) {
            ctx.fillStyle = "#150f20";
            ctx.fillRect(e.x - 18, e.y - 44, 36, 4);
            ctx.fillStyle = "#d58a82";
            ctx.fillRect(e.x - 18, e.y - 44, (36 * e.hp) / e.maxHp, 3);
          }
        }
      }
      for (const particle of state.particles) {
        ctx.globalAlpha = Math.min(1, particle.life * 2);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 3, 3);
      }
      ctx.globalAlpha = 1;
      if (!settings.motion)
        for (let i = 0; i < 25; i++) {
          const x = random(i + 7) * 960 + Math.sin(time * 0.4 + i) * 16,
            y = (random(i + 58) * 528 - time * (2 + (i % 4))) % 528;
          ctx.fillStyle = i % 3 === 0 ? "#d6b67e70" : "#c8b0d92a";
          ctx.fillRect(x, y < 0 ? y + 528 : y, 2, 2);
        }
      const vignette = ctx.createRadialGradient(490, 280, 165, 490, 280, 560);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "#080612a8");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 960, 528);
      const boss = state.enemies.find((e) => e.type === "boss");
      if (boss && boss.hp > 0) {
        text(
          "THE DEVOURER" + (boss.phase === 2 ? " / AWAKENED" : ""),
          480,
          58,
          "#e0c3c4",
          11,
        );
        ctx.fillStyle = "#160e1b";
        ctx.fillRect(290, 68, 380, 6);
        ctx.fillStyle = boss.phase === 2 ? "#d89479" : "#c37480";
        ctx.fillRect(290, 68, (380 * boss.hp) / boss.maxHp, 6);
      }
      if (title) {
        glow(670, 285, 110, "#d9a46018");
        text("THE LANTERN CAMP", 695, 464, "#a991b2", 9);
      }
      ctx.restore();
    };
  };
})();
