import { LevelSolver } from '../levels/level-solver.js';

export class GameplayUI {
  constructor(app) {
    this.app = app;

    this.screen = document.getElementById('screen-gameplay');
    this.hudWorld = document.getElementById('hud-world');
    this.hudLevel = document.getElementById('hud-level');
    this.hudMoves = document.getElementById('hud-moves');
    this.hudEnergyLabel = document.getElementById('hud-energy-label');
    this.hudLimitDivider = document.getElementById('hud-limit-divider');
    this.hudLimitVal = document.getElementById('hud-limit-val');

    this.hudCoresContainer = document.getElementById('hud-cores-container');
    this.hudCoresIcons = document.getElementById('hud-cores-icons');

    this.btnBack = document.getElementById('btn-game-back');
    this.btnUndo = document.getElementById('btn-game-undo');
    this.btnRestart = document.getElementById('btn-game-restart');
    this.btnHint = document.getElementById('btn-game-hint');

    // Game Over Modal
    this.modalGameOver = document.getElementById('modal-gameover');
    this.gameoverTitle = document.getElementById('gameover-title');
    this.gameoverSubtitle = document.getElementById('gameover-subtitle');
    this.btnGameOverUndo = document.getElementById('btn-gameover-undo');
    this.btnGameOverRetry = document.getElementById('btn-gameover-retry');

    // Hint Modal
    this.modalHint = document.getElementById('modal-hint');
    this.hintDirection = document.getElementById('hint-direction');
    this.btnHintClose = document.getElementById('btn-hint-close');

    this.initEvents();
  }

  initEvents() {
    this.btnBack.addEventListener('click', () => {
      this.app.audio.playClick();
      this.hideGameOver();
      this.app.router.navigate('levels');
    });

    this.btnUndo.addEventListener('click', () => {
      this.app.audio.playClick();
      this.hideGameOver();
      this.app.engine.undo();
    });

    this.btnRestart.addEventListener('click', () => {
      this.app.audio.playClick();
      this.hideGameOver();
      this.app.engine.restart();
    });

    this.btnGameOverUndo.addEventListener('click', () => {
      this.app.audio.playClick();
      this.hideGameOver();
      this.app.engine.undo();
    });

    this.btnGameOverRetry.addEventListener('click', () => {
      this.app.audio.playClick();
      this.hideGameOver();
      this.app.engine.restart();
    });

    this.btnHint.addEventListener('click', () => {
      this.app.audio.playClick();
      this.showHint();
    });

    this.btnHintClose.addEventListener('click', () => {
      this.app.audio.playClick();
      this.modalHint.classList.remove('active');
    });
  }

  showHint() {
    if (!this.app.engine.state) return;

    const cur = this.app.engine.state;
    const tempLevel = {
      width: cur.width,
      height: cur.height,
      grid: cur.grid,
      start: { x: cur.playerX, y: cur.playerY },
      exit: cur.exit,
      totalCores: cur.totalCores,
      collectedCores: cur.collectedCores,
      brokenCracked: cur.brokenCrackedWalls
    };

    const solution = LevelSolver.solve(tempLevel);

    if (solution && solution.solved && solution.path.length > 0) {
      this.hintDirection.textContent = solution.path[0];
      this.modalHint.classList.add('active');
    } else {
      this.hintDirection.textContent = 'NO PATH (TRY RESTART)';
      this.modalHint.classList.add('active');
    }
  }

  showGameOver(reason) {
    if (reason === 'ENERGY_DEPLETED') {
      this.gameoverTitle.textContent = 'ENERGY DEPLETED';
      this.gameoverSubtitle.textContent = 'Vector thruster limit reached. Reroute required.';
    } else {
      this.gameoverTitle.textContent = 'CRITICAL FAILURE';
      this.gameoverSubtitle.textContent = 'Fatal laser hazard contact.';
    }
    this.modalGameOver.classList.add('active');
  }

  hideGameOver() {
    this.modalGameOver.classList.remove('active');
  }

  updateHUD(state) {
    if (!state) return;

    const level = state.level;
    let worldName = 'WORLD 01';
    if (level.world === 'keys') worldName = 'WORLD 02';
    else if (level.world === 'quantum') worldName = 'WORLD 03';
    else if (level.world === 'nexus') worldName = 'WORLD 04';
    const levelNumber = `LEVEL ${String(level.id).padStart(2, '0')}`;

    this.hudWorld.textContent = worldName;
    this.hudLevel.textContent = levelNumber;

    // Energy / Moves Display
    if (state.maxMoves !== null) {
      const remaining = state.getMovesRemaining();
      this.hudEnergyLabel.textContent = 'ENERGY';
      this.hudMoves.textContent = remaining;
      this.hudLimitDivider.style.display = 'inline';
      this.hudLimitVal.style.display = 'inline';
      this.hudLimitVal.textContent = state.maxMoves;

      if (remaining <= 2 && remaining > 0) {
        this.hudMoves.classList.add('danger');
      } else {
        this.hudMoves.classList.remove('danger');
      }
    } else {
      this.hudEnergyLabel.textContent = 'MOVES';
      this.hudMoves.textContent = state.moveCount;
      this.hudLimitDivider.style.display = 'none';
      this.hudLimitVal.style.display = 'none';
      this.hudMoves.classList.remove('danger');
    }

    // Cores Pill Display
    if (state.totalCores > 0) {
      this.hudCoresContainer.style.display = 'flex';
      let dotsHtml = '';
      const collectedCount = state.collectedCores.size;
      for (let i = 0; i < state.totalCores; i++) {
        dotsHtml += `<div class="core-dot ${i < collectedCount ? 'collected' : ''}"></div>`;
      }
      this.hudCoresIcons.innerHTML = dotsHtml;
    } else {
      this.hudCoresContainer.style.display = 'none';
    }
  }
}
