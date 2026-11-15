import { TILE_TYPES } from './tiles.js';

export const DIRECTIONS = {
  UP: { x: 0, y: -1, name: 'UP' },
  DOWN: { x: 0, y: 1, name: 'DOWN' },
  LEFT: { x: -1, y: 0, name: 'LEFT' },
  RIGHT: { x: 1, y: 0, name: 'RIGHT' }
};

export function calculateSlide(grid, width, height, startX, startY, dir, currentKeysHeld, collectedKeysSet, unlockedDoorsSet) {
  let x = startX;
  let y = startY;
  let keysHeld = currentKeysHeld;
  const path = [];
  const newlyCollectedKeys = [];
  const newlyUnlockedDoors = [];
  let reachedExit = false;

  while (true) {
    const nextX = x + dir.x;
    const nextY = y + dir.y;

    // 1. Boundary check
    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
      break;
    }

    const tile = grid[nextY][nextX];
    const coord = `${nextX},${nextY}`;

    // 2. Wall obstacle check
    if (tile === TILE_TYPES.WALL) {
      break;
    }

    // 3. Locked door check
    if (tile === TILE_TYPES.DOOR) {
      const isAlreadyUnlocked = unlockedDoorsSet.has(coord) || newlyUnlockedDoors.includes(coord);
      if (!isAlreadyUnlocked) {
        if (keysHeld > 0) {
          keysHeld--;
          newlyUnlockedDoors.push(coord);
        } else {
          // Blocked by locked door without a key
          break;
        }
      }
    }

    // Move to next cell
    x = nextX;
    y = nextY;

    // 4. Key collection check
    let keyCollected = false;
    if (tile === TILE_TYPES.KEY) {
      const isAlreadyCollected = collectedKeysSet.has(coord) || newlyCollectedKeys.includes(coord);
      if (!isAlreadyCollected) {
        keysHeld++;
        newlyCollectedKeys.push(coord);
        keyCollected = true;
      }
    }

    const doorUnlocked = newlyUnlockedDoors.includes(coord);

    path.push({
      x,
      y,
      coord,
      keyCollected,
      doorUnlocked
    });

    // 5. Exit detection
    if (tile === TILE_TYPES.EXIT) {
      reachedExit = true;
      break;
    }
  }

  return {
    moved: path.length > 0,
    endX: x,
    endY: y,
    path,
    reachedExit,
    newlyCollectedKeys,
    newlyUnlockedDoors,
    finalKeysHeld: keysHeld
  };
}
