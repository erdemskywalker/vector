import { DIRECTIONS, calculateSlide } from '../engine/movement.js';

export class LevelSolver {
  /**
   * Solves a level using Breadth-First Search (BFS) to find the shortest swipe sequence.
   * @param {Object} parsedLevel - Level object from LevelParser
   * @param {number} maxStates - Guard against unbounded searches
   * @returns {{ solved: boolean, moves: number, path: string[], error?: string }}
   */
  static solve(parsedLevel, maxStates = 100000) {
    const { width, height, grid, start } = parsedLevel;

    // Index all keys and doors for bitmask encoding
    const keyCoords = [];
    const doorCoords = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === 'K') keyCoords.push(`${x},${y}`);
        if (grid[y][x] === 'D') doorCoords.push(`${x},${y}`);
      }
    }

    const queue = [];
    const visited = new Set();

    const initialState = {
      x: start.x,
      y: start.y,
      keysHeld: 0,
      collectedSet: new Set(),
      unlockedSet: new Set(),
      path: []
    };

    const initialKey = `${start.x},${start.y}|0|0`;
    visited.add(initialKey);
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
          current.keysHeld,
          current.collectedSet,
          current.unlockedSet
        );

        if (!result.moved) {
          continue; // Blocked immediately
        }

        const newPath = [...current.path, dirKey];

        // Did we reach exit?
        if (result.reachedExit) {
          return {
            solved: true,
            moves: newPath.length,
            path: newPath
          };
        }

        // Construct sets for the next state
        const nextCollected = new Set(current.collectedSet);
        result.newlyCollectedKeys.forEach(k => nextCollected.add(k));

        const nextUnlocked = new Set(current.unlockedSet);
        result.newlyUnlockedDoors.forEach(d => nextUnlocked.add(d));

        // Create bitmask hash for visited state
        let keyMask = 0;
        keyCoords.forEach((coord, idx) => {
          if (nextCollected.has(coord)) keyMask |= (1 << idx);
        });

        let doorMask = 0;
        doorCoords.forEach((coord, idx) => {
          if (nextUnlocked.has(coord)) doorMask |= (1 << idx);
        });

        const stateHash = `${result.endX},${result.endY}|${keyMask}|${doorMask}`;

        if (!visited.has(stateHash)) {
          visited.add(stateHash);
          queue.push({
            x: result.endX,
            y: result.endY,
            keysHeld: result.finalKeysHeld,
            collectedSet: nextCollected,
            unlockedSet: nextUnlocked,
            path: newPath
          });
        }
      }
    }

    return {
      solved: false,
      moves: -1,
      path: [],
      error: 'No solution path exists to reach the exit.'
    };
  }
}
