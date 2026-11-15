import { TILE_TYPES } from '../engine/tiles.js';

export class LevelParser {
  static parse(rawJson) {
    if (!rawJson) {
      throw new Error('Level JSON is null or empty');
    }

    const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

    if (!data.id || !data.grid || !Array.isArray(data.grid)) {
      throw new Error('Invalid level data format: missing id or grid array');
    }

    const height = data.grid.length;
    const width = data.grid[0].length;

    for (let r = 0; r < height; r++) {
      if (data.grid[r].length !== width) {
        throw new Error(`Inconsistent row length at row ${r}`);
      }
    }

    let startCount = 0;
    let exitCount = 0;
    let startPos = null;
    let exitPos = null;
    const cores = [];
    const cracked = [];
    const hazards = [];

    const allowed = new Set(Object.values(TILE_TYPES));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = data.grid[y][x];
        if (!allowed.has(char)) {
          throw new Error(`Unknown tile character '${char}' at (${x}, ${y})`);
        }

        if (char === TILE_TYPES.START) {
          startCount++;
          startPos = { x, y };
        } else if (char === TILE_TYPES.EXIT) {
          exitCount++;
          exitPos = { x, y };
        } else if (char === TILE_TYPES.CORE) {
          cores.push({ x, y });
        } else if (char === TILE_TYPES.CRACKED) {
          cracked.push({ x, y });
        } else if (char === TILE_TYPES.HAZARD) {
          hazards.push({ x, y });
        }
      }
    }

    if (startCount !== 1) {
      throw new Error(`Level must contain exactly one Start ('S'), found ${startCount}`);
    }
    if (exitCount !== 1) {
      throw new Error(`Level must contain exactly one Exit ('E'), found ${exitCount}`);
    }

    return {
      id: data.id,
      world: data.world || (data.id <= 30 ? 'origin' : 'keys'),
      name: data.name || `Level ${data.id}`,
      width: width,
      height: height,
      par: data.par || 4,
      maxMoves: data.maxMoves !== undefined ? data.maxMoves : null,
      grid: data.grid,
      start: startPos,
      exit: exitPos,
      cores: cores,
      cracked: cracked,
      hazards: hazards
    };
  }
}
