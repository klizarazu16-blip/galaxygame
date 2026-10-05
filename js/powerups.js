/**
 * GALAXY STRIKE - POWER-UPS & COLLECTIBLES
 * Cápsulas de poder con animaciones holográficas, atracción magnética y mejoras de combate
 */

const POWERUP_TYPES = {
  SPREAD: {
    id: 'spread',
    name: 'MULTI-DISPARO',
    icon: '🔫',
    color: '#00f0ff',
    duration: 18 // segundos
  },
  SHIELD: {
    id: 'shield',
    name: 'ESCUDO DE PLASMA',
    icon: '🛡️',
    color: '#0088ff',
    duration: 15
  },
  SPEED: {
    id: 'speed',
    name: 'HIPER-VELOCIDAD',
    icon: '⚡',
    color: '#ffe600',
    duration: 12
  },
  BOMB: {
    id: 'bomb',
    name: 'BOMBA EMP',
    icon: '💣',
    color: '#ff3344',
    duration: 0 // instantáneo
  },
  LIFE: {
    id: 'life',
    name: 'REPARACIÓN / 1UP',
    icon: '❤️',
    color: '#ff0077',
    duration: 0 // instantáneo
  },
  MAGNET: {
    id: 'magnet',
    name: 'IMÁN DE CRISTALES',
    icon: '🧲',
    color: '#9d00ff',
    duration: 20
  }
};

class PowerupItem {
  constructor(x, y, typeId = null) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    
    // Si no se especifica tipo, elegir aleatoriamente con pesos
    if (!typeId) {
      const roll = Math.random();
      if (roll < 0.35) typeId = 'spread';
      else if (roll < 0.58) typeId = 'shield';
      else if (roll < 0.76) typeId = 'speed';
      else if (roll < 0.88) typeId = 'bomb';
      else if (roll < 0.95) typeId = 'magnet';
      else typeId = 'life';
    }

    this.type = POWERUP_TYPES[typeId.toUpperCase()] || POWERUP_TYPES.SPREAD;
    
    // Movimiento suave con oscilación
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 1.2 + Math.random() * 0.8;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.rot = 0;
    this.rotSpeed = 0.03;
    
    this.pulse = 0;
    this.dead = false;
    this.magnetized = false;
  }

  update(dt = 1, playerX = null, playerY = null, magnetRadius = 0) {
    this.bobPhase += 0.06 * dt;
    this.rot += this.rotSpeed * dt;
    this.pulse = Math.sin(this.bobPhase) * 3;

    // Atracción Magnética hacia la nave del jugador
    if (playerX !== null && playerY !== null && magnetRadius > 0) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius) {
        this.magnetized = true;
        const speed = 9 + (1 - dist / magnetRadius) * 8;
        this.vx += (dx / dist) * speed * 0.2 * dt;
        this.vy += (dy / dist) * speed * 0.2 * dt;
        this.vx *= 0.94;
        this.vy *= 0.94;
      }
    }

    if (!this.magnetized) {
      this.x += (this.vx + Math.sin(this.bobPhase) * 0.8) * dt;
      this.y += this.vy * dt;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // Salida de pantalla
    if (this.y > window.innerHeight + 50 || this.x < -50 || this.x > window.innerWidth + 50) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const r = this.radius + this.pulse;

    // Resplandor exterior
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
    glowGrad.addColorStop(0, this.type.color);
    glowGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Cápsula / Anillo exterior giratorio
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 12;

    // Hexágono tecnológico
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = Math.cos(angle) * r;
      const hy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Fondo del núcleo
    ctx.fillStyle = 'rgba(5, 10, 25, 0.85)';
    ctx.fill();

    // Ícono en el centro (sin rotación)
    ctx.rotate(-this.rot);
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, 0, 1);

    ctx.restore();
  }
}

class PowerupManager {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items = [];
  }

  spawn(x, y, typeId = null) {
    this.items.push(new PowerupItem(x, y, typeId));
  }

  update(dt, player) {
    const magnetActive = player.activeEffects.magnet > 0;
    const magnetRadius = magnetActive ? 320 : (player.baseMagnetRadius || 70);

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(dt, player.x, player.y, magnetRadius);

      // Chequear colisión con el jugador
      const dist = Math.hypot(player.x - item.x, player.y - item.y);
      if (dist < player.radius + item.radius + 6) {
        player.collectPowerup(item.type);
        Particles.createExplosion(item.x, item.y, 18, {
          colors: [item.type.color, '#ffffff', '#ffe600'],
          maxSpeed: 6,
          shockColor: item.type.color
        });
        Particles.addFloatingText(`+${item.type.name}!`, item.x, item.y - 10, item.type.color, 15);
        Sound.playPowerupCollect();
        this.items.splice(i, 1);
        continue;
      }

      if (item.dead) {
        this.items.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const item of this.items) {
      item.draw(ctx);
    }
  }
}

// Instancia global
const Powerups = new PowerupManager();
