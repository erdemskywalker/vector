import { GameEngine } from './engine/engine.js';
import { CanvasRenderer } from './rendering/renderer.js';
import { AmbientArtCanvas } from './rendering/ambient-art.js';
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
    this.ambientCanvas = document.getElementById('ambient-canvas');
    this.ambientArt = new AmbientArtCanvas(this.ambientCanvas);

    // Transition Overlay Elements
    this.transOverlay = document.getElementById('sector-transition-overlay');
    this.transTitle = document.getElementById('sector-trans-title');
    this.transPar = document.getElementById('sector-trans-par');

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

    this.engine.onWallCrack = (brokenCoords) => {
      brokenCoords.forEach(coord => {
        const [cx, cy] = coord.split(',').map(Number);
        const px = this.renderer.originX + (cx + 0.5) * this.renderer.cellSize;
        const py = this.renderer.originY + (cy + 0.5) * this.renderer.cellSize;
        this.renderer.effects.addDebris(px, py, 14);
      });
      this.audio.playWallCrack();
    };

    this.engine.onCoreCollect = (x, y, remaining) => {
      const px = this.renderer.originX + (x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (y + 0.5) * this.renderer.cellSize;
      this.renderer.effects.addBurst(px, py, '#73D7FF', 16);
      this.audio.playCore();
    };

    this.engine.onPortalActivate = () => {
      const exitPos = this.engine.state.exit;
      const px = this.renderer.originX + (exitPos.x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (exitPos.y + 0.5) * this.renderer.cellSize;
      this.renderer.effects.addShockwave(px, py, '#86EFAC', 80);
      this.audio.playPortalActive();
    };

    this.engine.onPortalWarp = (fromX, fromY, toX, toY) => {
      const px1 = this.renderer.originX + (fromX + 0.5) * this.renderer.cellSize;
      const py1 = this.renderer.originY + (fromY + 0.5) * this.renderer.cellSize;
      const px2 = this.renderer.originX + (toX + 0.5) * this.renderer.cellSize;
      const py2 = this.renderer.originY + (toY + 0.5) * this.renderer.cellSize;

      this.renderer.effects.addShockwave(px1, py1, '#73D7FF', 50);
      this.renderer.effects.addBurst(px1, py1, '#A78BFA', 14);
      this.renderer.effects.addShockwave(px2, py2, '#A78BFA', 60);
      this.renderer.effects.addBurst(px2, py2, '#73D7FF', 14);
      this.audio.playPortalWarp();
    };

    this.engine.onSwitchToggle = (x, y, gatesOpen) => {
      const px = this.renderer.originX + (x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (y + 0.5) * this.renderer.cellSize;
      this.renderer.effects.addShockwave(px, py, gatesOpen ? '#FBBF24' : '#FB7185', 40);
      this.audio.playSwitch();
    };

    this.engine.onPlayerDeath = (reason, x, y) => {
      const px = this.renderer.originX + (x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (y + 0.5) * this.renderer.cellSize;

      this.renderer.effects.addBurst(px, py, '#FB7185', 28);
      this.renderer.effects.triggerImpact(8);
      this.audio.playDeath();

      setTimeout(() => {
        this.gameplayUI.showGameOver(reason);
      }, 400);
    };

    this.engine.onLevelComplete = ({ moves, par }) => {
      const exitPos = this.engine.state.exit;
      const px = this.renderer.originX + (exitPos.x + 0.5) * this.renderer.cellSize;
      const py = this.renderer.originY + (exitPos.y + 0.5) * this.renderer.cellSize;

      this.renderer.effects.addBurst(px, py, '#86EFAC', 26);
      this.audio.playComplete();

      const lvlId = this.engine.state.level.id;
      const result = this.progress.recordCompletion(lvlId, moves, par);

      setTimeout(() => {
        this.resultsUI.show(moves, par, result.stars, result.unlockedWorldInfo);
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

  async transitionToLevel(nextLvl) {
    try {
      const levelData = await this.levelManager.getLevel(nextLvl);

      // 1. Show transition animation overlay
      if (this.transOverlay) {
        if (this.transTitle) this.transTitle.textContent = `SECTOR ${String(nextLvl).padStart(2, '0')}`;
        if (this.transPar) this.transPar.textContent = `PAR TARGET: ${levelData.par} MOVES`;
        this.transOverlay.classList.add('active');
      }

      this.audio.playWarp();

      // 2. Prepare next level in engine & canvas
      this.engine.loadLevel(levelData);
      this.renderer.calculateLayout(levelData.width, levelData.height);
      this.gameplayUI.updateHUD(this.engine.state);

      if (this.renderer.viewWidth && this.renderer.viewHeight) {
        this.renderer.effects.addShockwave(
          this.renderer.viewWidth / 2,
          this.renderer.viewHeight / 2,
          '#73D7FF',
          160
        );
      }

      // 3. Keep overlay visible for 1550ms (+1 second longer for breathing space), then fade into gameplay
      setTimeout(() => {
        if (this.transOverlay) {
          this.transOverlay.classList.remove('active');
        }
      }, 1550);

    } catch (err) {
      console.error('Failed to transition to level:', err);
      this.router.navigate('levels');
    }
  }

  startMainLoop() {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = timestamp;

      // Meditative Ambient Generative Geometric Canvas (always active across all screens)
      if (this.ambientArt) {
        this.ambientArt.updateAndRender(dt, timestamp / 1000);
      }

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
