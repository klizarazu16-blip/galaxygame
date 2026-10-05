/**
 * GALAXY STRIKE - MAIN UI CONTROLLER & APP INITIALIZER
 * Conexión de interfaz de usuario, eventos de botones, modales, ajustes y persistencia.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Motor del Juego
  Game = new GameEngine();

  // Referencias a elementos del DOM
  const screenMainMenu = document.getElementById('screen-main-menu');
  const screenPause = document.getElementById('screen-pause');
  const screenGameOver = document.getElementById('screen-gameover');
  const screenLeaderboard = document.getElementById('screen-leaderboard');
  const screenControls = document.getElementById('screen-controls');
  const screenSettings = document.getElementById('screen-settings');
  const gameHud = document.getElementById('game-hud');
  const crtOverlay = document.getElementById('crt-overlay');

  const waveBanner = document.getElementById('wave-banner');
  const waveBannerTitle = document.getElementById('wave-banner-title');
  const waveBannerSubtitle = document.getElementById('wave-banner-subtitle');

  // 1. Cargar y Aplicar Ajustes Guardados
  const userSettings = Storage.getSettings();

  const sliderMaster = document.getElementById('slider-master-volume');
  const valMaster = document.getElementById('val-master-volume');
  const sliderSfx = document.getElementById('slider-sfx-volume');
  const valSfx = document.getElementById('val-sfx-volume');
  const sliderMusic = document.getElementById('slider-music-volume');
  const valMusic = document.getElementById('val-music-volume');
  const toggleCrt = document.getElementById('toggle-crt');
  const toggleShake = document.getElementById('toggle-screen-shake');
  const selectControls = document.getElementById('select-control-mode');
  const toggleAutofire = document.getElementById('toggle-autofire');

  // Sincronizar UI con Ajustes
  sliderMaster.value = userSettings.masterVolume;
  valMaster.textContent = `${userSettings.masterVolume}%`;
  sliderSfx.value = userSettings.sfxVolume;
  valSfx.textContent = `${userSettings.sfxVolume}%`;
  sliderMusic.value = userSettings.musicVolume;
  valMusic.textContent = `${userSettings.musicVolume}%`;
  toggleCrt.checked = userSettings.crtEnabled;
  toggleShake.checked = userSettings.screenShakeEnabled;
  selectControls.value = userSettings.controlMode;
  toggleAutofire.checked = userSettings.autofire;

  // Aplicar ajustes al motor
  Sound.setMasterVolume(userSettings.masterVolume / 100);
  Sound.setSFXVolume(userSettings.sfxVolume / 100);
  Sound.setMusicVolume(userSettings.musicVolume / 100);
  Particles.shakeEnabled = userSettings.screenShakeEnabled;
  Game.input.autofire = userSettings.autofire;
  Game.input.controlMode = userSettings.controlMode || 'hybrid';
  if (userSettings.crtEnabled) {
    crtOverlay.classList.add('active');
  } else {
    crtOverlay.classList.remove('active');
  }

  // 2. Eventos de Ajustes
  sliderMaster.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valMaster.textContent = `${val}%`;
    Sound.setMasterVolume(val / 100);
    userSettings.masterVolume = val;
    Storage.saveSettings(userSettings);
  });

  sliderSfx.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valSfx.textContent = `${val}%`;
    Sound.setSFXVolume(val / 100);
    userSettings.sfxVolume = val;
    Storage.saveSettings(userSettings);
  });

  sliderMusic.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valMusic.textContent = `${val}%`;
    Sound.setMusicVolume(val / 100);
    userSettings.musicVolume = val;
    Storage.saveSettings(userSettings);
  });

  toggleCrt.addEventListener('change', (e) => {
    userSettings.crtEnabled = e.target.checked;
    crtOverlay.classList.toggle('active', userSettings.crtEnabled);
    Storage.saveSettings(userSettings);
  });

  toggleShake.addEventListener('change', (e) => {
    userSettings.screenShakeEnabled = e.target.checked;
    Particles.shakeEnabled = userSettings.screenShakeEnabled;
    Storage.saveSettings(userSettings);
  });

  selectControls.addEventListener('change', (e) => {
    userSettings.controlMode = e.target.value;
    Game.input.controlMode = e.target.value;
    if (e.target.value === 'keyboard') {
      Game.input.isMouseControl = false;
      Game.input.mouseMoved = false;
    }
    Storage.saveSettings(userSettings);
  });

  toggleAutofire.addEventListener('change', (e) => {
    userSettings.autofire = e.target.checked;
    Game.input.autofire = userSettings.autofire;
    Storage.saveSettings(userSettings);
  });

  // 3. Notificación y Banner de Oleadas
  Waves.onWaveStart = (waveNum, title, subtitle) => {
    waveBannerTitle.textContent = title;
    waveBannerSubtitle.textContent = subtitle;
    waveBanner.classList.remove('hidden');

    // Reiniciar animación css
    waveBanner.style.animation = 'none';
    waveBanner.offsetHeight; // Trigger reflow
    waveBanner.style.animation = 'bannerPop 2.5s ease-in-out forwards';

    setTimeout(() => {
      waveBanner.classList.add('hidden');
    }, 2500);
  };

  // 4. Renderizado del Tablero de Récords
  function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    const scores = Storage.getHighScores();

    scores.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
      tr.className = rankClass;

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${entry.name}</strong></td>
        <td>${entry.score.toLocaleString()}</td>
        <td>${entry.wave}</td>
        <td>${entry.accuracy}%</td>
        <td>${entry.date || '---'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 5. Botones de Navegación y UI
  // Despegar / Jugar
  document.getElementById('btn-play').addEventListener('click', () => {
    Sound.init();
    screenMainMenu.classList.add('hidden');
    gameHud.classList.remove('hidden');
    Game.startNewGame();
  });

  // Reintentar tras Game Over
  document.getElementById('btn-retry').addEventListener('click', () => {
    screenGameOver.classList.add('hidden');
    gameHud.classList.remove('hidden');
    Game.startNewGame();
  });

  // Guardar Puntuación en Salón de la Fama
  document.getElementById('btn-save-score').addEventListener('click', () => {
    const input = document.getElementById('player-name-input');
    const name = input.value.trim() || 'PILOTO-01';
    const stats = Game.player.stats;
    const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

    Storage.addHighScore({
      name,
      score: stats.score,
      wave: Waves.currentWave,
      accuracy
    });

    document.getElementById('high-score-form-container').classList.add('hidden');
    renderLeaderboard();
    screenGameOver.classList.add('hidden');
    screenLeaderboard.classList.remove('hidden');
  });

  // Pausa Rápida desde el HUD
  document.getElementById('btn-quick-pause').addEventListener('click', () => {
    Game.pauseGame();
  });

  // Detonar Bomba EMP desde el HUD (Touch / Móvil / Tablet)
  const bombBlock = document.querySelector('.bomb-block');
  if (bombBlock) {
    bombBlock.addEventListener('click', (e) => {
      e.stopPropagation();
      Game.triggerPlayerBomb();
    });
  }

  // Reanudar desde Pausa
  document.getElementById('btn-resume').addEventListener('click', () => {
    Game.resumeGame();
  });

  // Reiniciar Misión desde Pausa
  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    screenPause.classList.add('hidden');
    Game.startNewGame();
  });

  // Salir al Menú Principal
  function returnToMainMenu() {
    screenPause.classList.add('hidden');
    screenGameOver.classList.add('hidden');
    screenLeaderboard.classList.add('hidden');
    screenControls.classList.add('hidden');
    screenSettings.classList.add('hidden');
    gameHud.classList.add('hidden');
    screenMainMenu.classList.remove('hidden');
    Sound.stopMusic();
    Game.state = 'MENU';
  }

  document.getElementById('btn-exit-main-menu').addEventListener('click', returnToMainMenu);
  document.getElementById('btn-gameover-menu').addEventListener('click', returnToMainMenu);

  // Abrir Tablero de Récords
  document.getElementById('btn-leaderboard').addEventListener('click', () => {
    renderLeaderboard();
    screenLeaderboard.classList.remove('hidden');
  });

  document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => {
    renderLeaderboard();
    screenLeaderboard.classList.remove('hidden');
  });

  // Botón Reintentar desde el Tablero de Récords
  document.getElementById('btn-leaderboard-retry').addEventListener('click', () => {
    screenLeaderboard.classList.add('hidden');
    screenGameOver.classList.add('hidden');
    screenPause.classList.add('hidden');
    screenMainMenu.classList.add('hidden');
    gameHud.classList.remove('hidden');
    Sound.init();
    Game.startNewGame();
  });

  // Botón Menú Principal desde el Tablero de Récords
  document.getElementById('btn-leaderboard-menu').addEventListener('click', returnToMainMenu);

  // Cerrar Tablero de Récords (vuelve al Game Over o al Menú Principal)
  document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
    screenLeaderboard.classList.add('hidden');
    if (Game.state === 'GAMEOVER') {
      screenGameOver.classList.remove('hidden');
    } else if (Game.state === 'PAUSED') {
      screenPause.classList.remove('hidden');
    } else {
      returnToMainMenu();
    }
  });

  document.getElementById('btn-clear-scores').addEventListener('click', () => {
    if (confirm('¿Deseas restablecer todos los récords a los valores predeterminados?')) {
      Storage.clearHighScores();
      renderLeaderboard();
    }
  });

  // Abrir y Cerrar Manual de Controles
  document.getElementById('btn-controls').addEventListener('click', () => {
    screenControls.classList.remove('hidden');
  });

  document.getElementById('btn-close-controls').addEventListener('click', () => {
    screenControls.classList.add('hidden');
    if (Game.state === 'GAMEOVER') {
      screenGameOver.classList.remove('hidden');
    } else if (Game.state === 'PAUSED') {
      screenPause.classList.remove('hidden');
    } else if (Game.state === 'MENU') {
      screenMainMenu.classList.remove('hidden');
    }
  });

  // Abrir y Cerrar Ajustes
  document.getElementById('btn-settings').addEventListener('click', () => {
    screenSettings.classList.remove('hidden');
  });

  document.getElementById('btn-settings-pause').addEventListener('click', () => {
    screenSettings.classList.remove('hidden');
  });

  document.getElementById('btn-close-settings').addEventListener('click', () => {
    screenSettings.classList.add('hidden');
    if (Game.state === 'GAMEOVER') {
      screenGameOver.classList.remove('hidden');
    } else if (Game.state === 'PAUSED') {
      screenPause.classList.remove('hidden');
    } else if (Game.state === 'MENU') {
      screenMainMenu.classList.remove('hidden');
    }
  });

  // 6. Iniciar bucle de animación
  requestAnimationFrame((t) => Game.loop(t));
});
