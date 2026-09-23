(function () {
  "use strict";
  const B = (window.Burrow = {});
  B.config = Object.freeze({
    width: 960,
    height: 528,
    speed: 155,
    dodgeSpeed: 405,
    dodgeDuration: 0.23,
    dodgeCost: 28,
    attackCost: 16,
    attackDuration: 0.24,
    attackCooldown: 0.38,
    attackDamage: 27,
    attackReach: 62,
    regen: 29,
    maxHealth: 100,
  });
  B.rooms = [
    {
      name: "THE LANTERN CAMP",
      subtitle: "A light in the dark.",
      color: "#272333",
      obstacles: [
        { x: 130, y: 80, w: 185, h: 115 },
        { x: 395, y: 65, w: 160, h: 76 },
        { x: 145, y: 391, w: 210, h: 72 },
      ],
      enemies: [],
      lantern: { x: 490, y: 300 },
      npcs: [
        {
          x: 660,
          y: 190,
          name: "Pip",
          role: "THE PATHFINDER",
          lesson: "setup",
          text: "The old cave is east of here. Find the bone key on its northern altar, then open the far gate. Building your own path? Start by connecting this little world to CodeRabbit.",
        },
        {
          x: 755,
          y: 375,
          name: "Moss",
          role: "THE PLAN KEEPER",
          lesson: "plan",
          text: "A good adventure starts with a good plan. Write down the change you want, give it clear acceptance criteria, then ask CodeRabbit to plan it in a GitHub issue. Read the plan before you build.",
        },
      ],
      props: [
        ["dead_tree", 205, 150, 4],
        ["pillar", 459, 118, 3],
        ["tombstone", 219, 436, 3],
        ["mushroom", 575, 423, 3],
        ["mushroom", 831, 121, 3],
        ["bone_pile", 86, 355, 2],
      ],
    },
    {
      name: "THE ROOTBOUND CAVE",
      subtitle: "Find the bone key on the northern altar.",
      color: "#26202e",
      obstacles: [
        { x: 205, y: 90, w: 105, h: 145 },
        { x: 205, y: 330, w: 165, h: 102 },
        { x: 465, y: 185, w: 125, h: 172 },
        { x: 700, y: 315, w: 95, h: 117 },
      ],
      enemies: [
        ["grub", 170, 275],
        ["spider", 378, 150],
        ["grub", 390, 305],
        ["spider", 444, 427],
        ["grub", 648, 240],
        ["spider", 747, 174],
        ["grub", 845, 365],
      ],
      key: { x: 807, y: 94 },
      npcs: [],
      props: [
        ["dead_tree", 247, 174, 3],
        ["pillar", 525, 250, 3],
        ["pillar", 528, 333, 3],
        ["bone_pile", 314, 405, 3],
        ["web_decal", 409, 105, 3],
        ["mushroom", 644, 441, 3],
        ["tombstone_cracked", 748, 387, 3],
      ],
    },
    {
      name: "THE DEVOURER'S HOLLOW",
      subtitle: "Watch the warning. Dodge the strike.",
      color: "#2c202c",
      obstacles: [
        { x: 160, y: 90, w: 55, h: 65 },
        { x: 160, y: 385, w: 55, h: 65 },
        { x: 764, y: 90, w: 55, h: 65 },
        { x: 764, y: 385, w: 55, h: 65 },
      ],
      enemies: [["boss", 657, 265]],
      npcs: [],
      props: [
        ["pillar", 187, 135, 3],
        ["pillar", 187, 434, 3],
        ["pillar", 792, 135, 3],
        ["pillar", 792, 434, 3],
        ["bone_pile", 500, 104, 3],
        ["bone_pile", 562, 436, 3],
      ],
    },
  ];
  B.distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  B.circleRect = function (x, y, radius, rect) {
    const dx = x - Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const dy = y - Math.max(rect.y, Math.min(y, rect.y + rect.h));
    return dx * dx + dy * dy < radius * radius;
  };
  B.blocked = function (room, x, y, radius) {
    if (
      x < 32 + radius ||
      x > 928 - radius ||
      y < 43 + radius ||
      y > 494 - radius
    )
      return true;
    return room.obstacles.some((rect) => B.circleRect(x, y, radius, rect));
  };
  // Small substeps keep a dodge from tunneling through walls, including after a slow frame.
  B.move = function (actor, dx, dy, room) {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 5),
    );
    for (let i = 0; i < steps; i++) {
      if (!B.blocked(room, actor.x + dx / steps, actor.y, actor.radius))
        actor.x += dx / steps;
      if (!B.blocked(room, actor.x, actor.y + dy / steps, actor.radius))
        actor.y += dy / steps;
    }
  };
  B.createEnemy = function (type, x, y, index) {
    const hp = type === "boss" ? 675 : type === "spider" ? 65 : 81;
    return {
      id: index,
      type,
      x,
      y,
      homeX: x,
      homeY: y,
      radius: type === "boss" ? 27 : 13,
      hp,
      maxHp: hp,
      state: "idle",
      timer: 0.5 + index * 0.13,
      phase: 1,
      flash: 0,
      age: index,
      attackX: x,
      attackY: y,
    };
  };
  B.createState = function () {
    return {
      room: 0,
      player: {
        x: 470,
        y: 359,
        radius: 11,
        hp: 100,
        stamina: 100,
        flasks: 3,
        facingX: 1,
        facingY: 0,
        moving: false,
        attack: 0,
        cooldown: 0,
        dodge: 0,
        invulnerable: 0,
        regenDelay: 0,
        hits: new Set(),
        dodgeX: 1,
        dodgeY: 0,
      },
      key: false,
      gateOpen: false,
      won: false,
      elapsed: 0,
      deaths: 0,
      kills: 0,
      enemies: [],
      particles: [],
      shake: 0,
      doors: { left: 0, right: 0 },
      transitionCooldown: 0,
      noticeCooldown: 0,
    };
  };
  B.enterRoom = function (state, room, fromRight) {
    state.room = room;
    state.enemies = B.rooms[room].enemies.map((e, i) => B.createEnemy(...e, i));
    state.player.x = fromRight ? 876 : room === 0 ? 470 : 80;
    state.player.y = room === 0 && !fromRight ? 359 : 270;
    state.player.invulnerable = 1;
    state.player.attack = 0;
    state.player.dodge = 0;
    state.particles = [];
    state.doors = {
      left: room > 0 && !fromRight ? 1 : 0,
      right: fromRight ? 1 : 0,
    };
    state.transitionCooldown = 0.6;
  };
  B.updateDoors = function (state, dt, reducedMotion) {
    const nearPassage = Math.abs(state.player.y - 267) < 51;
    for (const side of ["left", "right"]) {
      const available =
        side === "left"
          ? state.room > 0
          : state.room < B.rooms.length - 1 &&
            (state.room !== 1 || state.gateOpen);
      const nearDoor =
        side === "left" ? state.player.x < 170 : state.player.x > 790;
      const target = available && nearPassage && nearDoor ? 1 : 0;
      state.doors[side] = reducedMotion
        ? target
        : Math.max(0, Math.min(1, state.doors[side] + (target ? 1 : -1) * dt * 4));
    }
  };
  B.collectKey = function (state) {
    const key = B.rooms[state.room].key;
    if (!state.key && key && B.distance(state.player, key) < 39) {
      state.key = true;
      return true;
    }
    return false;
  };
  B.openGate = function (state) {
    if (!state.key) return false;
    state.gateOpen = true;
    return true;
  };
  B.respawn = function (state) {
    state.deaths++;
    B.enterRoom(state, 0, false);
    Object.assign(state.player, {
      hp: 100,
      stamina: 100,
      flasks: 3,
      cooldown: 0,
      regenDelay: 0,
    });
  };
  B.storage = {
    read(key, fallback) {
      try {
        const value = localStorage.getItem("burrow-flash." + key);
        return value ? JSON.parse(value) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem("burrow-flash." + key, JSON.stringify(value));
      } catch (_) {
        /* Session state remains available when storage is blocked. */
      }
    },
  };
})();
