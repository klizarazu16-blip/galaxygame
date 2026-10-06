/**
 * GALAXY STRIKE - CORE GAME ENGINE
 * Bucle de renderizado a 60/120 FPS, gestor de entradas (teclado/ratón/touch),
 * detección de colisiones, combos y actualización de HUD en tiempo real.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.lastTime = 0;
    this.fps = 60;

    // Rendimiento: detectar dispositivos táctiles (móvil / tablet)
    this.isMobile = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.lowFx = false;
    this.hudTimer = 0;
    this.perfSampleTime = 0;
    this.perfSampleFrames = 0;

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      bomb: false,
      autofire: false,
      controlMode: 'hybrid', // hybrid, keyboard, mouse
      mouseX: this.width / 2,
      mouseY: this.height - 120,
      mouseMoved: false,
      isMouseControl: false
    };

    this.player = null;
    if (this.isMobile) this.enableLowFx();
    this.initCanvas();
    this.initInputs();
  }

  /**
   * Modo de efectos reducidos: desactiva shadowBlur (el efecto más costoso del
   * canvas en móviles) y limita la cantidad de partículas simultáneas.
   */
  enableLowFx() {
    if (this.lowFx) return;
    this.lowFx = true;
    Object.defineProperty(this.ctx, 'shadowBlur', {
      get: () => 0,
      set: () => {},
      configurable: true
    });
    Particles.maxParticles = 140;
    console.log('Galaxy Strike: modo de alto rendimiento activado');
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    // En móviles se limita la resolución interna para reducir píxeles a dibujar
    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    Stars.resize(this.width, this.height);
    if (this.player) {
      this.player.resize(this.width, this.height);
    }
  }

  initInputs() {
    this.keys = {};

    const updateKeys = () => {
      this.input.up = Boolean(this.keys['KeyW'] || this.keys['Keyw'] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']);
      this.input.down = Boolean(this.keys['KeyS'] || this.keys['Keys'] || this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']);
      this.input.left = Boolean(this.keys['KeyA'] || this.keys['Keya'] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']);
      this.input.right = Boolean(this.keys['KeyD'] || this.keys['Keyd'] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']);
      this.input.fire = Boolean(this.keys['Space'] || this.keys[' '] || this.keys['KeyJ'] || this.keys['j'] || this.keys['KeyZ'] || this.keys['z'] || this.input.mouseDown);
    };

    // 1. Teclado (WASD + Flechas + Disparo + Bomba)
    window.addEventListener('keydown', (e) => {
      Sound.ensureContext();
      if (e.code) this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;
        this.keys[e.key.toUpperCase()] = true;
      }
      updateKeys();

      // Bomba EMP
      const k = (e.key || '').toLowerCase();
      if (e.code === 'KeyB' || k === 'b' || e.code === 'KeyK' || k === 'k' || e.code === 'KeyX' || k === 'x') {
        this.triggerPlayerBomb();
      }

      // Teclas de Función
      if (e.code === 'Escape' || e.code === 'KeyP' || k === 'p') {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      }
      if (e.code === 'KeyM' || k === 'm') {
        Sound.toggleMute();
      }

      // Prevenir scroll en la ventana con teclas de juego
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code) this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.key.toUpperCase()] = false;
      }
      updateKeys();
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.input.mouseDown = false;
      updateKeys();
    });

    // 2. Ratón / Puntero
    this.input.mouseDown = false;

    window.addEventListener('mousedown', (e) => {
      Sound.ensureContext();
      if (e.button === 0) { // Clic Izquierdo = Disparo
        this.input.mouseDown = true;
        this.input.fire = true;
      } else if (e.button === 2) { // Clic Derecho = Bomba EMP
        e.preventDefault();
        this.triggerPlayerBomb();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.mouseDown = false;
        updateKeys();
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;

      // Solo seguir ratón si el modo es explícitamente ratón o si se arrastra haciendo clic
      if (this.input.controlMode === 'mouse' || (this.input.controlMode === 'hybrid' && this.input.mouseDown)) {
        this.input.isMouseControl = true;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // 3. Táctil (Móviles / Tablets)
    window.addEventListener('touchstart', (e) => {
      Sound.ensureContext();
      if (e.touches.length > 0) {
        this.input.mouseX = e.touches[0].clientX;
        this.input.mouseY = e.touches[0].clientY;
        this.input.isMouseControl = true;
        this.input.mouseDown = true;
        this.input.fire = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.input.mouseX = e.touches[0].clientX;
        this.input.mouseY = e.touches[0].clientY;
        this.input.isMouseControl = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.input.mouseDown = false;
      this.input.isMouseControl = false;
      this.input.fire = false;
    });
  }

  triggerPlayerBomb() {
    if (this.state === 'PLAYING' && this.player) {
      this.player.triggerBomb(Enemies.enemies, Enemies.enemyBullets);
      this.updateHUD();
      this.hudTimer = 0;
    }
  }

  startNewGame() {
    this.player = new Player(this.width, this.height);
    Enemies.reset();
    Powerups.reset();
    Particles.reset();
    Waves.reset();

    this.keys = {};
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;
    this.input.fire = false;
    this.input.mouseDown = false;
    this.input.isMouseControl = false;

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    window.focus();

    this.state = 'PLAYING';
    Sound.startMusic();
    Waves.startNextWave();
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    document.getElementById('screen-pause').classList.remove('hidden');
    document.getElementById('pause-wave').textContent = Waves.currentWave;
    document.getElementById('pause-score').textContent = this.player.stats.score.toLocaleString();
    document.getElementById('pause-kills').textContent = this.player.stats.kills;
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    document.getElementById('screen-pause').classList.add('hidden');
    this.keys = {};
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    window.focus();
    this.lastTime = performance.now();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    Sound.stopMusic();
    Sound.playGameOver();

    const stats = this.player.stats;
    const accuracy = stats.shotsFired > 0 ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100)) : 0;

    // Actualizar pantalla de Game Over
    document.getElementById('gameover-final-score').textContent = stats.score.toLocaleString();
    document.getElementById('gameover-wave').textContent = Waves.currentWave;
    document.getElementById('gameover-kills').textContent = stats.kills;
    document.getElementById('gameover-accuracy').textContent = `${accuracy}%`;
    document.getElementById('gameover-maxcombo').textContent = `x${stats.maxCombo}`;

    const scoreForm = document.getElementById('high-score-form-container');
    if (Storage.isHighScore(stats.score)) {
      scoreForm.classList.remove('hidden');
    } else {
      scoreForm.classList.add('hidden');
    }

    document.getElementById('screen-gameover').classList.remove('hidden');
  }

  // Comprobar Colisiones
  checkCollisions() {
    if (!this.player || this.state !== 'PLAYING') return;

    const bullets = this.player.bullets;
    const enemies = Enemies.enemies;

    // 1. Proyectiles del Jugador vs Enemigos
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = bullets[bIdx];

      for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = enemies[eIdx];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);

        if (dist < b.radius + e.radius) {
          this.player.stats.shotsHit++;

          // Infligir daño
          const isDead = e.takeDamage(b.damage);

          if (isDead) {
            // Aumentar combo
            this.player.stats.combo = Math.min(5, this.player.stats.combo + 1);
            this.player.stats.comboTimer = 160; // ~2.6 seg para mantener combo
            this.player.stats.maxCombo = Math.max(this.player.stats.maxCombo, this.player.stats.combo);

            const pointsAwarded = e.scoreValue * this.player.stats.combo;
            this.player.stats.score += pointsAwarded;
            this.player.stats.kills++;

            Particles.addFloatingText(
              `+${pointsAwarded}${this.player.stats.combo > 1 ? ` (x${this.player.stats.combo})` : ''}`,
              e.x, e.y,
              this.player.stats.combo >= 3 ? '#ffe600' : '#00f0ff',
              14 + this.player.stats.combo
            );
          }

          if (!b.isPlasma) {
            b.dead = true;
            bullets.splice(bIdx, 1);
          }
          break;
        }
      }
    }
  }

  // Actualizar HUD en pantalla
  updateHUD() {
    if (!this.player) return;

    // 1. Puntuación y Combo
    document.getElementById('hud-score').textContent = this.player.stats.score.toString().padStart(6, '0');
    document.getElementById('hud-wave').textContent = Waves.currentWave;

    const comboBadge = document.getElementById('hud-combo-badge');
    if (this.player.stats.combo > 1) {
      comboBadge.textContent = `x${this.player.stats.combo} COMBO`;
      comboBadge.classList.remove('hidden');
    } else {
      comboBadge.classList.add('hidden');
    }

    // 2. Barra de Escudo
    const shieldPercent = Math.max(0, Math.min(100, (this.player.shield / this.player.maxShield) * 100));
    document.getElementById('hud-shield-bar').style.width = `${shieldPercent}%`;

    // 3. Vidas
    const livesContainer = document.getElementById('hud-lives-container');
    const lifeIcons = livesContainer.querySelectorAll('.life-icon');
    lifeIcons.forEach((icon, idx) => {
      if (idx < this.player.lives) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });

    // 4. Bombas EMP
    const bombsContainer = document.getElementById('hud-bombs-container');
    const bombIcons = bombsContainer.querySelectorAll('.bomb-icon');
    bombIcons.forEach((icon, idx) => {
      if (idx < this.player.bombs) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });

    // 5. Power-ups Activos
    const puContainer = document.getElementById('active-powerups-container');
    puContainer.innerHTML = '';
    for (const key in this.player.activeEffects) {
      const remaining = this.player.activeEffects[key];
      if (remaining > 0) {
        const puInfo = POWERUP_TYPES[key.toUpperCase()];
        if (puInfo) {
          const pill = document.createElement('div');
          pill.className = 'powerup-pill';
          pill.style.color = puInfo.color;
          pill.innerHTML = `
            <span>${puInfo.icon}</span>
            <span>${Math.ceil(remaining)}s</span>
            <div class="powerup-timer-bar">
              <div class="powerup-timer-fill" style="width: ${(remaining / puInfo.duration) * 100}%; background-color: ${puInfo.color};"></div>
            </div>
          `;
          puContainer.appendChild(pill);
        }
      }
    }

    // 6. Barra de Jefe
    const bossHud = document.getElementById('boss-hud-bar-container');
    const boss = Enemies.enemies.find(e => e.isBoss);
    if (boss && !boss.dead) {
      bossHud.classList.remove('hidden');
      const bossHpPercent = Math.max(0, Math.min(100, Math.round((boss.hp / boss.maxHp) * 100)));
      document.getElementById('boss-health-bar').style.width = `${bossHpPercent}%`;
      document.getElementById('boss-health-percent').textContent = `${bossHpPercent}%`;
    } else {
      bossHud.classList.add('hidden');
    }
  }

  // Bucle Principal (Game Loop)
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaMs = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Normalizar a 60 FPS (dt = 1.0 a 60 FPS). Tope de 4 para no ralentizar
    // el juego cuando el dispositivo baja de FPS (antes 2.5 = juego en cámara lenta).
    const dt = Math.min(deltaMs / (1000 / 60), 4);

    // 1. Actualizar estado
    Stars.update(dt);
    Particles.update(dt);

    if (this.state === 'PLAYING') {
      // Sub-pasos de física: con FPS bajos se divide el avance en pasos pequeños
      // para mantener la velocidad real y evitar que los disparos atraviesen enemigos.
      const steps = Math.max(1, Math.ceil(dt / 1.5));
      const stepDt = dt / steps;
      for (let i = 0; i < steps && this.state === 'PLAYING'; i++) {
        this.player.update(stepDt, this.input, Enemies.enemies);
        Enemies.update(stepDt, this.player);
        Powerups.update(stepDt, this.player);
        Waves.update(stepDt, this.player);
        this.checkCollisions();
      }

      // HUD (DOM) actualizado ~12 veces por segundo en vez de en cada frame
      this.hudTimer -= deltaMs;
      if (this.hudTimer <= 0) {
        this.updateHUD();
        this.hudTimer = 80;
      }

      // Calidad adaptativa: si el FPS promedio cae por debajo de 45, reducir efectos
      if (!this.lowFx && deltaMs < 250) {
        this.perfSampleTime += deltaMs;
        this.perfSampleFrames++;
        if (this.perfSampleTime >= 2000) {
          const avgFps = (this.perfSampleFrames * 1000) / this.perfSampleTime;
          if (avgFps < 45) this.enableLowFx();
          this.perfSampleTime = 0;
          this.perfSampleFrames = 0;
        }
      }

      // Chequear si el jugador murió
      if (this.player.lives <= 0) {
        this.updateHUD();
        this.gameOver();
      }
    }

    // 2. Renderizar escena
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    this.ctx.save();

    // Aplicar Screen Shake a la cámara
    if (Particles.shakeX !== 0 || Particles.shakeY !== 0) {
      this.ctx.translate(Particles.shakeX, Particles.shakeY);
    }

    // Limpiar pantalla
    this.ctx.fillStyle = '#05060f';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Capas de dibujo
    Stars.draw(this.ctx);
    Powerups.draw(this.ctx);

    if (this.player && this.state !== 'MENU') {
      this.player.draw(this.ctx);
    }

    Enemies.draw(this.ctx);
    Particles.draw(this.ctx);

    this.ctx.restore();
  }
}

// Instancia global
let Game = null;
