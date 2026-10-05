/**
 * GALAXY STRIKE - STORAGE & LEADERBOARD MANAGER
 * Gestión de récords en LocalStorage, estadísticas de juego y configuración de usuario.
 */

class StorageManager {
  constructor() {
    this.SCORE_KEY = 'galaxy_strike_highscores_v1';
    this.SETTINGS_KEY = 'galaxy_strike_settings_v1';

    // Récords por defecto si no existen
    this.defaultScores = [
      { name: 'VALKYRIE-01', score: 85000, wave: 10, accuracy: 88, date: '2026-09-15' },
      { name: 'NOVA_CORE', score: 62400, wave: 8, accuracy: 84, date: '2026-09-20' },
      { name: 'SOLARIS', score: 48900, wave: 6, accuracy: 79, date: '2026-09-25' },
      { name: 'SHADOW_FOX', score: 35200, wave: 5, accuracy: 72, date: '2026-09-28' },
      { name: 'CYBER_ACE', score: 21800, wave: 4, accuracy: 68, date: '2026-10-01' },
      { name: 'PILOT_ROOKIE', score: 10500, wave: 2, accuracy: 60, date: '2026-10-02' }
    ];

    // Ajustes por defecto
    this.defaultSettings = {
      masterVolume: 80,
      sfxVolume: 85,
      musicVolume: 65,
      crtEnabled: true,
      screenShakeEnabled: true,
      controlMode: 'hybrid', // hybrid, keyboard, mouse
      autofire: false
    };
  }

  getHighScores() {
    try {
      const raw = localStorage.getItem(this.SCORE_KEY);
      if (!raw) {
        this.saveHighScores(this.defaultScores);
        return [...this.defaultScores];
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Error leyendo récords de LocalStorage:', e);
      return [...this.defaultScores];
    }
  }

  saveHighScores(scores) {
    try {
      localStorage.setItem(this.SCORE_KEY, JSON.stringify(scores.slice(0, 10)));
    } catch (e) {
      console.warn('Error guardando récords en LocalStorage:', e);
    }
  }

  isHighScore(score) {
    if (score <= 0) return false;
    const scores = this.getHighScores();
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
  }

  addHighScore(entry) {
    const scores = this.getHighScores();
    const newEntry = {
      name: (entry.name || 'PILOTO').toUpperCase().slice(0, 12),
      score: entry.score || 0,
      wave: entry.wave || 1,
      accuracy: Math.round(entry.accuracy || 0),
      date: new Date().toISOString().split('T')[0]
    };

    scores.push(newEntry);
    // Ordenar de mayor a menor puntuación
    scores.sort((a, b) => b.score - a.score);
    const top10 = scores.slice(0, 10);
    this.saveHighScores(top10);
    return top10;
  }

  clearHighScores() {
    try {
      localStorage.removeItem(this.SCORE_KEY);
      this.saveHighScores(this.defaultScores);
      return [...this.defaultScores];
    } catch (e) {
      return [...this.defaultScores];
    }
  }

  getSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (!raw) return { ...this.defaultSettings };
      return { ...this.defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      return { ...this.defaultSettings };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error guardando ajustes en LocalStorage:', e);
    }
  }
}

// Instancia global
const Storage = new StorageManager();
