import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import Solver
import { LevelSolver } from '../js/levels/level-solver.js';

function Mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateVerifiedLevel(
  id,
  world,
  name,
  width,
  height,
  minTargetPar,
  maxTargetPar,
  config = {},
  seed = 50000
) {
  const { numCores = 0, numCracked = 0, numHazards = 0, maxMoves = null } = config;
  const rng = Mulberry32(seed + id * 137);

  for (let attempt = 0; attempt < 5000; attempt++) {
    // 1. Create boundary grid
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

    // 2. Interior Walls
    const wallDensity = 0.15 + rng() * 0.12;
    const innerWallsCount = Math.floor(width * height * wallDensity);
    for (let i = 0; i < innerWallsCount; i++) {
      const wx = 1 + Math.floor(rng() * (width - 2));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // 3. Cracked Walls (C)
    for (let i = 0; i < numCracked; i++) {
      const cx = 1 + Math.floor(rng() * (width - 2));
      const cy = 1 + Math.floor(rng() * (height - 2));
      if (grid[cy][cx] === '.') grid[cy][cx] = 'C';
    }

    // 4. Hazards (X)
    for (let i = 0; i < numHazards; i++) {
      const hx = 1 + Math.floor(rng() * (width - 2));
      const hy = 1 + Math.floor(rng() * (height - 2));
      if (grid[hy][hx] === '.') grid[hy][hx] = 'X';
    }

    // 5. Open Cells for Start, Exit, Cores
    const openCells = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === '.') {
          openCells.push({ x, y });
        }
      }
    }

    if (openCells.length < 5 + numCores) continue;

    // Place Start
    const sIdx = Math.floor(rng() * openCells.length);
    const start = openCells.splice(sIdx, 1)[0];
    grid[start.y][start.x] = 'S';

    // Place Exit (distance maximized)
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

    // Place Energy Cores (K)
    for (let k = 0; k < numCores; k++) {
      if (openCells.length === 0) break;
      const kIdx = Math.floor(rng() * openCells.length);
      const kCell = openCells.splice(kIdx, 1)[0];
      grid[kCell.y][kCell.x] = 'K';
    }

    const gridStrings = grid.map(r => r.join(''));
    const parsed = {
      width,
      height,
      grid: gridStrings,
      start,
      exit
    };

    const sol = LevelSolver.solve(parsed);

    if (sol && sol.solved) {
      if (sol.moves >= minTargetPar && sol.moves <= maxTargetPar) {
        // If maxMoves is specified, ensure sol.moves <= maxMoves
        if (maxMoves !== null && sol.moves > maxMoves) continue;

        return {
          id,
          world,
          name,
          width,
          height,
          par: sol.moves,
          maxMoves: maxMoves,
          grid: gridStrings,
          solution: sol
        };
      }
    }
  }

  throw new Error(`Failed to generate valid level ${id} with target par ${minTargetPar}-${maxTargetPar}`);
}

const WORLD1_NAMES = [
  "First Steps", "The Turn", "Corridor", "Pivot", "Crossroad",
  "Fracture I", "Fracture II", "Deflection", "Rebound", "Square Loop",
  "Laser Hazard", "Grid Matrix", "The Blockade", "Reflex", "Echo",
  "Diamond Core", "Shift", "Labyrinth", "Pinball", "Pulse Hazard",
  "Symmetry", "Kinetic Shock", "Centrifuge", "Vector Shift", "Gridlock",
  "Paradox", "Quantum Trap", "Continuum", "Vortex", "The Citadel"
];

