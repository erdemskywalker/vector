import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DIRS = [
  { name: 'UP', x: 0, y: -1 },
  { name: 'RIGHT', x: 1, y: 0 },
  { name: 'DOWN', x: 0, y: 1 },
  { name: 'LEFT', x: -1, y: 0 }
];

function solveLevel(grid) {
  const height = grid.length;
  const width = grid[0].length;

  let start = null;
  let exit = null;
  const keys = [];
  const doors = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = grid[y][x];
      if (char === 'S') start = { x, y };
      if (char === 'E') exit = { x, y };
      if (char === 'K') keys.push(`${x},${y}`);
      if (char === 'D') doors.push(`${x},${y}`);
    }
  }

  if (!start || !exit) return null;

  const queue = [{
    x: start.x,
    y: start.y,
    keysHeld: 0,
    collected: new Set(),
    unlocked: new Set(),
    path: []
  }];

  const visited = new Set();
  visited.add(`${start.x},${start.y}|0|0`);

  let iterations = 0;
  while (queue.length > 0) {
    iterations++;
    if (iterations > 80000) break;

    const cur = queue.shift();

    for (const dir of DIRS) {
      let x = cur.x;
      let y = cur.y;
      let keysHeld = cur.keysHeld;
      const newlyCollected = [];
      const newlyUnlocked = [];
      let reachedExit = false;
      let steps = 0;

      while (true) {
        const nx = x + dir.x;
        const ny = y + dir.y;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) break;
        const tile = grid[ny][nx];
        if (tile === '#') break;

        const coord = `${nx},${ny}`;
        if (tile === 'D') {
          const isUnlocked = cur.unlocked.has(coord) || newlyUnlocked.includes(coord);
          if (!isUnlocked) {
            if (keysHeld > 0) {
              keysHeld--;
              newlyUnlocked.push(coord);
            } else {
              break; // blocked
            }
          }
        }

        x = nx;
        y = ny;
        steps++;

        if (tile === 'K') {
          const isCollected = cur.collected.has(coord) || newlyCollected.includes(coord);
          if (!isCollected) {
            keysHeld++;
            newlyCollected.push(coord);
          }
        }

        if (tile === 'E') {
          reachedExit = true;
          break;
        }
      }

      if (steps > 0) {
        const newPath = [...cur.path, dir.name];
        if (reachedExit) {
          return {
            solved: true,
            moves: newPath.length,
            path: newPath
          };
        }

        const nextCollected = new Set(cur.collected);
        newlyCollected.forEach(k => nextCollected.add(k));

        const nextUnlocked = new Set(cur.unlocked);
        newlyUnlocked.forEach(d => nextUnlocked.add(d));

        let kMask = 0;
        keys.forEach((k, idx) => {
          if (nextCollected.has(k)) kMask |= (1 << idx);
        });

        let dMask = 0;
        doors.forEach((d, idx) => {
          if (nextUnlocked.has(d)) dMask |= (1 << idx);
        });

        const stateHash = `${x},${y}|${kMask}|${dMask}`;
        if (!visited.has(stateHash)) {
          visited.add(stateHash);
          queue.push({
            x,
            y,
            keysHeld,
            collected: nextCollected,
            unlocked: nextUnlocked,
            path: newPath
          });
        }
      }
    }
  }

  return null;
}

// Pseudo-random number generator with seed
function Mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateVerifiedLevel(id, world, name, width, height, minTargetPar, maxTargetPar, hasKeys = false, numKeys = 1, seed = 12345) {
  const rng = Mulberry32(seed + id * 100);

  for (let attempt = 0; attempt < 3000; attempt++) {
    // 1. Create clean grid with border walls
    const grid = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          row.push('#');
        } else {
          row.push('.');
        }
      }
      grid.push(row);
    }

    // 2. Add random interior walls
    const innerWallsCount = Math.floor(width * height * (0.16 + rng() * 0.12));
    for (let i = 0; i < innerWallsCount; i++) {
      const wx = 1 + Math.floor(rng() * (width - 2));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // 3. Find open cells for Start, Exit, Keys, Doors
    const openCells = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === '.') {
          openCells.push({ x, y });
        }
      }
    }

    if (openCells.length < 10) continue;

    // Pick Start
    const sIdx = Math.floor(rng() * openCells.length);
    const start = openCells.splice(sIdx, 1)[0];
    grid[start.y][start.x] = 'S';

    // Pick Exit (far from start)
    let bestExitIdx = -1;
    let maxDist = -1;
    for (let i = 0; i < openCells.length; i++) {
      const dist = Math.abs(openCells[i].x - start.x) + Math.abs(openCells[i].y - start.y);
      if (dist > maxDist) {
        maxDist = dist;
        bestExitIdx = i;
      }
    }
    const exit = openCells.splice(bestExitIdx, 1)[0];
    grid[exit.y][exit.x] = 'E';

    // World 2: Keys and Doors
    if (hasKeys) {
      const keysPlaced = [];
      for (let k = 0; k < numKeys; k++) {
        if (openCells.length === 0) break;
        const kIdx = Math.floor(rng() * openCells.length);
        const kCell = openCells.splice(kIdx, 1)[0];
        grid[kCell.y][kCell.x] = 'K';
        keysPlaced.push(kCell);
      }

      for (let d = 0; d < numKeys; d++) {
        if (openCells.length === 0) break;
        // Prefer placing door near exit or middle
        const dIdx = Math.floor(rng() * openCells.length);
        const dCell = openCells.splice(dIdx, 1)[0];
        grid[dCell.y][dCell.x] = 'D';
      }
    }

    const gridStrings = grid.map(r => r.join(''));
    const sol = solveLevel(gridStrings);

    if (sol && sol.solved) {
      if (sol.moves >= minTargetPar && sol.moves <= maxTargetPar) {
        return {
          id,
          world,
          name,
          width,
          height,
          par: sol.moves,
          grid: gridStrings,
          solution: sol
        };
      }
    }
  }

  // Fallback template if procedural loop didn't find within range
  throw new Error(`Failed to generate level ${id} with target par ${minTargetPar}-${maxTargetPar}`);
}

