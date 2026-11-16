import { TILE_TYPES } from './tiles.js';

export const DIRECTIONS = {
  UP: { x: 0, y: -1, name: 'UP' },
  DOWN: { x: 0, y: 1, name: 'DOWN' },
  LEFT: { x: -1, y: 0, name: 'LEFT' },
  RIGHT: { x: 1, y: 0, name: 'RIGHT' }
};

export function buildPortalsMap(grid, width, height) {
  const teleports = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE_TYPES.TELEPORT) {
        teleports.push({ x, y });
      }
    }
  }

  const map = new Map();
  for (let i = 0; i < teleports.length - 1; i += 2) {
    const a = teleports[i];
    const b = teleports[i + 1];
    map.set(`${a.x},${a.y}`, { x: b.x, y: b.y });
    map.set(`${b.x},${b.y}`, { x: a.x, y: a.y });
  }
  return map;
}

export function calculateSlide(
  grid,
  width,
  height,
  startX,
  startY,
  dir,
  totalCores = 0,
  collectedCoresSet = new Set(),
  brokenCrackedSet = new Set(),
  portalsMap = null,
  initialGatesOpen = false
) {
  let x = startX;
  let y = startY;
  const path = [];
  const newlyCollectedCores = [];
  const newlyBrokenCracked = [];
  let reachedExit = false;
  let hitHazard = false;
  let portalBecameActive = false;
  let currentGatesOpen = initialGatesOpen;
  let teleportHops = 0;
  let portalsUsedCount = 0;
  let switchesUsedCount = 0;
  let gatesPassedCount = 0;

  // Resolve portals map if not provided
  const activePortals = portalsMap || buildPortalsMap(grid, width, height);
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

    // 3. Laser Forcefield Gate check (Closed = Solid obstacle)
    if (tile === TILE_TYPES.GATE) {
      if (!currentGatesOpen) {
        break;
      }
      gatesPassedCount++;
    }

    // 4. Cracked wall check
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

    // 5. Hazard contact check
    if (tile === TILE_TYPES.HAZARD) {
      hitHazard = true;
      path.push({
        x,
        y,
        coord,
        hitHazard: true,
        coreCollected: false,
        reachedExit: false,
        isSwitch: false,
        gatesOpen: currentGatesOpen
      });
      break;
    }

    // 6. Energy Core collection check
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

    // 7. Pressure Switch check (Toggles laser forcefield gates)
    let switchToggled = false;
    if (tile === TILE_TYPES.SWITCH) {
      currentGatesOpen = !currentGatesOpen;
      switchToggled = true;
      switchesUsedCount++;
    }

    // 8. Exit Portal check
    let reached = false;
    if (tile === TILE_TYPES.EXIT) {
      const isPortalActive = (currentCoresCount + newlyCollectedCores.length >= totalCores);
      if (isPortalActive) {
        reached = true;
        reachedExit = true;
      }
    }

    // 9. Quantum Warp Portal check (Preserves momentum!)
    let warpDestination = null;
    if (tile === TILE_TYPES.TELEPORT && activePortals.has(coord) && teleportHops < 8) {
      warpDestination = activePortals.get(coord);
      teleportHops++;
      portalsUsedCount++;
    }

    path.push({
      x,
      y,
      coord,
      coreCollected,
      hitHazard: false,
      reachedExit: reached,
      isSwitch: switchToggled,
      gatesOpen: currentGatesOpen,
      isPortalEnter: warpDestination !== null
    });

    if (reached) {
      break; // Exit reached!
    }

    // Teleportation execution: Jump to paired portal and continue in same direction
    if (warpDestination) {
      x = warpDestination.x;
      y = warpDestination.y;
      path.push({
        x,
        y,
        coord: `${x},${y}`,
        coreCollected: false,
        hitHazard: false,
        reachedExit: false,
        isSwitch: false,
        gatesOpen: currentGatesOpen,
        isPortalExit: true
      });
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
    newlyBrokenCracked,
    finalGatesOpen: currentGatesOpen,
    portalsUsedCount,
    switchesUsedCount,
    gatesPassedCount
  };
}