const WORLD2_NAMES = [
  "Core Activation", "Dual Resonance", "Keyhole Matrix", "Cipher Core", "Access Port",
  "Vault Lock", "Detour", "Checkpoint X", "Perimeter", "Iron Hazard",
  "Redirection", "Core Ring", "Infiltration", "Firewall X", "Deadbolt",
  "Twin Core Alpha", "Binary Hazard", "Dual Core Beta", "Bastion", "Sanction",
  "Cryptography", "Sequencer", "Overload Trap", "Fortress", "Obsidian Core",
  "Matrix Hazard", "Singularity", "Enigma Gate", "Apex Vector", "Vector Prime"
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
    let w = 7, h = 7;
    let minPar = 3, maxPar = 4;
    let config = { numCores: 0, numCracked: 0, numHazards: 0, maxMoves: null };

    if (id <= 5) {
      // 1-5: Introductory, no limits, pure sliding
      w = 6; h = 6; minPar = 2; maxPar = 3;
    } else if (id <= 10) {
      // 6-10: Introduce Cracked Wall, no limits
      w = 7; h = 7; minPar = 3; maxPar = 4;
      config.numCracked = 1;
    } else if (id <= 20) {
      // 11-20: Introduce Hazard laser (X), dynamic limit (par + 4)
      w = 7; h = 7; minPar = 4; maxPar = 5;
      config.numCracked = 1;
      config.numHazards = 1;
      config.maxMoves = minPar + 4; // Will adjust after par known
    } else {
      // 21-30: Advanced labyrinth with Cracked walls, hazards, tighter limit (par + 3)
      w = 8; h = 8; minPar = 5; maxPar = 7;
      config.numCracked = 2;
      config.numHazards = 2;
    }

    const level = generateVerifiedLevel(id, 'origin', name, w, h, minPar, maxPar, config, 10000 + id * 53);

    // Compute exact dynamic maxMoves
    if (id <= 10) {
      level.maxMoves = null;
    } else if (id <= 20) {
      level.maxMoves = level.par + 4;
    } else {
      level.maxMoves = level.par + 3;
    }

    console.log(`[World 1] Level ${String(id).padStart(2, '0')} "${name}": Par ${level.par} | MaxMoves: ${level.maxMoves || '∞'} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(originDir, `level-${String(id).padStart(3, '0')}.json`);
    const fileObj = {
      id: level.id,
      world: level.world,
      name: level.name,
      width: level.width,
      height: level.height,
      par: level.par,
      maxMoves: level.maxMoves,
      grid: level.grid
    };
    fs.writeFileSync(jsonPath, JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
  }

  console.log('\n=== GENERATING WORLD 02: CORES (Levels 31 to 60) ===');
  for (let i = 0; i < 30; i++) {
    const id = 31 + i;
    const name = WORLD2_NAMES[i];
    let w = 8, h = 8;
    let minPar = 4, maxPar = 6;
    let config = { numCores: 1, numCracked: 1, numHazards: 1, maxMoves: null };

    if (id <= 45) {
      // 31-45: 1 Core, 1 Hazard, 1 Cracked wall, maxMoves = par + 3
      w = 8; h = 8; minPar = 4; maxPar = 6;
      config.numCores = 1;
      config.numHazards = 1;
      config.numCracked = 1;
    } else if (id <= 55) {
      // 46-55: 2 Cores, 2 Hazards, 2 Cracked walls, maxMoves = par + 3
      w = 9; h = 9; minPar = 5; maxPar = 7;
      config.numCores = 2;
      config.numHazards = 2;
      config.numCracked = 2;
    } else {
      // 56-60: Grand Finale, 2-3 Cores, tight maxMoves = par + 2
      w = 9; h = 9; minPar = 6; maxPar = 8;
      config.numCores = 2;
      config.numHazards = 2;
      config.numCracked = 2;
    }

    const level = generateVerifiedLevel(id, 'keys', name, w, h, minPar, maxPar, config, 60000 + id * 61);

    if (id <= 55) {
      level.maxMoves = level.par + 3;
    } else {
      level.maxMoves = level.par + 2;
    }

    console.log(`[World 2] Level ${String(id).padStart(2, '0')} "${name}": Par ${level.par} | MaxMoves: ${level.maxMoves} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(keysDir, `level-${String(id).padStart(3, '0')}.json`);
    const fileObj = {
      id: level.id,
      world: level.world,
      name: level.name,
      width: level.width,
      height: level.height,
      par: level.par,
      maxMoves: level.maxMoves,
      grid: level.grid
    };
    fs.writeFileSync(jsonPath, JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
  }

  // Pre-compiled bundle
  const bundlePath = path.join(rootDir, 'js', 'levels', 'level-data.js');
  const bundleContent = `/**
 * Pre-compiled & Validated 60 Levels Bundle for 100% Offline / WebView / Browser Support
 */
export const BUNDLED_LEVELS = ${JSON.stringify(allLevelsBundle, null, 2)};
`;
  fs.writeFileSync(bundlePath, bundleContent);
  console.log(`\nSuccessfully generated, BFS-verified, and saved all 60 levels!`);
}

generateAllLevels();
