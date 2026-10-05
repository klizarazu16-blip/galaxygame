/**
 * GALAXY STRIKE - ENEMY FLEET & BOSS SYSTEM
 * Drones exploradores, cazas interceptores, cruceros blindados,
 * kamikazes, meteoritos destructibles y jefes colosales por fases.
 */

class EnemyBullet {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = options.radius || 4;
    this.color = options.color || '#ff3344';
    this.damage = options.damage || 20;
    this.dead = false;
  }

  update(dt = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y > window.innerHeight + 40 || this.y < -40 || this.x < -40 || this.x > window.innerWidth + 40) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Clase Base Enemiga
class BaseEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 2;
    this.radius = 18;
    this.hp = 1;
    this.maxHp = 1;
    this.scoreValue = 100;
    this.color = '#ff3344';
    this.dead = false;
    this.isBoss = false;
    this.hitFlicker = 0;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.hitFlicker = 1.0;
    Particles.createSparks(this.x, this.y, 6, this.color);

    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.dead = true;
    Sound.playExplosion(this.isBoss ? 'boss' : (this.maxHp > 5 ? 'medium' : 'small'));
    Particles.createExplosion(this.x, this.y, this.isBoss ? 80 : 25, {
      colors: [this.color, '#ff5500', '#ffe600', '#ffffff'],
      maxSpeed: this.isBoss ? 14 : 7,
      shockColor: this.color
    });

    // Probabilidad de soltar Power-up
    const dropChance = this.isBoss ? 1.0 : (this.maxHp > 3 ? 0.35 : 0.12);
    if (Math.random() < dropChance) {
      Powerups.spawn(this.x, this.y);
    }
  }

  update(dt, player, enemyBullets) {
    if (this.hitFlicker > 0) this.hitFlicker -= 0.1 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y > window.innerHeight + 80) {
      this.dead = true;
    }
  }

  draw(ctx) {
    // Implementado en subclases
  }
}

// 1. DRON EXPLORADOR (SCOUT) - Rápido, curvas en picada
class ScoutEnemy extends BaseEnemy {
  constructor(x, y, startAngle = 0) {
    super(x, y);
    this.radius = 16;
    this.hp = 1.5;
    this.maxHp = 1.5;
    this.scoreValue = 150;
    this.color = '#ff0077';
    this.angle = startAngle;
    this.curveSpeed = 0.04;
    this.fireTimer = Math.random() * 60 + 40;
  }

  update(dt, player, enemyBullets) {
    super.update(dt, player, enemyBullets);
    this.angle += this.curveSpeed * dt;
    this.vx = Math.cos(this.angle) * 3.5;
    this.vy = 2.8;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && this.y > 40 && this.y < window.innerHeight * 0.6) {
      this.fireTimer = 100 + Math.random() * 80;
      Sound.playEnemyLaser();
      enemyBullets.push(new EnemyBullet(this.x, this.y + 10, 0, 5, { color: this.color }));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI); // Mirando hacia abajo

    if (this.hitFlicker > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#22081a';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Núcleo
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// 2. CAZA FURTIVO (INTERCEPTOR) - Zig-zag y apunta al jugador
class InterceptorEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y);
    this.radius = 20;
    this.hp = 3.5;
    this.maxHp = 3.5;
    this.scoreValue = 300;
    this.color = '#00f0ff';
    this.phase = Math.random() * Math.PI * 2;
    this.fireTimer = 50 + Math.random() * 40;
  }

  update(dt, player, enemyBullets) {
    super.update(dt, player, enemyBullets);
    this.phase += 0.05 * dt;
    this.vx = Math.sin(this.phase) * 4.2;
    this.vy = 2.0;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && this.y > 50 && this.y < window.innerHeight * 0.7) {
      this.fireTimer = 85 + Math.random() * 50;
      Sound.playEnemyLaser();

      // Disparo apuntado hacia el jugador
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const angle = Math.atan2(dy, dx);
      const bulletSpeed = 6;
      enemyBullets.push(new EnemyBullet(this.x, this.y + 12, Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed, { color: this.color }));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI);

    if (this.hitFlicker > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#061c2b';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(20, 8);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(-12, 16);
    ctx.lineTo(-20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// 3. CRUCERO PESADO (CRUISER) - Blindado, ráfagas triples
class CruiserEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y);
    this.radius = 32;
    this.hp = 12;
    this.maxHp = 12;
    this.scoreValue = 650;
    this.color = '#9d00ff';
    this.vy = 1.1;
    this.fireTimer = 40;
  }

  update(dt, player, enemyBullets) {
    super.update(dt, player, enemyBullets);
    this.fireTimer -= dt;

    if (this.fireTimer <= 0 && this.y > 60 && this.y < window.innerHeight * 0.65) {
      this.fireTimer = 90;
      Sound.playEnemyLaser();

      // Ráfaga en 3 direcciones
      enemyBullets.push(new EnemyBullet(this.x - 14, this.y + 20, -1.8, 5, { color: this.color }));
      enemyBullets.push(new EnemyBullet(this.x, this.y + 24, 0, 5.5, { color: '#ffffff', radius: 5 }));
      enemyBullets.push(new EnemyBullet(this.x + 14, this.y + 20, 1.8, 5, { color: this.color }));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI);

    if (this.hitFlicker > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#1b092b';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
    }

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(28, 0);
    ctx.lineTo(34, 26);
    ctx.lineTo(0, 16);
    ctx.lineTo(-34, 26);
    ctx.lineTo(-28, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Barra de vida superior en cruceros
    ctx.rotate(-Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-20, -42, 40, 5);
    ctx.fillStyle = this.color;
    ctx.fillRect(-20, -42, 40 * (this.hp / this.maxHp), 5);

    ctx.restore();
  }
}

