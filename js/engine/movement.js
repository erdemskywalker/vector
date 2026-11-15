import { TILE_TYPES } from './tiles.js';

export const DIRECTIONS = {
  UP: { x: 0, y: -1, name: 'UP' },
  DOWN: { x: 0, y: 1, name: 'DOWN' },
  LEFT: { x: -1, y: 0, name: 'LEFT' },
  RIGHT: { x: 1, y: 0, name: 'RIGHT' }
};

export function calculateSlide(
  grid,
  width,
  height,
  startX,
  startY,
  dir,
  totalCores = 0,
  collectedCoresSet = new Set(),
  brokenCrackedSet = new Set()
) {
  let x = startX;
  let y = startY;
  const path = [];
  const newlyCollectedCores = [];
  const newlyBrokenCracked = [];
  let reachedExit = false;
  let hitHazard = false;
  let portalBecameActive = false;

  const currentCoresCount = collectedCoresSet.size;

  while (true) {
    const nextX = x + dir.x;
    const nextY = y + dir.y;

    // 1. Boundary check
    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
      break;
    }

    const tile = grid[nextY][nextX];
    const coord = `${nextX},${nextY}`;

    // 2. Solid wall check
    if (tile === TILE_TYPES.WALL) {
      break;
    }

    // 3. Cracked wall check
    if (tile === TILE_TYPES.CRACKED) {
      const isAlreadyBroken = brokenCrackedSet.has(coord) || newlyBrokenCracked.includes(coord);
      if (!isAlreadyBroken) {
        // Blocks cube, but will shatter upon impact
        newlyBrokenCracked.push(coord);
        break;
      }
      // If already broken, passes right through
    }

    // Advance to cell
    x = nextX;
    y = nextY;

    // 4. Hazard contact check
    if (tile === TILE_TYPES.HAZARD) {
      hitHazard = true;
      path.push({
        x,
        y,
        coord,
        hitHazard: true,
        coreCollected: false,
        reachedExit: false
      });
      break;
    }

    // 5. Energy Core collection check
    let coreCollected = false;
    if (tile === TILE_TYPES.CORE) {
      const isAlreadyCollected = collectedCoresSet.has(coord) || newlyCollectedCores.includes(coord);
      if (!isAlreadyCollected) {
        newlyCollectedCores.push(coord);
        coreCollected = true;
        if (currentCoresCount + newlyCollectedCores.length >= totalCores) {
          portalBecameActive = true;
        }
      }
    }

    // 6. Exit Portal check
    let reached = false;
    if (tile === TILE_TYPES.EXIT) {
      const isPortalActive = (currentCoresCount + newlyCollectedCores.length >= totalCores);
      if (isPortalActive) {
        reached = true;
        reachedExit = true;
      }
      // If portal not active yet, cube slides straight through!
    }

    path.push({
      x,
      y,
      coord,
      coreCollected,
      hitHazard: false,
      reachedExit: reached
    });

    if (reached) {
      break; // Exit caught the player; level completed!
    }
  }

  return {
    moved: path.length > 0,
    endX: x,
    endY: y,
    path,
    reachedExit,
    hitHazard,
    portalBecameActive,
    newlyCollectedCores,
    newlyBrokenCracked
  };
}
