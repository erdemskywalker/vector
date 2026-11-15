import { DIRECTIONS, calculateSlide } from '../engine/movement.js';

export class LevelSolver {
  /**
   * Solves a level using BFS to find the shortest swipe sequence with Cores, Hazards, and Cracked Walls.
   * @param {Object} parsedLevel - Level object from LevelParser
   * @param {number} maxStates - Guard against unbounded searches
   * @returns {{ solved: boolean, moves: number, path: string[], error?: string }}
   */
  static solve(parsedLevel, maxStates = 120000) {
    const { width, height, grid, start } = parsedLevel;

    // Index all cores and cracked walls for bitmask encoding
    const coreCoords = [];
    const crackedCoords = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === 'K') coreCoords.push(`${x},${y}`);
        if (grid[y][x] === 'C') crackedCoords.push(`${x},${y}`);
      }
    }

    const totalCores = coreCoords.length;

    const queue = [];
    const visited = new Set();

    const initialCollected = parsedLevel.collectedCores ? new Set(parsedLevel.collectedCores) : new Set();
    const initialBroken = parsedLevel.brokenCracked ? new Set(parsedLevel.brokenCracked) : new Set();

    const initialState = {
      x: start.x,
      y: start.y,
      collectedCores: initialCollected,
      brokenCracked: initialBroken,
      path: []
    };

    let startCoreMask = 0;
    coreCoords.forEach((c, idx) => {
      if (initialCollected.has(c)) startCoreMask |= (1 << idx);
    });

    let startCrackedMask = 0;
    crackedCoords.forEach((c, idx) => {
      if (initialBroken.has(c)) startCrackedMask |= (1 << idx);
    });

    visited.add(`${start.x},${start.y}|${startCoreMask}|${startCrackedMask}`);
    queue.push(initialState);

    let statesChecked = 0;

    while (queue.length > 0) {
      statesChecked++;
      if (statesChecked > maxStates) {
        return {
          solved: false,
          moves: -1,
          path: [],
          error: `Exceeded state limit of ${maxStates}`
        };
      }

      const current = queue.shift();

      for (const dirKey of ['UP', 'RIGHT', 'DOWN', 'LEFT']) {
        const dir = DIRECTIONS[dirKey];

        const result = calculateSlide(
          grid,
          width,
          height,
          current.x,
          current.y,
          dir,
          totalCores,
          current.collectedCores,
          current.brokenCracked
        );

        if (!result.moved || result.hitHazard) {
          continue; // Blocked or dead on hazard
        }

        const newPath = [...current.path, dirKey];

        if (result.reachedExit) {
          return {
            solved: true,
            moves: newPath.length,
            path: newPath
          };
        }

        const nextCollected = new Set(current.collectedCores);
        result.newlyCollectedCores.forEach(c => nextCollected.add(c));

        const nextBroken = new Set(current.brokenCracked);
        result.newlyBrokenCracked.forEach(c => nextBroken.add(c));

        let cMask = 0;
        coreCoords.forEach((c, idx) => {
          if (nextCollected.has(c)) cMask |= (1 << idx);
        });

        let crkMask = 0;
        crackedCoords.forEach((c, idx) => {
          if (nextBroken.has(c)) crkMask |= (1 << idx);
        });

        const stateHash = `${result.endX},${result.endY}|${cMask}|${crkMask}`;

        if (!visited.has(stateHash)) {
          visited.add(stateHash);
          queue.push({
            x: result.endX,
            y: result.endY,
            collectedCores: nextCollected,
            brokenCracked: nextBroken,
            path: newPath
          });
        }
      }
    }

    return {
      solved: false,
      moves: -1,
      path: [],
      error: 'No valid path found to activate cores and reach exit.'
    };
  }
}
