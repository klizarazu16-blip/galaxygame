/**
 * GALAXY STRIKE - PLAYER SHIP & WEAPONS ENGINE
 * Nave de combate interestelar con física de inercia, ladeo dinámico,
 * árbol de armas progresivo, escudos de plasma y proyectiles teledirigidos.
 */

class Bullet {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = options.radius || 4;
    this.damage = options.damage || 1;
    this.color = options.color || '#00f0ff';
    this.isMissile = options.isMissile || false;
    this.isPlasma = options.isPlasma || false;
    this.target = options.target || null;
    this.life = options.life || 180;
    this.dead = false;
  }

  update(dt = 1, enemies = []) {
    // Si es misil teledirigido, busca y rota hacia el enemigo más cercano
    if (this.isMissile) {
      if (!this.target || this.target.dead) {
        // Encontrar nuevo objetivo
        let closestDist = 800;
        let bestTarget = null;
        for (const e of enemies) {
          if (e.y < this.y) {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < closestDist) {
              closestDist = d;
              bestTarget = e;
            }
          }
        }
        this.target = bestTarget;
      }

      if (this.target) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const angle = Math.atan2(dy, dx);
        const speed = 14;
        this.vx += (Math.cos(angle) * speed - this.vx) * 0.12 * dt;
        this.vy += (Math.sin(angle) * speed - this.vy) * 0.12 * dt;
      }

      // Estela de humo del misil
      if (Math.random() > 0.3) {
        Particles.particles.push({
          x: this.x,
          y: this.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2 + Math.random() * 2,
          size: 2.5,
          color: '#ffe600',
          alpha: 0.8,
          decay: 0.06,
          shape: 'circle'
        });
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.life <= 0 || this.y < -50 || this.y > window.innerHeight + 50 || this.x < -50 || this.x > window.innerWidth + 50) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isPlasma ? 14 : 8;

    if (this.isPlasma) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isMissile) {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
      ctx.fillRect(-2, -6, 4, 12);
    } else {
      // Láser alargado
      ctx.beginPath();
      ctx.roundRect 
        ? ctx.roundRect(this.x - this.radius, this.y - this.radius * 2.5, this.radius * 2, this.radius * 5, 3)
        : ctx.fillRect(this.x - this.radius, this.y - this.radius * 2.5, this.radius * 2, this.radius * 5);
      ctx.fill();

      // Centro blanco brillante
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x - this.radius * 0.5, this.y - this.radius * 2, this.radius, this.radius * 4);
    }

    ctx.restore();
  }
}

