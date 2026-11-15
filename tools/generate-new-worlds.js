import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import Solver and Existing Bundled Levels
import { LevelSolver } from '../js/levels/level-solver.js';
import { BUNDLED_LEVELS } from '../js/levels/level-data.js';

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
  seed = 70000
) {
  const {
    numCores = 0,
    numCracked = 0,
    numHazards = 0,
    numPortals = 0,
    numSwitches = 0,
    numGates = 0,
    maxMoves = null
  } = config;

  const rng = Mulberry32(seed + id * 193);

  for (let attempt = 0; attempt < 8000; attempt++) {
    // 1. Boundary Grid
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

    // 2. Interior Walls (Density tuned for larger 11x11 to 14x14 grids)
    const wallDensity = 0.17 + rng() * 0.08;
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

    // 5. Open Cells Candidates
    const openCells = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === '.') {
          openCells.push({ x, y });
        }
      }
    }

    const requiredCells = 5 + numCores + numPortals + numSwitches + numGates;
    if (openCells.length < requiredCells) continue;

    // Place Start
    const sIdx = Math.floor(rng() * openCells.length);
    const start = openCells.splice(sIdx, 1)[0];
    grid[start.y][start.x] = 'S';

    // Place Exit (maximum distance from Start)
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

    // Place Quantum Warp Portals (T) in pairs
    for (let p = 0; p < numPortals; p++) {
      if (openCells.length === 0) break;
      const pIdx = Math.floor(rng() * openCells.length);
      const cell = openCells.splice(pIdx, 1)[0];
      grid[cell.y][cell.x] = 'T';
    }

    // Place Laser Forcefield Gates (G)
    for (let g = 0; g < numGates; g++) {
      if (openCells.length === 0) break;
      const gIdx = Math.floor(rng() * openCells.length);
      const cell = openCells.splice(gIdx, 1)[0];
      grid[cell.y][cell.x] = 'G';
    }

    // Place Logic Pressure Switches (P)
    for (let s = 0; s < numSwitches; s++) {
      if (openCells.length === 0) break;
      const sIdx = Math.floor(rng() * openCells.length);
      const cell = openCells.splice(sIdx, 1)[0];
      grid[cell.y][cell.x] = 'P';
    }

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

const WORLD3_NAMES = [
  "Warp Initiator", "Folding Space", "Tesseract Drift", "Entanglement I", "Phase Shift",
  "Quantum Leap", "Singularity Gate", "Cosmic String", "Subspace Tunnel", "Event Horizon",
  "Chrono Loop", "Wormhole Matrix", "Flux Core", "Photon Cascade", "Antimatter Corridor",
  "Gravitational Lens", "Hyperplane", "Dark Matter Nexus", "Superposition", "Null Vector",
  "Planck Wall", "Quantum Echo", "Dual Horizon", "Tachyon Burst", "Dimensional Rift",
  "Parallel Axis", "Vortex Chamber", "Relativistic Slip", "Quantum Labyrinth", "Apex Singularity"
];

const WORLD4_NAMES = [
  "Protocol Initiate", "Logic Cascade", "Firewall Relay", "Binary Gate", "Cipher Terminal",
  "Grid Override", "Cyber Synapse", "Quantum Keyhole", "Circuit Breaker", "Laser Matrix",
  "Neural Relay", "Security Protocol", "Data Fortress", "Switchboard Alpha", "Optic Barrier",
  "Mainframe Core", "Root Access", "Hyperthreading", "Encryption Layer", "Zero-Day Trap",
  "Subroutine Nexus", "Kernel Panic", "Logic Fortress", "Overdrive Protocol", "Entropy Gate",
  "Master Control", "Quantum Firewall", "Neural Convergence", "Apex Protocol", "Vector Transcendence"
];

