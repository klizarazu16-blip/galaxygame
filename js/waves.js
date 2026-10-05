/**
 * GALAXY STRIKE - WAVE GENERATOR & MISSION SYSTEM
 * Sistema de progresión infinita por oleadas, formaciones de combate,
 * campos de asteroides y encuentros con Jefes cada 5 oleadas.
 */

class WaveManager {
  constructor() {
    this.currentWave = 1;
    this.waveState = 'IDLE'; // 'STARTING', 'IN_PROGRESS', 'WARPING', 'BOSS_ACTIVE'
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveClearBonus = 1000;
    this.waveTitle = '';
    this.waveSubtitle = '';

    this.onWaveStart = null;
    this.onWaveClear = null;
  }

  reset() {
    this.currentWave = 1;
    this.waveState = 'IDLE';
    this.spawnQueue = [];
    this.spawnTimer = 0;
  }

  startNextWave() {
    this.waveState = 'STARTING';
    Stars.setWarp(true);
    Sound.playWaveStart();

    const isBossWave = this.currentWave % 5 === 0;

    if (isBossWave) {
      this.waveTitle = `OLEADA ${this.currentWave}`;
      this.waveSubtitle = '⚠️ ALERTA DE JEFE: NAVE NODRIZA KRONOS';
    } else {
      const titles = [
        'INVASIÓN DEL SECTOR PRIMARIO',
        'CAMPO DE ASTEROIDES DETECTADO',
        'EMBOSCADA DE INTERCEPTORES',
        'CRUCEROS PESADOS EN RUTA',
        'ENJAMBRE DE KAMIKAZES',
        'FLOTA DE COMBATE AVANZADA'
      ];
      const sub = titles[(this.currentWave - 1) % titles.length];
      this.waveTitle = `OLEADA ${this.currentWave}`;
      this.waveSubtitle = sub;
    }

    if (this.onWaveStart) {
      this.onWaveStart(this.currentWave, this.waveTitle, this.waveSubtitle);
    }

    // Preparar cola de spawns después del efecto warp (1.8s)
    setTimeout(() => {
      Stars.setWarp(false);
      this.buildWaveSpawns(this.currentWave);
      this.waveState = isBossWave ? 'BOSS_ACTIVE' : 'IN_PROGRESS';
    }, 1800);
  }

  buildWaveSpawns(wave) {
    this.spawnQueue = [];
    const width = window.innerWidth;
    const isBossWave = wave % 5 === 0;

    if (isBossWave) {
      // Spawn del Jefe Principal
      const bossLevel = Math.floor(wave / 5);
      this.spawnQueue.push({
        time: 20,
        spawn: () => {
          Enemies.enemies.push(new BossMothership(width / 2, -80, bossLevel));
        }
      });
      return;
    }

    // Dificultad escalable
    const totalGroups = 4 + Math.floor(wave * 1.5);
    let cumulativeTime = 30;

    for (let g = 0; g < totalGroups; g++) {
      const groupType = Math.random();

      if (groupType < 0.35) {
        // Formación de Drones Exploradores en V
        const count = 3 + Math.min(4, Math.floor(wave * 0.5));
        const startX = 80 + Math.random() * (width - 160);
        for (let i = 0; i < count; i++) {
          this.spawnQueue.push({
            time: cumulativeTime + i * 14,
            spawn: () => {
              Enemies.enemies.push(new ScoutEnemy(startX + (i % 2 === 0 ? i * 20 : -i * 20), -30, i * 0.2));
            }
          });
        }
        cumulativeTime += count * 14 + 40;

      } else if (groupType < 0.65) {
        // Cazas Interceptores en parejas
        const startX = 100 + Math.random() * (width - 200);
        this.spawnQueue.push({
          time: cumulativeTime,
          spawn: () => {
            Enemies.enemies.push(new InterceptorEnemy(startX - 50, -30));
            Enemies.enemies.push(new InterceptorEnemy(startX + 50, -30));
          }
        });
        cumulativeTime += 65;

      } else if (groupType < 0.82 && wave >= 2) {
        // Crucero Pesado con escolta
        const startX = 120 + Math.random() * (width - 240);
        this.spawnQueue.push({
          time: cumulativeTime,
          spawn: () => {
            Enemies.enemies.push(new CruiserEnemy(startX, -50));
            Enemies.enemies.push(new ScoutEnemy(startX - 60, -20));
            Enemies.enemies.push(new ScoutEnemy(startX + 60, -20));
          }
        });
        cumulativeTime += 90;

      } else if (groupType < 0.92) {
        // Enjambre de Asteroides destructibles
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          this.spawnQueue.push({
            time: cumulativeTime + i * 18,
            spawn: () => {
              const x = 50 + Math.random() * (width - 100);
              Enemies.enemies.push(new Asteroid(x, -50, Math.random() > 0.4 ? 3 : 2));
            }
          });
        }
        cumulativeTime += 60;

      } else {
        // Kamikaze sorpresivo
        const startX = 80 + Math.random() * (width - 160);
        this.spawnQueue.push({
          time: cumulativeTime,
          spawn: () => {
            Enemies.enemies.push(new KamikazeEnemy(startX, -30));
          }
        });
        cumulativeTime += 50;
      }
    }
  }

  update(dt, player) {
    if (this.waveState === 'IN_PROGRESS' || this.waveState === 'BOSS_ACTIVE') {
      this.spawnTimer += dt;

      // Procesar spawns programados
      for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
        const item = this.spawnQueue[i];
        if (this.spawnTimer >= item.time) {
          item.spawn();
          this.spawnQueue.splice(i, 1);
        }
      }

      // Comprobar si la oleada ha terminado (todos los enemigos muertos y cola vacía)
      if (this.spawnQueue.length === 0 && Enemies.enemies.length === 0) {
        this.completeWave(player);
      }
    }
  }

  completeWave(player) {
    this.waveState = 'WARPING';
    const bonus = this.waveClearBonus * this.currentWave;
    player.stats.score += bonus;
    Particles.addFloatingText(`+${bonus} BONO DE OLEADA!`, player.x, player.y - 30, '#ffe600', 20);

    if (this.onWaveClear) {
      this.onWaveClear(this.currentWave, bonus);
    }

    // Iniciar siguiente oleada tras breve pausa
    setTimeout(() => {
      this.currentWave++;
      this.spawnTimer = 0;
      this.startNextWave();
    }, 2200);
  }
}

// Instancia global
const Waves = new WaveManager();
