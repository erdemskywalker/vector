export class ResultsUI {
  constructor(app) {
    this.app = app;

    this.modal = document.getElementById('modal-complete');
    this.subtitle = document.getElementById('result-subtitle');
    this.statMoves = document.getElementById('result-moves');
    this.statPar = document.getElementById('result-par');

    this.star1 = document.getElementById('star-1');
    this.star2 = document.getElementById('star-2');
    this.star3 = document.getElementById('star-3');

    this.btnMenu = document.getElementById('btn-result-menu');
    this.btnRetry = document.getElementById('btn-result-retry');
    this.btnNext = document.getElementById('btn-result-next');
    this.txtNext = document.getElementById('txt-result-next');

    this.autoAdvanceFill = document.getElementById('auto-advance-fill');
    this.autoAdvanceText = document.getElementById('auto-advance-text');

    this.countdownTimer = null;
    this.countdownTotalMs = 3000;
    this.remainingMs = 3000;

    this.initEvents();
  }

  initEvents() {
    this.btnRetry.addEventListener('click', () => {
      this.clearCountdown();
      this.app.audio.playClick();
      this.close();
      this.app.engine.restart();
    });

    this.btnMenu.addEventListener('click', () => {
      this.clearCountdown();
      this.app.audio.playClick();
      this.close();
      this.app.router.navigate('levels');
    });

    this.btnNext.addEventListener('click', () => {
      this.clearCountdown();
      this.app.audio.playClick();
      this.advanceToNext();
    });
  }

  show(moves, par, stars) {
    this.clearCountdown();

    this.statMoves.textContent = moves;
    this.statPar.textContent = par;

    // Reset star animations
    [this.star1, this.star2, this.star3].forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    if (stars === 3) {
      this.subtitle.textContent = 'PERFECT EXECUTION';
    } else if (stars === 2) {
      this.subtitle.textContent = 'SECTOR SECURED';
    } else {
      this.subtitle.textContent = 'SECTOR CLEARED';
    }

    // Sequence star display
    setTimeout(() => {
      if (stars >= 1) {
        this.star1.style.display = 'block';
        this.star1.classList.add('active');
      }
    }, 100);

    setTimeout(() => {
      if (stars >= 2) {
        this.star2.style.display = 'block';
        this.star2.classList.add('active');
      }
    }, 280);

    setTimeout(() => {
      if (stars >= 3) {
        this.star3.style.display = 'block';
        this.star3.classList.add('active');
      }
    }, 460);

    this.modal.classList.add('active');

    // Start 3-second Auto-Advance Countdown
    this.startCountdown();
  }

  startCountdown() {
    this.remainingMs = this.countdownTotalMs;
    this.updateCountdownUI();

    this.countdownTimer = setInterval(() => {
      this.remainingMs -= 100;
      this.updateCountdownUI();

      if (this.remainingMs <= 0) {
        this.clearCountdown();
        this.advanceToNext();
      }
    }, 100);
  }

  updateCountdownUI() {
    const seconds = Math.max(1, Math.ceil(this.remainingMs / 1000));
    const percent = Math.max(0, (this.remainingMs / this.countdownTotalMs) * 100);

    if (this.txtNext) {
      this.txtNext.textContent = `NEXT (${seconds}s)`;
    }
    if (this.autoAdvanceFill) {
      this.autoAdvanceFill.style.width = `${percent}%`;
    }
    if (this.autoAdvanceText) {
      this.autoAdvanceText.textContent = `Auto-advancing in ${seconds}s...`;
    }
  }

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  advanceToNext() {
    this.clearCountdown();
    this.close();

    const currentLvl = this.app.engine.state ? this.app.engine.state.level.id : 1;
    const nextLvl = currentLvl + 1;

    if (nextLvl > 60) {
      // Game grand finale reached
      this.app.router.navigate('menu');
      return;
    }

    // Interstitial ad check and transition animation
    this.app.ads.checkAndShowLevelInterstitial(() => {
      this.app.transitionToLevel(nextLvl);
    });
  }

  close() {
    this.clearCountdown();
    this.modal.classList.remove('active');
  }
}
