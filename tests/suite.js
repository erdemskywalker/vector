import assert from 'assert';
import { GameEngine } from '../js/engine/engine.js';
import { LevelParser } from '../js/levels/level-parser.js';
import { LevelValidator } from '../js/levels/level-validator.js';
import { LevelSolver } from '../js/levels/level-solver.js';
import { ProgressManager } from '../js/systems/progress.js';
import { StorageManager } from '../js/systems/storage.js';

console.log('=== VECTOR TEST SUITE ===\n');

// Mock localStorage for Node test environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

let testsPassed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

// 1. All Four Movement Directions & Wall Stopping
test('Movement: All 4 directions and wall stopping', () => {
  const level = {
    id: 991,
    world: 'test',
    width: 5,
    height: 5,
    par: 4,
    grid: [
      "#####",
      "#...#",
      "#.S.#",
      "#...#",
      "#####"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  assert.strictEqual(engine.state.playerX, 2);
  assert.strictEqual(engine.state.playerY, 2);

  // Swipe UP
  engine.move('UP');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 2);
  assert.strictEqual(engine.state.playerY, 1); // Stopped at wall

  // Swipe RIGHT
  engine.move('RIGHT');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 3);
  assert.strictEqual(engine.state.playerY, 1);

  // Swipe DOWN
  engine.move('DOWN');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 3);
  assert.strictEqual(engine.state.playerY, 3);

  // Swipe LEFT
  engine.move('LEFT');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 1);
  assert.strictEqual(engine.state.playerY, 3);
});

// 2. Key Collection and Door Unlock
test('Puzzle Mechanics: Key collection mid-slide and Door unlocking', () => {
  const level = {
    id: 992,
    world: 'test',
    width: 7,
    height: 5,
    par: 2,
    grid: [
      "#######",
      "#S.K.D#",
      "#.....#",
      "#....E#",
      "#######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Player at (1,1). Sliding RIGHT passes over Key at (3,1) and Door at (5,1).
  // Because Key is collected mid-slide, player has key and opens Door (5,1), stopping at (5,1) before wall (6,1)!
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.playerX, 5);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.collectedKeys.has('3,1'), true);
  assert.strictEqual(engine.state.unlockedDoors.has('5,1'), true);
  assert.strictEqual(engine.state.keysHeld, 0); // Consumed for the door
});

// 3. Locked Door Blocks Without Key
test('Puzzle Mechanics: Locked door blocks when no key held', () => {
  const level = {
    id: 993,
    world: 'test',
    width: 7,
    height: 5,
    par: 3,
    grid: [
      "#######",
      "#S...D#",
      "#.....#",
      "#....E#",
      "#######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Player at (1,1). Slides RIGHT towards Door at (5,1) without key.
  // Should stop at (4,1) immediately before the locked door.
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.playerX, 4);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.unlockedDoors.has('5,1'), false);
});

// 4. Exit Detection
test('Puzzle Mechanics: Exit detection finishes level', () => {
  const level = {
    id: 994,
    world: 'test',
    width: 5,
    height: 5,
    par: 1,
    grid: [
      "#####",
      "#S.E#",
      "#...#",
      "#...#",
      "#####"
    ]
  };

  const engine = new GameEngine();
  let completed = false;
  engine.onLevelComplete = () => { completed = true; };
  engine.loadLevel(level);

  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.isCompleted, true);
  assert.strictEqual(completed, true);
  assert.strictEqual(engine.state.playerX, 3);
  assert.strictEqual(engine.state.playerY, 1);
});

