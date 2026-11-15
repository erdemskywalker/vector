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
    this.btnChargeFill = document.getElementById('btn-next-charge-fill');

    this.chargeTimeout = null;

    this.initEvents();
  }

  initEvents() {
    this.btnRetry.addEventListener('click', () => {
      this.clearCharge();
      this.app.audio.playClick();
      this.close();
      this.app.engine.restart();
    });

    this.btnMenu.addEventListener('click', () => {
      this.clearCharge();
      this.app.audio.playClick();
      this.close();
      this.app.router.navigate('levels');
    });

    this.btnNext.addEventListener('click', () => {
      if (this.btnNext.disabled) return;
      this.clearCharge();
      this.app.audio.playClick();
      this.advanceToNext();
    });
  }

  show(moves, par, stars) {
    this.clearCharge();

    this.statMoves.textContent = moves;
    this.statPar.textContent = par;

    // Reset stars
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

    // Sequence star animation
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

    // Initial 3-second locked state
    this.btnNext.disabled = true;
    this.btnNext.classList.remove('ready');

    if (this.btnChargeFill) {
      this.btnChargeFill.style.transition = 'none';
      this.btnChargeFill.style.width = '0%';
    }

    this.modal.classList.add('active');

    // Trigger smooth 3-second charge animation
    setTimeout(() => {
      if (this.btnChargeFill) {
        this.btnChargeFill.style.transition = 'width 3s linear';
        this.btnChargeFill.style.width = '100%';
      }
    }, 60);

    // After exactly 3 seconds, button becomes active with ready state (NO auto-advance!)
    this.chargeTimeout = setTimeout(() => {
      this.btnNext.disabled = false;
      this.btnNext.classList.add('ready');
      this.app.audio.playClick();
    }, 3060);
  }

  clearCharge() {
    if (this.chargeTimeout) {
      clearTimeout(this.chargeTimeout);
      this.chargeTimeout = null;
    }
  }

  advanceToNext() {
    this.clearCharge();
    this.close();

    const currentLvl = this.app.engine.state ? this.app.engine.state.level.id : 1;
    const nextLvl = currentLvl + 1;

    if (nextLvl > 60) {
      this.app.router.navigate('menu');
      return;
    }

    this.app.ads.checkAndShowLevelInterstitial(() => {
      this.app.transitionToLevel(nextLvl);
    });
  }

  close() {
    this.clearCharge();
    this.modal.classList.remove('active');
  }
}
