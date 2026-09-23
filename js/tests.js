(function () {
  "use strict";
  const B = window.Burrow,
    results = [];
  function assert(value, message) {
    if (!value) throw new Error(message || "Assertion failed");
  }
  function test(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
    } catch (error) {
      results.push({ name, pass: false, error: error.message });
    }
  }
  const player = () => B.createState().player;
  test("Circle collision detects edges, corners, and open floor", () => {
    const rect = { x: 100, y: 100, w: 30, h: 30 };
    assert(B.circleRect(95, 115, 10, rect));
    assert(!B.circleRect(80, 115, 10, rect));
    assert(!B.circleRect(92, 92, 10, rect));
    assert(B.circleRect(94, 94, 10, rect));
  });
  test("Fast movement cannot tunnel through an obstacle", () => {
    const p = { x: 80, y: 200, radius: 10 };
    const room = { obstacles: [{ x: 140, y: 150, w: 15, h: 150 }] };
    B.move(p, 300, 0, room);
    assert(p.x <= 130);
  });
  test("Movement respects all world boundaries", () => {
    const p = player(),
      room = { obstacles: [] };
    B.move(p, -2000, -2000, room);
    assert(p.x >= 43 && p.y >= 54);
    B.move(p, 3000, 3000, room);
    assert(p.x <= 917 && p.y <= 483);
  });
  test("Movement slides along walls without entering them", () => {
    const p = { x: 130, y: 200, radius: 10 },
      room = { obstacles: [{ x: 140, y: 150, w: 30, h: 150 }] };
    B.move(p, 40, 50, room);
    assert(p.x === 130 && p.y === 250);
  });
  test("Every room spawn, enemy and objective occupies walkable floor", () => {
    B.rooms.forEach((room) => {
      room.enemies.forEach(([type, x, y]) =>
        assert(!B.blocked(room, x, y, type === "boss" ? 27 : 13)),
      );
      room.npcs.forEach((n) => assert(!B.blocked(room, n.x, n.y, 11)));
      if (room.key) assert(!B.blocked(room, room.key.x, room.key.y, 11));
    });
  });
  test("Melee spends stamina and enforces cooldown", () => {
    const p = player();
    assert(B.beginAttack(p));
    assert(p.stamina === 84);
    assert(!B.beginAttack(p));
    B.tickPlayer(p, 0.4, false);
    assert(B.beginAttack(p));
  });
  test("An attack damages each enemy only once", () => {
    const p = player(),
      e = B.createEnemy("grub", p.x + 30, p.y, 0);
    B.beginAttack(p);
    assert(B.strike(p, e, false));
    assert(!B.strike(p, e, false));
    assert(e.hp === e.maxHp - B.config.attackDamage);
  });
  test("A new attack can hit the same enemy again", () => {
    const p = player(),
      e = B.createEnemy("grub", p.x + 30, p.y, 0);
    B.beginAttack(p);
    B.strike(p, e, false);
    B.tickPlayer(p, 0.5, false);
    B.beginAttack(p);
    assert(B.strike(p, e, false));
  });
  test("Melee cannot hit behind the rabbit or beyond reach", () => {
    const p = player();
    B.beginAttack(p);
    assert(!B.strike(p, B.createEnemy("grub", p.x - 50, p.y, 0), false));
    assert(!B.strike(p, B.createEnemy("grub", p.x + 120, p.y, 1), false));
  });
  test("Expired attack windows deal no damage", () => {
    const p = player(),
      e = B.createEnemy("grub", p.x + 30, p.y, 0);
    B.beginAttack(p);
    B.tickPlayer(p, 0.25, false);
    assert(!B.strike(p, e, false));
  });
  test("Low stamina prevents attacks and dodges", () => {
    const p = player();
    p.stamina = 10;
    assert(!B.beginAttack(p));
    assert(!B.beginDodge(p, 1, 0));
    assert(p.stamina === 10);
  });
  test("A dodge cannot start during an attack", () => {
    const p = player();
    B.beginAttack(p);
    assert(!B.beginDodge(p, 1, 0));
  });
  test("Dodge direction is normalized and invulnerable only temporarily", () => {
    const p = player();
    assert(B.beginDodge(p, 1, 1));
    assert(Math.abs(Math.hypot(p.dodgeX, p.dodgeY) - 1) < 1e-9);
    assert(!B.hurtPlayer(p, 20, false));
    B.tickPlayer(p, 0.24, false);
    assert(B.hurtPlayer(p, 20, false));
  });
  test("Stationary dodge follows the facing direction", () => {
    const p = player();
    p.facingX = 0;
    p.facingY = -1;
    B.beginDodge(p, 0, 0);
    assert(p.dodgeX === 0 && p.dodgeY === -1);
  });
  test("Stamina waits before regenerating and never exceeds 100", () => {
    const p = player();
    B.beginAttack(p);
    B.tickPlayer(p, 0.2, false);
    assert(p.stamina === 84);
    B.tickPlayer(p, 10, false);
    assert(p.stamina === 100);
  });
  test("Damage grants invulnerability and cannot take health below zero", () => {
    const p = player();
    assert(B.hurtPlayer(p, 30, false));
    assert(!B.hurtPlayer(p, 30, false));
    B.tickPlayer(p, 1, false);
    B.hurtPlayer(p, 200, false);
    assert(p.hp === 0);
  });
  test("Healing respects flask count and full health", () => {
    const p = player();
    assert(!B.heal(p) && p.flasks === 3);
    p.hp = 60;
    assert(B.heal(p) && p.hp === 100 && p.flasks === 2);
    p.hp = 20;
    p.flasks = 0;
    assert(!B.heal(p));
  });
  test("Assist reduces incoming damage and strengthens strikes", () => {
    const p = player(),
      e = B.createEnemy("grub", p.x + 30, p.y, 0);
    B.hurtPlayer(p, 20, true);
    assert(p.hp === 93);
    B.beginAttack(p);
    B.strike(p, e, true);
    assert(e.hp < e.maxHp - B.config.attackDamage);
  });
  test("The gate rejects entry without the key", () => {
    const s = B.createState();
    assert(!B.openGate(s));
    assert(!s.gateOpen);
  });
  test("The key is collectible once, only in range and in its room", () => {
    const s = B.createState();
    assert(!B.collectKey(s));
    B.enterRoom(s, 1, false);
    assert(!B.collectKey(s));
    Object.assign(s.player, B.rooms[1].key);
    assert(B.collectKey(s));
    assert(!B.collectKey(s));
    assert(B.openGate(s));
  });
  test("Room changes preserve health, key and flask state", () => {
    const s = B.createState();
    s.key = true;
    s.player.hp = 51;
    s.player.flasks = 1;
    B.enterRoom(s, 1, false);
    assert(s.key && s.player.hp === 51 && s.player.flasks === 1);
  });
  test("Doorways open on approach and close after leaving", () => {
    const s = B.createState();
    s.player.x = 850;
    s.player.y = 267;
    B.updateDoors(s, 0.1, false);
    assert(s.doors.right > 0 && s.doors.right < 1);
    B.updateDoors(s, 0.15, false);
    assert(s.doors.right === 1 && s.doors.left === 0);
    s.player.x = 600;
    B.updateDoors(s, 0.25, false);
    assert(s.doors.right === 0);
  });
  test("The bone gate stays shut until unlocked", () => {
    const s = B.createState();
    B.enterRoom(s, 1, false);
    s.player.x = 850;
    s.player.y = 267;
    B.updateDoors(s, 1, true);
    assert(s.doors.right === 0);
    s.key = true;
    B.openGate(s);
    B.updateDoors(s, 1, true);
    assert(s.doors.right === 1);
    s.player.y = 100;
    B.updateDoors(s, 1, true);
    assert(s.doors.right === 0);
  });
  test("Arrival opens the new room's door and respawn resets it", () => {
    const s = B.createState();
    B.enterRoom(s, 1, false);
    assert(s.doors.left === 1 && s.doors.right === 0);
    s.player.x = 300;
    B.updateDoors(s, 0.25, false);
    assert(s.doors.left === 0);
    B.enterRoom(s, 0, true);
    assert(s.doors.right === 1 && s.doors.left === 0);
    B.respawn(s);
    assert(s.doors.left === 0 && s.doors.right === 0);
  });
  test("Death returns to camp, restores resources and retains progression", () => {
    const s = B.createState();
    s.key = true;
    s.gateOpen = true;
    s.player.hp = 0;
    s.player.flasks = 0;
    B.enterRoom(s, 2, false);
    B.respawn(s);
    assert(
      s.room === 0 &&
        s.player.hp === 100 &&
        s.player.flasks === 3 &&
        s.player.stamina === 100,
    );
    assert(s.key && s.gateOpen && s.deaths === 1);
  });
  test("A fresh adventure resets key, gate, deaths and victory", () => {
    const s = B.createState();
    assert(!s.key && !s.gateOpen && !s.won && !s.deaths && s.room === 0);
  });
  test("Boss transitions at half health and telegraphs before damage", () => {
    const s = B.createState();
    B.enterRoom(s, 2, false);
    const e = s.enemies[0];
    s.player.x = e.x - 70;
    s.player.y = e.y;
    s.player.invulnerable = 0;
    e.hp = e.maxHp / 2;
    e.timer = 0;
    const fx = { notice() {}, hurt() {}, burst() {}, sound() {} };
    B.updateEnemy(e, s, 0.01, false, fx);
    assert(e.phase === 2 && e.state === "windup" && s.player.hp === 100);
    B.updateEnemy(e, s, 0.8, false, fx);
    assert(e.state === "recover" && s.player.hp === 72);
  });
  test("Moving outside a boss warning avoids damage", () => {
    const s = B.createState();
    B.enterRoom(s, 2, false);
    const e = s.enemies[0];
    e.state = "windup";
    e.timer = 0.1;
    s.player.x = 90;
    s.player.invulnerable = 0;
    B.updateEnemy(e, s, 0.2, false, {
      notice() {},
      hurt() {},
      burst() {},
      sound() {},
    });
    assert(s.player.hp === 100);
  });
  const list = document.getElementById("test-results");
  results.forEach((result) => {
    const li = document.createElement("li");
    li.className = result.pass ? "test-pass" : "test-fail";
    li.textContent =
      (result.pass ? "PASS: " : "FAIL: ") +
      result.name +
      (result.error ? ": " + result.error : "");
    list.appendChild(li);
  });
  document.getElementById("test-summary").textContent =
    `${results.filter((r) => r.pass).length} / ${results.length} checks passed`;
  window.BurrowTestResults = results;
})();
