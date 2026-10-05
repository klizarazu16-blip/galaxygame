/**
 * GALAXY STRIKE - PARTICLE & FX SYSTEM
 * Motor de partículas de alto rendimiento, destellos de cañones, ondas expansivas,
 * textos flotantes y vibración de cámara (Screen Shake).
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.muzzleFlashes = [];
    this.shockwaves = [];

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeEnabled = true;
  }

  reset() {
    this.particles = [];
    this.texts = [];
    this.muzzleFlashes = [];
    this.shockwaves = [];
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  // Activar vibración de pantalla
  shake(amount = 8) {
    if (!this.shakeEnabled) return;
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 28);
  }

  // Destello en la boca del cañón
  addMuzzleFlash(x, y, radius = 14, color = '#00f0ff') {
    this.muzzleFlashes.push({
      x, y,
      radius,
      color,
      life: 1.0,
      decay: 0.22
    });
  }

  // Onda expansiva de impacto / explosión
  addShockwave(x, y, maxRadius = 60, color = '#00f0ff', duration = 0.4) {
    this.shockwaves.push({
      x, y,
      radius: 4,
      maxRadius,
      color,
      life: 1.0,
      decay: 1 / (duration * 60)
    });
  }

  // Texto flotante de combate (+100 PTS, CRÍTICO, etc.)
  addFloatingText(text, x, y, color = '#ffe600', size = 16) {
    this.texts.push({
      text,
      x: x + (Math.random() * 20 - 10),
      y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.8 - Math.random() * 1.2,
      color,
      size,
      alpha: 1.0,
      life: 1.0,
      decay: 0.02
    });
  }

  // Estela de propulsor de la nave del jugador
  addThrusterParticle(x, y, isHyper = false) {
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const speed = isHyper ? 6 + Math.random() * 4 : 3 + Math.random() * 2.5;
    const colors = isHyper 
      ? ['#00f0ff', '#ffe600', '#ffffff'] 
      : ['#00f0ff', '#0088ff', '#9d00ff'];
    
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y,
      vx: Math.cos(angle) * speed * 0.3,
      vy: Math.sin(angle) * speed,
      size: isHyper ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2,
      color,
      alpha: 0.9,
      decay: 0.045,
      shape: 'circle'
    });
  }

  // Explosión genérica personalizable
  createExplosion(x, y, count = 25, options = {}) {
    const {
      colors = ['#ff0077', '#ff8800', '#ffe600', '#ffffff'],
      minSpeed = 2,
      maxSpeed = 8,
      minSize = 2,
      maxSize = 6,
      shockwave = true,
      shockColor = '#ff5500'
    } = options;

    if (shockwave) {
      this.addShockwave(x, y, maxSpeed * 12, shockColor, 0.45);
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.96,
        size: minSize + Math.random() * (maxSize - minSize),
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        shape: Math.random() > 0.4 ? 'spark' : 'circle'
      });
    }
  }

  // Chispas al impactar escudos o blindajes
  createSparks(x, y, count = 10, color = '#00f0ff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.94,
        size: 1.5 + Math.random() * 2.5,
        color,
        alpha: 1.0,
        decay: 0.05 + Math.random() * 0.04,
        shape: 'spark'
      });
    }
  }

  // Actualización de estado en cada frame
  update(dt = 1) {
    // 1. Screen Shake update
    if (this.shakeIntensity > 0.05) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // 2. Muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = this.muzzleFlashes[i];
      flash.life -= flash.decay * dt;
      if (flash.life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }

    // 3. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.15 * dt;
      sw.life -= sw.decay * dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 4. Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.drag) {
        p.vx *= Math.pow(p.drag, dt);
        p.vy *= Math.pow(p.drag, dt);
      }

      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Textos flotantes
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const txt = this.texts[i];
      txt.x += txt.vx * dt;
      txt.y += txt.vy * dt;
      txt.alpha -= txt.decay * dt;
      if (txt.alpha <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  // Renderizado en el Canvas
  draw(ctx) {
    ctx.save();

    // Dibujar Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, 4 * sw.life);
      ctx.globalAlpha = sw.life * 0.8;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // Dibujar Muzzle Flashes
    for (const flash of this.muzzleFlashes) {
      ctx.save();
      ctx.beginPath();
      const grad = ctx.createRadialGradient(
        flash.x, flash.y, 0,
        flash.x, flash.y, flash.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, flash.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = flash.life;
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dibujar Partículas con efecto de brillo
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'spark') {
        ctx.beginPath();
        const len = Math.max(2, p.size * 2);
        ctx.ellipse(p.x, p.y, p.size, len, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.alpha), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Dibujar Textos Flotantes
    for (const txt of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, txt.alpha);
      ctx.font = `bold ${txt.size}px 'Orbitron', sans-serif`;
      ctx.fillStyle = txt.color;
      ctx.shadowColor = txt.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

// Instancia global
const Particles = new ParticleSystem();
