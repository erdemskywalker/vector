import { StorageManager } from './storage.js';

const PROGRESS_KEY = 'vector_puzzle_progress';

export class ProgressManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    const defaultData = {
      levels: {},
      highestUnlocked: 1,
      currentLevel: 1,
      soundEnabled: true,
      hapticsEnabled: true
    };
    return StorageManager.get(PROGRESS_KEY, defaultData);
  }

  save() {
    StorageManager.set(PROGRESS_KEY, this.data);
  }

  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    return levelId <= (this.data.highestUnlocked || 1);
  }

  getLevelStats(levelId) {
    return this.data.levels[levelId] || {
      completed: false,
      stars: 0,
      bestMoves: null
    };
  }

  calculateStars(moves, par) {
    if (moves <= par) return 3;
    if (moves <= par + 2) return 2;
    return 1;
  }

  recordCompletion(levelId, moves, par) {
    const stars = this.calculateStars(moves, par);
    const existing = this.getLevelStats(levelId);

    const bestMoves = existing.bestMoves ? Math.min(existing.bestMoves, moves) : moves;
    const maxStars = Math.max(existing.stars, stars);

    this.data.levels[levelId] = {
      completed: true,
      stars: maxStars,
      bestMoves: bestMoves
    };

    // Check if next world was locked before updating
    const wasWorldLocked = (
      (levelId === 30 && (this.data.highestUnlocked || 1) <= 30) ||
      (levelId === 60 && (this.data.highestUnlocked || 1) <= 60) ||
      (levelId === 90 && (this.data.highestUnlocked || 1) <= 90)
    );

    let unlockedWorldInfo = null;
    if (wasWorldLocked) {
      if (levelId === 30) {
        unlockedWorldInfo = { id: 2, num: '02', name: 'RESONANCE CORES', code: 'keys', startLvl: 31 };
      } else if (levelId === 60) {
        unlockedWorldInfo = { id: 3, num: '03', name: 'QUANTUM WARP', code: 'quantum', startLvl: 61 };
      } else if (levelId === 90) {
        unlockedWorldInfo = { id: 4, num: '04', name: 'PROTOCOL NEXUS', code: 'nexus', startLvl: 91 };
      }
    }

    // Unlock next level (up to 120)
    const nextLevel = Math.min(120, levelId + 1);
    if (nextLevel > this.data.highestUnlocked) {
      this.data.highestUnlocked = nextLevel;
    }
    this.data.currentLevel = nextLevel;

    this.save();

    return {
      stars,
      isNewHighStars: stars > existing.stars,
      bestMoves,
      unlockedWorldInfo
    };
  }

  getTotalStars() {
    let total = 0;
    for (const id in this.data.levels) {
      total += this.data.levels[id].stars || 0;
    }
    return total;
  }

  getCompletedCount() {
    let count = 0;
    for (const id in this.data.levels) {
      if (this.data.levels[id].completed) count++;
    }
    return count;
  }

  setCurrentLevel(id) {
    this.data.currentLevel = id;
    this.save();
  }

  getCurrentLevel() {
    return this.data.currentLevel || 1;
  }

  getSettings() {
    return {
      sound: this.data.soundEnabled !== false,
      haptics: this.data.hapticsEnabled !== false
    };
  }

  setSetting(key, val) {
    if (key === 'sound') this.data.soundEnabled = val;
    if (key === 'haptics') this.data.hapticsEnabled = val;
    this.save();
  }

  resetAll() {
    this.data = {
      levels: {},
      highestUnlocked: 1,
      currentLevel: 1,
      soundEnabled: true,
      hapticsEnabled: true
    };
    this.save();
  }
}
