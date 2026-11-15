import { GameEngine } from './engine/engine.js';
import { CanvasRenderer } from './rendering/renderer.js';
import { InputManager } from './input/input.js';
import { ProgressManager } from './systems/progress.js';
import { AudioManager } from './systems/audio.js';
import { AdvertisementManager } from './systems/advertisements.js';
import { LevelManager } from './levels/level-manager.js';
import { Router } from './router.js';

import { MenuUI } from './ui/menu.js';
import { LevelSelectUI } from './ui/level-select.js';
import { GameplayUI } from './ui/gameplay.js';
import { ResultsUI } from './ui/results.js';
import { SettingsUI } from './ui/settings.js';

class VectorApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.viewport = document.getElementById('game-viewport');

    // Systems
    this.progress = new ProgressManager();
    this.audio = new AudioManager(this.progress);
    this.ads = new AdvertisementManager();
    this.levelManager = new LevelManager();

    // Engine & Rendering
    this.engine = new GameEngine();
    this.renderer = new CanvasRenderer(this.canvas, this.viewport);
    this.input = new InputManager(this.viewport, (dir) => this.handleSwipe(dir));

    // Router & UI
    this.router = new Router(this);
    this.menuUI = new MenuUI(this);
    this.levelSelectUI = new LevelSelectUI(this);
    this.gameplayUI = new GameplayUI(this);
    this.resultsUI = new ResultsUI(this);
    this.settingsUI = new SettingsUI(this);

    this.lastFrameTime = performance.now();

    this.wireEngineEvents();
    this.startMainLoop();

    // Initial Screen
    this.router.navigate('menu');
  }

  handleSwipe(direction) {
    if (this.router.currentScreen !== 'gameplay') return;
    this.engine.move(direction);
  }

  wireEngineEvents() {
    this.engine.onMoveStart = () => {
      this.audio.playMove();
    };

    this.engine.onWallHit = (x, y, dir, isBlock) => {
      this.renderer.effects.triggerImpact(isBlock ? 3 : 5);
      this.audio.playWall();
    };

    this.engine.onKeyCollect = (x, y) => {
      const px = this.renderer.originX + (x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (y + 0.5) * this.renderer.cellSize;
      this.renderer.effects.addBurst(px, py, '#FDE047', 14);
      this.audio.playKey();
    };

    this.engine.onDoorUnlock = (x, y) => {
      const px = this.renderer.originX + (x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (y + 0.5) * this.renderer.cellSize;
      this.renderer.effects.addBurst(px, py, '#F59E0B', 12);
      this.audio.playDoor();
    };

    this.engine.onLevelComplete = ({ moves, par }) => {
      const exitPos = this.engine.state.exit;
      const px = this.renderer.originX + (exitPos.x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (exitPos.y + 0.5) * this.renderer.cellSize;

      this.renderer.effects.addBurst(px, py, '#86EFAC', 24);
      this.audio.playComplete();

      const lvlId = this.engine.state.level.id;
      const result = this.progress.recordCompletion(lvlId, moves, par);

      setTimeout(() => {
        this.resultsUI.show(moves, par, result.stars);
      }, 350);
    };

    this.engine.onStateChange = (state) => {
      this.gameplayUI.updateHUD(state);
    };
  }

  async loadAndStartLevel(levelId) {
    try {
      const levelData = await this.levelManager.getLevel(levelId);
      this.engine.loadLevel(levelData);

      this.router.navigate('gameplay');
      this.renderer.calculateLayout(levelData.width, levelData.height);
      this.gameplayUI.updateHUD(this.engine.state);
    } catch (err) {
      console.error('Failed to load level:', err);
      alert(`Could not load level ${levelId}`);
    }
  }

  startMainLoop() {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = timestamp;

      if (this.router.currentScreen === 'gameplay') {
        this.engine.update(dt);
        this.renderer.render(this.engine.state, dt);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VectorApp();
});
