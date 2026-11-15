import { LevelParser } from './level-parser.js';
import { BUNDLED_LEVELS } from './level-data.js';

export class LevelManager {
  constructor() {
    this.cache = new Map();
    // Pre-populate with bundled levels for immediate offline availability
    if (Array.isArray(BUNDLED_LEVELS)) {
      BUNDLED_LEVELS.forEach(lvl => {
        try {
          const parsed = LevelParser.parse(lvl);
          this.cache.set(lvl.id, parsed);
        } catch (e) {
          console.error(`Error parsing bundled level ${lvl.id}:`, e);
        }
      });
    }
  }

  async getLevel(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const world = id <= 30 ? 'origin' : id <= 60 ? 'keys' : id <= 90 ? 'quantum' : 'nexus';
    const filename = `level-${String(id).padStart(3, '0')}.json`;
    const url = `levels/${world}/${filename}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading ${url}`);
      }
      const raw = await response.json();
      const parsed = LevelParser.parse(raw);
      this.cache.set(id, parsed);
      return parsed;
    } catch (err) {
      console.warn(`Fetch failed for ${url}, falling back to bundled data:`, err);
      // Fallback
      const fallback = BUNDLED_LEVELS.find(l => l.id === id);
      if (fallback) {
        const parsed = LevelParser.parse(fallback);
        this.cache.set(id, parsed);
        return parsed;
      }
      throw new Error(`Could not load level ${id}`);
    }
  }

  getWorldList(worldName = 'origin') {
    const list = [];
    let minId = 1, maxId = 30;

    if (worldName === 'keys') {
      minId = 31;
      maxId = 60;
    } else if (worldName === 'quantum') {
      minId = 61;
      maxId = 90;
    } else if (worldName === 'nexus') {
      minId = 91;
      maxId = 120;
    }

    for (let id = minId; id <= maxId; id++) {
      const cached = this.cache.get(id);
      if (cached) {
        list.push({
          id: cached.id,
          name: cached.name,
          par: cached.par,
          world: cached.world
        });
      } else {
        list.push({
          id: id,
          name: `Level ${id}`,
          par: 4,
          world: worldName
        });
      }
    }
    return list;
  }

  getTotalLevels() {
    return 120;
  }
}