class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.shipImage = new Image();
    this.shipImage.src = 'imagenes/astronave.png';

    this.reset();
  }

  reset() {
    this.x = this.canvasWidth / 2;
    this.y = this.canvasHeight - 120;
    this.targetX = this.x;
    this.targetY = this.y;

    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 9.2;
    this.accel = 1.85;
    this.friction = 0.86;
    this.tilt = 0; // Ángulo de ladeo en giros (-0.35 a 0.35 rad)

    this.radius = 22;
    this.lives = 3;
    this.maxShield = 100;
    this.shield = 100;
    this.bombs = 2;
    this.maxBombs = 4;

    this.weaponTier = 1; // 1 = Single, 2 = Twin, 3 = Spread, 4 = Quad Plasma, 5 = Mega Spread + Missiles
    this.maxWeaponTier = 5;

    this.fireCooldown = 0;
    this.baseFireRate = 12; // Frames entre disparos (~5 disparos/seg)
    this.missileCooldown = 0;

    this.invulnerableTimer = 0; // Frames de invulnerabilidad
    this.shieldHitEffect = 0;

    this.baseMagnetRadius = 80;

    // Power-ups activos con contador en segundos
    this.activeEffects = {
      spread: 0,
      shield: 0,
      speed: 0,
      magnet: 0
    };

    this.bullets = [];
    this.stats = {
      shotsFired: 0,
      shotsHit: 0,
      kills: 0,
      score: 0,
      combo: 1,
      comboTimer: 0,
      maxCombo: 1
    };
  }

  resize(w, h) {
    this.canvasWidth = w;
    this.canvasHeight = h;
    this.x = Math.max(30, Math.min(w - 30, this.x));
    this.y = Math.max(30, Math.min(h - 30, this.y));
  }

  collectPowerup(type) {
    switch (type.id) {
      case 'spread':
        this.weaponTier = Math.min(this.maxWeaponTier, this.weaponTier + 1);
        this.activeEffects.spread = type.duration;
        break;
      case 'shield':
        this.activeEffects.shield = type.duration;
        this.shield = this.maxShield;
        break;
      case 'speed':
        this.activeEffects.speed = type.duration;
        break;
      case 'magnet':
        this.activeEffects.magnet = type.duration;
        break;
      case 'bomb':
        this.bombs = Math.min(this.maxBombs, this.bombs + 1);
        break;
      case 'life':
        if (this.shield < this.maxShield) {
          this.shield = Math.min(this.maxShield, this.shield + 50);
        } else {
          this.lives = Math.min(5, this.lives + 1);
        }
        break;
    }
  }

  triggerBomb(enemies = [], enemyBullets = []) {
    if (this.bombs <= 0) return false;
    this.bombs--;

    Sound.playBombEMP();
    Particles.shake(25);
    Particles.addShockwave(this.x, this.y, Math.max(this.canvasWidth, this.canvasHeight) * 0.9, '#ff3344', 0.8);
    Particles.addFloatingText('💥 ¡BOMBA EMP DETONADA!', this.x, this.y - 40, '#ff3344', 22);

    // Destruir todos los proyectiles enemigos
    enemyBullets.length = 0;

    // Dañar masivamente o eliminar a todos los enemigos en pantalla
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (enemy.isBoss) {
        enemy.takeDamage(250);
      } else {
        enemy.takeDamage(100);
      }
    }
    return true;
  }

  takeDamage(amount = 25) {
    if (this.invulnerableTimer > 0) return false;

    // Si tiene escudo de plasma activo por powerup
    if (this.activeEffects.shield > 0) {
      this.shieldHitEffect = 1.0;
      Sound.playShieldHit();
      Particles.createSparks(this.x, this.y, 14, '#0088ff');
      return false;
    }

    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - amount);
      this.shieldHitEffect = 1.0;
      Sound.playShieldHit();
      Particles.createSparks(this.x, this.y, 12, '#00f0ff');
      Particles.shake(8);

      if (this.shield === 0) {
        // Degradar arma un nivel al perder el escudo
        if (this.weaponTier > 1) this.weaponTier--;
      }
      return false;
    }

    // Pérdida de vida
    this.lives--;
    Sound.playPlayerHit();
    Particles.shake(18);
    Particles.createExplosion(this.x, this.y, 30, {
      colors: ['#ff0077', '#ff3344', '#ffe600', '#ffffff'],
      maxSpeed: 9
    });

    if (this.lives > 0) {
      this.shield = this.maxShield;
      this.weaponTier = Math.max(1, this.weaponTier - 1);
      this.invulnerableTimer = 150; // ~2.5 segundos de invulnerabilidad
    }

    return this.lives <= 0; // True si muere totalmente
  }

  fire(enemies = []) {
    if (this.fireCooldown > 0) return;

    const isSpeed = this.activeEffects.speed > 0;
    const cooldown = isSpeed ? Math.floor(this.baseFireRate * 0.6) : this.baseFireRate;
    this.fireCooldown = cooldown;

    const tier = this.weaponTier;
    Sound.playLaser(tier);
    this.stats.shotsFired++;

    const bulletSpeed = isSpeed ? 18 : 15;

    switch (tier) {
      case 1:
        // Disparo central único
        this.bullets.push(new Bullet(this.x, this.y - 20, 0, -bulletSpeed, { damage: 1, color: '#00f0ff' }));
        Particles.addMuzzleFlash(this.x, this.y - 22, 10, '#00f0ff');
        break;

      case 2:
        // Doble láser
        this.bullets.push(new Bullet(this.x - 12, this.y - 12, 0, -bulletSpeed, { damage: 1, color: '#00f0ff' }));
        this.bullets.push(new Bullet(this.x + 12, this.y - 12, 0, -bulletSpeed, { damage: 1, color: '#00f0ff' }));
        Particles.addMuzzleFlash(this.x - 12, this.y - 14, 9, '#00f0ff');
        Particles.addMuzzleFlash(this.x + 12, this.y - 14, 9, '#00f0ff');
        break;

      case 3:
        // Triple láser en abanico
        this.bullets.push(new Bullet(this.x, this.y - 20, 0, -bulletSpeed, { damage: 1.2, color: '#ffe600' }));
        this.bullets.push(new Bullet(this.x - 14, this.y - 10, -2.5, -bulletSpeed * 0.95, { damage: 1, color: '#ffe600' }));
        this.bullets.push(new Bullet(this.x + 14, this.y - 10, 2.5, -bulletSpeed * 0.95, { damage: 1, color: '#ffe600' }));
        Particles.addMuzzleFlash(this.x, this.y - 22, 12, '#ffe600');
        Particles.addMuzzleFlash(this.x - 14, this.y - 12, 9, '#ffe600');
        Particles.addMuzzleFlash(this.x + 14, this.y - 12, 9, '#ffe600');
        break;

      case 4:
        // Cuádruple cañón de plasma
        this.bullets.push(new Bullet(this.x - 16, this.y - 14, -1, -bulletSpeed, { damage: 1.8, isPlasma: true, radius: 6, color: '#ff0077' }));
        this.bullets.push(new Bullet(this.x - 6, this.y - 20, 0, -bulletSpeed, { damage: 1.8, isPlasma: true, radius: 6, color: '#00f0ff' }));
        this.bullets.push(new Bullet(this.x + 6, this.y - 20, 0, -bulletSpeed, { damage: 1.8, isPlasma: true, radius: 6, color: '#00f0ff' }));
        this.bullets.push(new Bullet(this.x + 16, this.y - 14, 1, -bulletSpeed, { damage: 1.8, isPlasma: true, radius: 6, color: '#ff0077' }));
        Particles.addMuzzleFlash(this.x, this.y - 20, 16, '#00f0ff');
        break;

      case 5:
      default:
        // Mega Spread + Cañón pesado
        this.bullets.push(new Bullet(this.x, this.y - 24, 0, -bulletSpeed * 1.1, { damage: 3, isPlasma: true, radius: 8, color: '#00ff88' }));
        this.bullets.push(new Bullet(this.x - 14, this.y - 14, -2.8, -bulletSpeed, { damage: 1.5, color: '#00f0ff' }));
        this.bullets.push(new Bullet(this.x + 14, this.y - 14, 2.8, -bulletSpeed, { damage: 1.5, color: '#00f0ff' }));
        this.bullets.push(new Bullet(this.x - 22, this.y - 8, -5.2, -bulletSpeed * 0.9, { damage: 1.2, color: '#ffe600' }));
        this.bullets.push(new Bullet(this.x + 22, this.y - 8, 5.2, -bulletSpeed * 0.9, { damage: 1.2, color: '#ffe600' }));
        Particles.addMuzzleFlash(this.x, this.y - 24, 18, '#00ff88');
        break;
    }

    // Disparo de micro-misiles si el arma está en nivel 5 o más
    if (tier >= 5 && this.missileCooldown <= 0) {
      this.missileCooldown = 28;
      Sound.playMissileLaunch();
      this.bullets.push(new Bullet(this.x - 24, this.y, -4, -3, { isMissile: true, damage: 3.5, color: '#ff3344' }));
      this.bullets.push(new Bullet(this.x + 24, this.y, 4, -3, { isMissile: true, damage: 3.5, color: '#ff3344' }));
    }
  }

  update(dt, input, enemies = []) {
    // 1. Manejo de temporizadores de Power-ups
    for (const key in this.activeEffects) {
      if (this.activeEffects[key] > 0) {
        this.activeEffects[key] = Math.max(0, this.activeEffects[key] - (dt / 60));
        if (this.activeEffects[key] === 0 && key === 'spread') {
          // Restaurar nivel base de arma al expirar
          this.weaponTier = 1;
        }
      }
    }

    // 2. Cooldowns
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.missileCooldown > 0) this.missileCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.shieldHitEffect > 0) this.shieldHitEffect -= 0.05 * dt;

    // 3. Temporizador de Combo
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.combo = 1;
      }
    }

    // 4. Movimiento del Jugador (Física / Inercia de Combate)
    const isSpeed = this.activeEffects.speed > 0;
    const currentMaxSpeed = isSpeed ? 13.0 : 9.8;
    const currentAccel = isSpeed ? 3.0 : 2.4;

    let keyMoved = false;
    if (input.up) {
      this.vy -= currentAccel * dt;
      keyMoved = true;
    }
    if (input.down) {
      this.vy += currentAccel * dt;
      keyMoved = true;
    }
    if (input.left) {
      this.vx -= currentAccel * dt;
      keyMoved = true;
    }
    if (input.right) {
      this.vx += currentAccel * dt;
      keyMoved = true;
    }

    if (keyMoved) {
      input.isMouseControl = false;
    } else if (input.isMouseControl && input.controlMode !== 'keyboard') {
      // Seguimiento cuando se usa modo ratón o touch
      const dx = input.mouseX - this.x;
      const dy = input.mouseY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        this.vx += (dx * 0.18);
        this.vy += (dy * 0.18);
      }
    }

    // Fricción
    this.vx *= Math.pow(this.friction, dt);
    this.vy *= Math.pow(this.friction, dt);

    // Limitar velocidad máxima
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > currentMaxSpeed) {
      this.vx = (this.vx / speed) * currentMaxSpeed;
      this.vy = (this.vy / speed) * currentMaxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ladeo dinámico en giros (banking)
    const targetTilt = (this.vx / currentMaxSpeed) * 0.35;
    this.tilt += (targetTilt - this.tilt) * 0.15 * dt;

    // Limitar dentro de la pantalla
    const margin = 26;
    if (this.x < margin) { this.x = margin; this.vx = 0; }
    if (this.x > this.canvasWidth - margin) { this.x = this.canvasWidth - margin; this.vx = 0; }
    if (this.y < margin) { this.y = margin; this.vy = 0; }
    if (this.y > this.canvasHeight - margin) { this.y = this.canvasHeight - margin; this.vy = 0; }

    // Generar partículas de propulsor
    Particles.addThrusterParticle(this.x - 8, this.y + 20, isSpeed);
    Particles.addThrusterParticle(this.x + 8, this.y + 20, isSpeed);

    // Disparo
    if (input.fire || input.autofire) {
      this.fire(enemies);
    }

    // 5. Actualizar proyectiles
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, enemies);
      if (b.dead) {
        this.bullets.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Parpadeo cuando está invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    // 1. Escudo de Plasma activo o efecto de impacto
    const hasActiveShield = this.activeEffects.shield > 0;
    if (hasActiveShield || this.shieldHitEffect > 0) {
      ctx.save();
      const shieldRadius = this.radius + 14;
      const shieldAlpha = hasActiveShield ? 0.45 + Math.sin(Date.now() * 0.008) * 0.15 : this.shieldHitEffect * 0.6;
      const shieldColor = hasActiveShield ? '#0088ff' : '#00f0ff';

      const grad = ctx.createRadialGradient(0, 0, shieldRadius * 0.5, 0, 0, shieldRadius);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      grad.addColorStop(0.8, shieldColor);
      grad.addColorStop(1, '#ffffff');

      ctx.fillStyle = grad;
      ctx.globalAlpha = shieldAlpha;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Halo de Hiper-Velocidad si está activo
    if (this.activeEffects.speed > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Dibujo de la Nave de Combate (Sprite astronave.png con efectos de Neón)
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;

    if (this.shipImage && this.shipImage.complete && this.shipImage.naturalWidth > 0) {
      const shipSize = 52;
      ctx.drawImage(this.shipImage, -shipSize / 2, -shipSize / 2, shipSize, shipSize);
    } else {
      // Dibujo Vectorial de Respaldo
      ctx.fillStyle = '#0e1e38';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -26); // Punta
      ctx.lineTo(26, 16);  // Ala derecha
      ctx.lineTo(16, 22);  // Alerón trasero derecho
      ctx.lineTo(8, 16);   // Motor derecho
      ctx.lineTo(0, 20);   // Centro popa
      ctx.lineTo(-8, 16);  // Motor izquierdo
      ctx.lineTo(-16, 22); // Alerón trasero izquierdo
      ctx.lineTo(-26, 16); // Ala izquierda
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fuselaje central
      ctx.fillStyle = '#172b4d';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(10, 8);
      ctx.lineTo(0, 14);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      // Cañones en las alas
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-18, -2, 3, 14);
      ctx.fillRect(15, -2, 3, 14);

      // Cabina del Piloto (Cockpit de Neón)
      const cockpitGrad = ctx.createLinearGradient(0, -18, 0, 2);
      cockpitGrad.addColorStop(0, '#00ffff');
      cockpitGrad.addColorStop(0.6, '#0088ff');
      cockpitGrad.addColorStop(1, '#ff0077');

      ctx.fillStyle = cockpitGrad;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, -4, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Dibujar todas las balas del jugador
    for (const b of this.bullets) {
      b.draw(ctx);
    }
  }
}