const WORLD1_NAMES = [
  "First Steps", "The Turn", "Corridor", "Pivot", "Crossroad",
  "Angle", "Zigzag", "Deflection", "Rebound", "Square Loop",
  "Orbit", "Precision", "The Blockade", "Reflex", "Echo",
  "Diamond", "Shift", "Labyrinth", "Pinball", "Pulse",
  "Symmetry", "Kinetic", "Centrifuge", "Vector Shift", "Gridlock",
  "Paradox", "Quantum", "Continuum", "Vortex", "The Citadel"
];

const WORLD2_NAMES = [
  "First Lock", "The Barrier", "Keyhole", "Cipher", "Access Port",
  "Vault", "Detour", "Checkpoint", "Perimeter", "Iron Gate",
  "Redirection", "Key Ring", "Infiltration", "Firewall", "Deadbolt",
  "Twin Lock", "Binary Gate", "Dual Core", "Bastion", "Sanction",
  "Cryptography", "Sequencer", "Overload", "Fortress", "Obsidian",
  "Matrix", "Singularity", "Enigma", "Apex", "Vector Prime"
];

function generateAllLevels() {
  const originDir = path.join(rootDir, 'levels', 'origin');
  const keysDir = path.join(rootDir, 'levels', 'keys');

  fs.mkdirSync(originDir, { recursive: true });
  fs.mkdirSync(keysDir, { recursive: true });

  const allLevelsBundle = [];

  console.log('=== GENERATING WORLD 01: ORIGIN (Levels 1 to 30) ===');
  for (let i = 0; i < 30; i++) {
    const id = i + 1;
    const name = WORLD1_NAMES[i];
    let w = 7;
    let h = 7;
    let minPar = 3;
    let maxPar = 4;

    if (id <= 5) {
      w = 6; h = 6; minPar = 2; maxPar = 3;
    } else if (id <= 15) {
      w = 7; h = 7; minPar = 4; maxPar = 5;
    } else if (id <= 25) {
      w = 8; h = 8; minPar = 5; maxPar = 7;
    } else {
      w = 9; h = 9; minPar = 6; maxPar = 8;
    }

    const level = generateVerifiedLevel(id, 'origin', name, w, h, minPar, maxPar, false, 0, 42000 + id * 37);
    console.log(`[World 1] Level ${String(id).padStart(2, '0')} "${name}": Par ${level.par} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(originDir, `level-${String(id).padStart(3, '0')}.json`);
    const fileObj = {
      id: level.id,
      world: level.world,
      name: level.name,
      width: level.width,
      height: level.height,
      par: level.par,
      grid: level.grid
    };
    fs.writeFileSync(jsonPath, JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
  }

  console.log('\n=== GENERATING WORLD 02: KEYS (Levels 31 to 60) ===');
  for (let i = 0; i < 30; i++) {
    const id = 31 + i;
    const name = WORLD2_NAMES[i];
    let w = 8;
    let h = 8;
    let numKeys = 1;
    let minPar = 4;
    let maxPar = 6;

    if (id <= 45) {
      w = 8; h = 8; numKeys = 1; minPar = 4; maxPar = 6;
    } else if (id <= 55) {
      w = 9; h = 9; numKeys = 1; minPar = 5; maxPar = 7;
    } else {
      w = 9; h = 9; numKeys = 2; minPar = 6; maxPar = 9;
    }

    const level = generateVerifiedLevel(id, 'keys', name, w, h, minPar, maxPar, true, numKeys, 88000 + id * 43);
    console.log(`[World 2] Level ${String(id).padStart(2, '0')} "${name}": Par ${level.par} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(keysDir, `level-${String(id).padStart(3, '0')}.json`);
    const fileObj = {
      id: level.id,
      world: level.world,
      name: level.name,
      width: level.width,
      height: level.height,
      par: level.par,
      grid: level.grid
    };
    fs.writeFileSync(jsonPath, JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
  }

  // Bundle file
  const bundlePath = path.join(rootDir, 'js', 'levels', 'level-data.js');
  const bundleContent = `/**
 * Pre-compiled & Validated 60 Levels Bundle for 100% Offline / WebView / Browser Support
 */
export const BUNDLED_LEVELS = ${JSON.stringify(allLevelsBundle, null, 2)};
`;
  fs.writeFileSync(bundlePath, bundleContent);
  console.log(`\nAll 60 levels successfully generated, 100% BFS-verified, and saved!`);
}

generateAllLevels();