function run() {
  const quantumDir = path.join(rootDir, 'levels', 'quantum');
  const nexusDir = path.join(rootDir, 'levels', 'nexus');

  fs.mkdirSync(quantumDir, { recursive: true });
  fs.mkdirSync(nexusDir, { recursive: true });

  // Start with existing 60 levels
  const allLevelsBundle = [...BUNDLED_LEVELS];

  console.log(`Retained ${allLevelsBundle.length} existing levels (Worlds 1 & 2).`);

  console.log('\n=== GENERATING WORLD 03: QUANTUM WARP (Levels 61 to 90) ===');
  for (let i = 0; i < 30; i++) {
    const id = 61 + i;
    const name = WORLD3_NAMES[i];
    let w = 11, h = 11;
    let minPar = 5, maxPar = 8;
    let config = {
      numCores: 1,
      numCracked: 1,
      numHazards: 1,
      numPortals: 2,
      numSwitches: 0,
      numGates: 0
    };

    if (id <= 70) {
      // 61-70: 11x11, 1 pair portals, 1 core, 1 cracked, 1 hazard
      w = 11; h = 11; minPar = 5; maxPar = 7;
      config.numCores = 1;
      config.numHazards = 1;
      config.numCracked = 1;
    } else if (id <= 80) {
      // 71-80: 11x11 / 12x12, 1 pair portals, 2 cores, 2 cracked, 2 hazards
      w = 11; h = 11; minPar = 6; maxPar = 8;
      config.numCores = 2;
      config.numHazards = 2;
      config.numCracked = 2;
    } else {
      // 81-90: 12x12, 1-2 pairs portals, 2-3 cores, 2 cracked, 2 hazards
      w = 12; h = 12; minPar = 6; maxPar = 9;
      config.numPortals = id >= 86 ? 4 : 2;
      config.numCores = 2;
      config.numHazards = 2;
      config.numCracked = 2;
    }

    const level = generateVerifiedLevel(id, 'quantum', name, w, h, minPar, maxPar, config, 80000 + id * 79);

    if (id >= 88) {
      level.maxMoves = level.par + 1; // Boss tight limit
    } else {
      level.maxMoves = level.par + 2; // Dynamic hard limit
    }

    console.log(`[World 3] Level ${String(id).padStart(3, '0')} "${name}": Par ${level.par} | MaxMoves: ${level.maxMoves} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(quantumDir, `level-${String(id).padStart(3, '0')}.json`);
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

  console.log('\n=== GENERATING WORLD 04: PROTOCOL NEXUS (Levels 91 to 120) ===');
  for (let i = 0; i < 30; i++) {
    const id = 91 + i;
    const name = WORLD4_NAMES[i];
    let w = 13, h = 13;
    let minPar = 6, maxPar = 9;
    let config = {
      numCores: 2,
      numCracked: 2,
      numHazards: 2,
      numPortals: 2,
      numSwitches: 1,
      numGates: 1
    };

    if (id <= 100) {
      // 91-100: 13x13, 1 pair portals, 1 switch, 1 gate, 2 cores, 2 hazards
      w = 13; h = 13; minPar = 6; maxPar = 8;
    } else if (id <= 112) {
      // 101-112: 13x13, 1 pair portals, 1-2 switches, 1-2 gates, 2-3 cores
      w = 13; h = 13; minPar = 7; maxPar = 10;
      config.numSwitches = id >= 106 ? 2 : 1;
      config.numGates = id >= 106 ? 2 : 1;
      config.numCores = 2;
    } else {
      // 113-120: Grand Finale 14x14, 2 portals, 2 switches, 2 gates, 3 cores, 3 hazards
      w = 14; h = 14; minPar = 7; maxPar = 11;
      config.numSwitches = 2;
      config.numGates = 2;
      config.numCores = 3;
      config.numHazards = 3;
    }

    const level = generateVerifiedLevel(id, 'nexus', name, w, h, minPar, maxPar, config, 120000 + id * 97);

    if (id >= 115) {
      level.maxMoves = level.par + 1; // Climax boss levels tight margin
    } else {
      level.maxMoves = level.par + 2;
    }

    console.log(`[World 4] Level ${String(id).padStart(3, '0')} "${name}": Par ${level.par} | MaxMoves: ${level.maxMoves} (${level.solution.path.join('->')})`);

    const jsonPath = path.join(nexusDir, `level-${String(id).padStart(3, '0')}.json`);
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

  // Pre-compiled bundle write
  const bundlePath = path.join(rootDir, 'js', 'levels', 'level-data.js');
  const bundleContent = `/**
 * Pre-compiled & Validated 120 Levels Bundle for 100% Offline / WebView / Browser Support
 */
export const BUNDLED_LEVELS = ${JSON.stringify(allLevelsBundle, null, 2)};
`;
  fs.writeFileSync(bundlePath, bundleContent);
  console.log(`\n======================================================`);
  console.log(`Successfully generated, BFS-verified, and saved all 120 levels!`);
  console.log(`======================================================`);
}

run();