// 4. KAMIKAZE (BOMBARDERO EN PICADA)
class KamikazeEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y);
    this.radius = 15;
    this.hp = 1.2;
    this.maxHp = 1.2;
    this.scoreValue = 200;
    this.color = '#ff3300';
    this.lockedOn = false;
    this.targetAngle = 0;
  }

  update(dt, player, enemyBullets) {
    super.update(dt, player, enemyBullets);

    if (!this.lockedOn && this.y > 80) {
      this.lockedOn = true;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      this.targetAngle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.targetAngle) * 6.5;
      this.vy = Math.sin(this.targetAngle) * 6.5;
    }

    if (!this.lockedOn) {
      this.vy = 3.5;
    }

    // Estela de fuego
    if (Math.random() > 0.4) {
      Particles.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 2,
        vy: -2,
        size: 3,
        color: '#ff5500',
        alpha: 0.8,
        decay: 0.08,
        shape: 'spark'
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.lockedOn ? this.targetAngle - Math.PI / 2 : Math.PI);

    if (this.hitFlicker > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#300800';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// 5. METEORITO / ASTEROIDE ESPACIAL
class Asteroid extends BaseEnemy {
  constructor(x, y, sizeTier = 3) {
    super(x, y);
    this.sizeTier = sizeTier; // 3 = Grande, 2 = Mediano, 1 = Pequeño
    this.radius = sizeTier === 3 ? 36 : (sizeTier === 2 ? 22 : 13);
    this.hp = sizeTier === 3 ? 8 : (sizeTier === 2 ? 3 : 1);
    this.maxHp = this.hp;
    this.scoreValue = sizeTier * 80;
    this.color = '#7d8590';
    this.rot = 0;
    this.rotSpeed = (Math.random() - 0.5) * 0.04;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 1.0 + (4 - sizeTier) * 0.7;

    // Puntos poligonales irregulares
    this.vertices = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * Math.PI * 2) / numPoints;
      const r = this.radius * (0.8 + Math.random() * 0.4);
      this.vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
  }

  destroy() {
    super.destroy();

    // Si es grande o mediano, se divide en 2 fragmentos menores
    if (this.sizeTier > 1) {
      for (let i = 0; i < 2; i++) {
        const sub = new Asteroid(this.x + (i === 0 ? -12 : 12), this.y, this.sizeTier - 1);
        sub.vx = (i === 0 ? -2 : 2) + (Math.random() - 0.5);
        sub.vy = this.vy + 0.5;
        Enemies.enemies.push(sub);
      }
    }
  }

  update(dt, player, enemyBullets) {
    super.update(dt, player, enemyBullets);
    this.rot += this.rotSpeed * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    ctx.fillStyle = this.hitFlicker > 0 ? '#ffffff' : '#1a2233';
    ctx.strokeStyle = '#3e4f6d';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// 6. JEFE COLOSAL: NAVE NODRIZA KRONOS
class BossMothership extends BaseEnemy {
  constructor(x, y, level = 1) {
    super(x, y);
    this.radius = 70;
    this.isBoss = true;
    this.level = level;
    this.maxHp = 180 + level * 120;
    this.hp = this.maxHp;
    this.scoreValue = 8000 * level;
    this.color = '#ff0055';

    this.entryTargetY = 130;
    this.vy = 2.5;
    this.phase = 1; // 1 = Escudo + Ráfagas, 2 = Bullet Hell Spiral, 3 = Enraged
    this.attackTimer = 60;
    this.spiralAngle = 0;
    this.hoverPhase = 0;

    // Sonido y Alerta
    Sound.playBossAlert();
    Sound.setMusicIntensity(2); // Música acelerada para Boss
  }

  update(dt, player, enemyBullets) {
    if (this.hitFlicker > 0) this.hitFlicker -= 0.1 * dt;

    // 1. Entrada a escena
    if (this.y < this.entryTargetY) {
      this.y += this.vy * dt;
      return;
    }

    // 2. Movimiento oscilante
    this.hoverPhase += 0.02 * dt;
    this.x = (window.innerWidth / 2) + Math.sin(this.hoverPhase) * (window.innerWidth * 0.32);
    this.y = this.entryTargetY + Math.cos(this.hoverPhase * 1.5) * 25;

    // 3. Fases de ataque
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio < 0.35) this.phase = 3;
    else if (hpRatio < 0.7) this.phase = 2;

    this.attackTimer -= dt;

    if (this.attackTimer <= 0) {
      if (this.phase === 1) {
        // Disparos dobles cruzados
        this.attackTimer = 45;
        Sound.playEnemyLaser();
        for (let i = -2; i <= 2; i++) {
          enemyBullets.push(new EnemyBullet(this.x + i * 25, this.y + 40, i * 1.2, 5.5, { color: '#ff3344', radius: 5 }));
        }
      } else if (this.phase === 2) {
        // Espiral de balas (Bullet Hell)
        this.attackTimer = 18;
        Sound.playEnemyLaser();
        this.spiralAngle += 0.45;
        const speed = 4.8;
        enemyBullets.push(new EnemyBullet(this.x, this.y + 30, Math.cos(this.spiralAngle) * speed, Math.sin(this.spiralAngle) * speed, { color: '#9d00ff', radius: 5 }));
        enemyBullets.push(new EnemyBullet(this.x, this.y + 30, Math.cos(this.spiralAngle + Math.PI) * speed, Math.sin(this.spiralAngle + Math.PI) * speed, { color: '#9d00ff', radius: 5 }));
      } else {
        // Modo Enraged: Ráfagas masivas teledirigidas
        this.attackTimer = 25;
        Sound.playEnemyLaser();
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const a = angle + (i * 0.18);
          enemyBullets.push(new EnemyBullet(this.x, this.y + 35, Math.cos(a) * 6.5, Math.sin(a) * 6.5, { color: '#ff0055', radius: 6, damage: 30 }));
        }
      }
    }
  }

  destroy() {
    super.destroy();
    Sound.setMusicIntensity(1); // Restaurar música normal
    Particles.shake(30);
    Particles.addShockwave(this.x, this.y, 250, '#ff0055', 1.2);
    Particles.addFloatingText('👑 ¡JEFE DESTRUIDO!', this.x, this.y - 20, '#ffe600', 26);

    // Múltiples Powerups garantizados
    for (let i = -1; i <= 1; i++) {
      Powerups.spawn(this.x + i * 40, this.y + 10);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlicker > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#1a0515';
      ctx.strokeStyle = this.phase === 3 ? '#ff0033' : this.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = this.phase === 3 ? '#ff0033' : this.color;
      ctx.shadowBlur = 20;
    }

    // Casco Colosal de la Nave Nodriza
    ctx.beginPath();
    ctx.moveTo(0, 60);     // Proa inferior
    ctx.lineTo(65, 20);    // Ala frontal der
    ctx.lineTo(80, -35);   // Ala trasera der
    ctx.lineTo(30, -50);   // Popa der
    ctx.lineTo(0, -40);    // Popa centro
    ctx.lineTo(-30, -50);  // Popa izq
    ctx.lineTo(-80, -35);  // Ala trasera izq
    ctx.lineTo(-65, 20);   // Ala frontal izq
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Núcleo central pulsante
    const coreColor = this.phase === 3 ? '#ff0033' : (this.phase === 2 ? '#9d00ff' : '#00f0ff');
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Gestor de Enemigos
class EnemyManager {
  constructor() {
    this.enemies = [];
    this.enemyBullets = [];
  }

  reset() {
    this.enemies = [];
    this.enemyBullets = [];
  }

  update(dt, player) {
    // 1. Actualizar proyectiles enemigos
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.update(dt);

      // Chequear colisión con el jugador
      const dist = Math.hypot(player.x - b.x, player.y - b.y);
      if (dist < player.radius + b.radius) {
        player.takeDamage(b.damage);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.dead) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 2. Actualizar enemigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.enemyBullets);

      // Colisión directa entre el enemigo y la nave del jugador
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < player.radius + e.radius) {
        player.takeDamage(35);
        if (!e.isBoss) {
          e.destroy();
        }
      }

      if (e.dead) {
        this.enemies.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Dibujar enemigos
    for (const e of this.enemies) {
      e.draw(ctx);
    }
    // Dibujar proyectiles enemigos
    for (const b of this.enemyBullets) {
      b.draw(ctx);
    }
  }
}

// Instancia global
const Enemies = new EnemyManager();
