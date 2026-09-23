(function () {
  "use strict";
  const B = window.Burrow,
    C = B.config;
  B.beginAttack = function (p) {
    if (p.cooldown > 0 || p.dodge > 0 || p.stamina < C.attackCost) return false;
    p.stamina -= C.attackCost;
    p.regenDelay = 0.65;
    p.attack = C.attackDuration;
    p.cooldown = C.attackCooldown;
    p.hits.clear();
    return true;
  };
  B.beginDodge = function (p, dx, dy) {
    if (p.dodge > 0 || p.attack > 0 || p.stamina < C.dodgeCost) return false;
    p.stamina -= C.dodgeCost;
    p.regenDelay = 0.75;
    p.dodge = C.dodgeDuration;
    const length = Math.hypot(dx, dy);
    p.dodgeX = length ? dx / length : p.facingX;
    p.dodgeY = length ? dy / length : p.facingY;
    p.invulnerable = Math.max(p.invulnerable, C.dodgeDuration);
    return true;
  };
  B.tickPlayer = function (p, dt, assist) {
    for (const key of [
      "cooldown",
      "attack",
      "dodge",
      "invulnerable",
      "regenDelay",
    ])
      p[key] = Math.max(0, p[key] - dt);
    if (p.regenDelay <= 0)
      p.stamina = Math.min(100, p.stamina + C.regen * dt * (assist ? 1.65 : 1));
  };
  B.canStrike = function (p, enemy) {
    const dx = enemy.x - p.x,
      dy = enemy.y - p.y,
      distance = Math.hypot(dx, dy);
    return (
      p.attack > 0 &&
      enemy.hp > 0 &&
      !p.hits.has(enemy.id) &&
      distance <= C.attackReach + enemy.radius &&
      (distance < 22 || (dx * p.facingX + dy * p.facingY) / distance > 0.05)
    );
  };
  B.strike = function (p, enemy, assist) {
    if (!B.canStrike(p, enemy)) return false;
    p.hits.add(enemy.id);
    enemy.hp = Math.max(0, enemy.hp - C.attackDamage * (assist ? 1.7 : 1));
    enemy.flash = 0.13;
    return true;
  };
  B.hurtPlayer = function (p, damage, assist) {
    if (p.invulnerable > 0 || p.hp <= 0) return false;
    p.hp = Math.max(0, p.hp - damage * (assist ? 0.35 : 1));
    p.invulnerable = 0.85;
    return true;
  };
  B.heal = function (p) {
    if (!p.flasks || p.hp <= 0 || p.hp >= 100) return false;
    p.flasks--;
    p.hp = Math.min(100, p.hp + 55);
    return true;
  };
  B.updateEnemy = function (enemy, state, dt, assist, effects) {
    if (enemy.hp <= 0) return;
    enemy.age += dt;
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.timer -= dt;
    const p = state.player,
      room = B.rooms[state.room],
      boss = enemy.type === "boss";
    if (boss && enemy.phase === 1 && enemy.hp <= enemy.maxHp / 2) {
      enemy.phase = 2;
      effects.notice("The Devourer awakens. Watch for the wider strike.");
    }
    if (enemy.state === "windup") {
      if (enemy.timer <= 0) {
        if (enemy.type === "spider") {
          const dx = enemy.attackX - enemy.x,
            dy = enemy.attackY - enemy.y,
            d = Math.hypot(dx, dy) || 1;
          B.move(
            enemy,
            (dx / d) * Math.min(d, 92),
            (dy / d) * Math.min(d, 92),
            room,
          );
        }
        const radius = boss
          ? enemy.phase === 2
            ? 116
            : 88
          : enemy.type === "spider"
            ? 40
            : 43;
        if (
          B.distance(enemy, p) < radius + p.radius &&
          B.hurtPlayer(p, boss ? 28 : 16, assist)
        )
          effects.hurt();
        effects.burst(
          enemy.x,
          enemy.y,
          boss ? "#dc807c" : "#baa46d",
          boss ? 22 : 8,
        );
        enemy.state = "recover";
        enemy.timer = boss ? (enemy.phase === 2 ? 0.7 : 1.05) : 0.9;
        effects.sound("slam");
      }
      return;
    }
    if (enemy.state === "recover") {
      if (enemy.timer <= 0) {
        enemy.state = "idle";
        enemy.timer = 0.2;
      }
      return;
    }
    const distance = B.distance(enemy, p),
      range = boss ? 145 : enemy.type === "spider" ? 116 : 51;
    if (distance < range && enemy.timer <= 0) {
      enemy.state = "windup";
      enemy.timer = boss
        ? enemy.phase === 2
          ? 0.78
          : 1.0
        : enemy.type === "spider"
          ? 0.8
          : 0.65;
      enemy.attackX = p.x;
      enemy.attackY = p.y;
      return;
    }
    if (distance < (boss ? 900 : 245) && distance > (boss ? 63 : 28)) {
      const speed = boss
        ? enemy.phase === 2
          ? 91
          : 66
        : enemy.type === "spider"
          ? 88
          : 51;
      B.move(
        enemy,
        ((p.x - enemy.x) / distance) * speed * dt,
        ((p.y - enemy.y) / distance) * speed * dt,
        room,
      );
    }
  };
})();
