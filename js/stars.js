/**
 * GALAXY STRIKE - PARALLAX STARFIELD & NEBULA SYSTEM
 * Fondo cósmico con 3 capas de profundidad, nebulosas dinámicas y efecto Warp Speed
 */

class Starfield {
  constructor() {
    this.layers = [];
    this.nebulae = [];
    this.warpActive = false;
    this.warpFactor = 1.0;
    this.targetWarpFactor = 1.0;
    this.baseSpeed = 1.0;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.init();
  }

  init() {
    this.layers = [
      // Capa 1: Fondo profundo (polvo estelar lento y pequeño)
      { count: 120, speed: 0.4, sizeMin: 0.6, sizeMax: 1.2, stars: [], color: '#7a889b' },
      // Capa 2: Estrellas medias brillantes
      { count: 80, speed: 1.0, sizeMin: 1.2, sizeMax: 2.2, stars: [], color: '#00f0ff' },
      // Capa 3: Estrellas cercanas rápidas con brillo
      { count: 40, speed: 2.2, sizeMin: 2.2, sizeMax: 3.5, stars: [], color: '#ffffff' }
    ];

    this.populateStars();
    this.generateNebulae();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.populateStars();
    this.generateNebulae();
  }

  populateStars() {
    for (const layer of this.layers) {
      layer.stars = [];
      for (let i = 0; i < layer.count; i++) {
        layer.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
          speedOffset: 0.8 + Math.random() * 0.4,
          twinkleSpeed: 0.02 + Math.random() * 0.04,
          twinklePhase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.8 ? (Math.random() > 0.5 ? '#ff0077' : '#00f0ff') : layer.color
        });
      }
    }
  }

  generateNebulae() {
    this.nebulae = [
      {
        x: this.width * 0.25,
        y: this.height * 0.3,
        radius: Math.max(this.width, this.height) * 0.45,
        colorInner: 'rgba(157, 0, 255, 0.07)',
        colorOuter: 'rgba(0, 0, 0, 0)',
        vx: 0.05,
        vy: 0.15
      },
      {
        x: this.width * 0.75,
        y: this.height * 0.7,
        radius: Math.max(this.width, this.height) * 0.5,
        colorInner: 'rgba(0, 136, 255, 0.06)',
        colorOuter: 'rgba(0, 0, 0, 0)',
        vx: -0.04,
        vy: 0.12
      },
      {
        x: this.width * 0.5,
        y: this.height * 0.1,
        radius: Math.max(this.width, this.height) * 0.4,
        colorInner: 'rgba(255, 0, 119, 0.05)',
        colorOuter: 'rgba(0, 0, 0, 0)',
        vx: 0.03,
        vy: 0.18
      }
    ];
  }

  setWarp(active = true) {
    this.warpActive = active;
    this.targetWarpFactor = active ? 8.0 : 1.0;
  }

  update(dt = 1) {
    // Interpolación suave del factor Warp
    this.warpFactor += (this.targetWarpFactor - this.warpFactor) * 0.08 * dt;

    // Actualizar estrellas
    for (const layer of this.layers) {
      const currentSpeed = layer.speed * this.baseSpeed * this.warpFactor;

      for (const star of layer.stars) {
        star.y += currentSpeed * star.speedOffset * dt;
        star.twinklePhase += star.twinkleSpeed * dt;

        // Si sale de la pantalla por abajo, reaparece arriba
        if (star.y > this.height + 20) {
          star.y = -10;
          star.x = Math.random() * this.width;
        }
      }
    }

    // Actualizar nebulosas
    for (const neb of this.nebulae) {
      neb.y += neb.vy * this.warpFactor * 0.4 * dt;
      neb.x += neb.vx * dt;

      if (neb.y - neb.radius > this.height) {
        neb.y = -neb.radius;
        neb.x = Math.random() * this.width;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Dibujar Nebulosas
    for (const neb of this.nebulae) {
      const grad = ctx.createRadialGradient(
        neb.x, neb.y, 0,
        neb.x, neb.y, neb.radius
      );
      grad.addColorStop(0, neb.colorInner);
      grad.addColorStop(0.5, neb.colorInner);
      grad.addColorStop(1, neb.colorOuter);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Dibujar Estrellas
    for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isWarping = this.warpFactor > 1.8;

      for (const star of layer.stars) {
        const twinkle = 0.6 + 0.4 * Math.sin(star.twinklePhase);
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = star.color;
        ctx.strokeStyle = star.color;

        if (isWarping) {
          // Líneas de velocidad estiradas en modo Warp
          const streakLen = star.size * (this.warpFactor * 3.5);
          ctx.lineWidth = Math.max(1, star.size * 0.8);
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x, star.y - streakLen);
          ctx.stroke();
        } else {
          // Estrella normal con brillo
          if (layerIdx === 2) {
            ctx.shadowColor = star.color;
            ctx.shadowBlur = 6;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }
}

// Instancia global
const Stars = new Starfield();