// 5. Undo & Restart Behavior
test('State Management: Undo and Restart', () => {
  const level = {
    id: 995,
    world: 'test',
    width: 6,
    height: 6,
    par: 3,
    grid: [
      "######",
      "#S..K#",
      "#....#",
      "#....#",
      "#E...#",
      "######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  assert.strictEqual(engine.state.moveCount, 0);

  // Move 1: RIGHT to key (stops at wall x=4)
  engine.move('RIGHT');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 4);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.moveCount, 1);
  assert.strictEqual(engine.state.keysHeld, 1);

  // Move 2: DOWN (stops at wall y=4)
  engine.move('DOWN');
  engine.finishSlide();
  assert.strictEqual(engine.state.playerX, 4);
  assert.strictEqual(engine.state.playerY, 4);
  assert.strictEqual(engine.state.moveCount, 2);

  // Undo Move 2
  const undo1 = engine.undo();
  assert.strictEqual(undo1, true);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.playerX, 4);
  assert.strictEqual(engine.state.moveCount, 1);
  assert.strictEqual(engine.state.keysHeld, 1);

  // Restart
  const resetSuccess = engine.restart();
  assert.strictEqual(resetSuccess, true);
  assert.strictEqual(engine.state.playerX, 1);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.moveCount, 0);
  assert.strictEqual(engine.state.keysHeld, 0);
  assert.strictEqual(engine.state.collectedKeys.size, 0);
});

// 6. Rapid Repeated Input Ignored While Moving
test('Input: Rapid swipe inputs ignored during active slide', () => {
  const level = {
    id: 996,
    world: 'test',
    width: 7,
    height: 5,
    par: 2,
    grid: [
      "#######",
      "#S....#",
      "#.....#",
      "#....E#",
      "#######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Start move RIGHT
  const moved = engine.move('RIGHT');
  assert.strictEqual(moved, true);
  assert.strictEqual(engine.state.isMoving, true);

  // Attempt rapid duplicate input while slide animation is active
  const rapidMove = engine.move('DOWN');
  assert.strictEqual(rapidMove, false); // Ignored!
});

// 7. Star Rating System
test('Progression: Star ratings calculation', () => {
  const pm = new ProgressManager();

  // Par = 4
  assert.strictEqual(pm.calculateStars(4, 4), 3); // Par -> 3 stars
  assert.strictEqual(pm.calculateStars(3, 4), 3); // Under par -> 3 stars
  assert.strictEqual(pm.calculateStars(5, 4), 2); // Par + 1 -> 2 stars
  assert.strictEqual(pm.calculateStars(6, 4), 2); // Par + 2 -> 2 stars
  assert.strictEqual(pm.calculateStars(7, 4), 1); // Par + 3 -> 1 star
  assert.strictEqual(pm.calculateStars(12, 4), 1); // Many moves -> 1 star
});

// 8. Progress Persistence & Unlocking
test('Progression: Level completion, unlocks, and persistence', () => {
  const pm = new ProgressManager();
  pm.resetAll();

  assert.strictEqual(pm.isLevelUnlocked(1), true);
  assert.strictEqual(pm.isLevelUnlocked(2), false);

  // Complete level 1 in 3 moves (par 3)
  const res = pm.recordCompletion(1, 3, 3);
  assert.strictEqual(res.stars, 3);
  assert.strictEqual(pm.isLevelUnlocked(2), true);
  assert.strictEqual(pm.getTotalStars(), 3);
  assert.strictEqual(pm.getCompletedCount(), 1);

  // Reload from storage simulation
  const pm2 = new ProgressManager();
  assert.strictEqual(pm2.isLevelUnlocked(2), true);
  assert.strictEqual(pm2.getTotalStars(), 3);
});

// 9. Level Validator Rejects Invalid/Unsolvable Levels
test('Validator: Rejects invalid format and unsolvable mazes', () => {
  // Invalid: missing exit
  const noExit = {
    id: 997,
    width: 5,
    height: 5,
    grid: [
      "#####",
      "#S..#",
      "#...#",
      "#...#",
      "#####"
    ]
  };
  const valNoExit = LevelValidator.validate(noExit);
  assert.strictEqual(valNoExit.valid, false);

  // Invalid: trapped exit behind solid walls
  const trapped = {
    id: 998,
    width: 6,
    height: 6,
    grid: [
      "######",
      "#S...#",
      "#....#",
      "###..#",
      "#E#..#",
      "######"
    ]
  };
  const valTrapped = LevelValidator.validate(trapped);
  assert.strictEqual(valTrapped.valid, false);
});

console.log(`\n========================================`);
console.log(`All ${testsPassed} automated test cases PASSED!`);
console.log(`========================================`);
