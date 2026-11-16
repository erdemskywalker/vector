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

    // World Unlock Modal elements
    this.modalWorldUnlock = document.getElementById('modal-world-unlock');
    this.unlockWidget = document.getElementById('unlock-lock-widget');
    this.unlockTitle = document.getElementById('world-unlock-title');
    this.unlockSubtitle = document.getElementById('world-unlock-subtitle');
    this.unlockDesc = document.getElementById('world-unlock-desc');
    this.btnWorldUnlockContinue = document.getElementById('btn-world-unlock-continue');
    this.txtWorldUnlockBtn = document.getElementById('txt-world-unlock-btn');

    this.chargeTimeout = null;
    this.unlockedWorldInfo = null;
    this.targetNextLvl = null;

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
      this.app.ads.checkAndShowLevelInterstitial(() => {
        this.app.router.navigate('levels');
      });
    });

    this.btnNext.addEventListener('click', () => {
      if (this.btnNext.disabled) return;
      this.clearCharge();
      this.app.audio.playClick();
      this.advanceToNext();
    });

    if (this.btnWorldUnlockContinue) {
      this.btnWorldUnlockContinue.addEventListener('click', () => {
        if (this.btnWorldUnlockContinue.disabled) return;
        this.app.audio.playClick();
        if (this.modalWorldUnlock) this.modalWorldUnlock.classList.remove('active');
        const nextLvl = this.targetNextLvl || 1;
        this.unlockedWorldInfo = null;
        this.app.transitionToLevel(nextLvl);
      });
    }
  }

  show(moves, par, stars, unlockedWorldInfo = null) {
    this.clearCharge();
    this.unlockedWorldInfo = unlockedWorldInfo;

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

    // Initial 2-second locked state
    this.btnNext.disabled = true;
    this.btnNext.classList.remove('ready');

    if (this.btnChargeFill) {
      this.btnChargeFill.style.transition = 'none';
      this.btnChargeFill.style.width = '0%';
    }

    this.modal.classList.add('active');

    // Trigger smooth 2-second charge animation
    setTimeout(() => {
      if (this.btnChargeFill) {
        this.btnChargeFill.style.transition = 'width 2s linear';
        this.btnChargeFill.style.width = '100%';
      }
    }, 60);

    // After exactly 2 seconds, button becomes active with ready state (NO auto-advance!)
    this.chargeTimeout = setTimeout(() => {
      this.btnNext.disabled = false;
      this.btnNext.classList.add('ready');
      this.app.audio.playClick();
    }, 2000);
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

    if (nextLvl > 120) {
      this.app.router.navigate('menu');
      return;
    }

    if (this.unlockedWorldInfo) {
      this.showWorldUnlockCeremony(this.unlockedWorldInfo, nextLvl);
      return;
    }

    this.app.ads.checkAndShowLevelInterstitial(() => {
      this.app.transitionToLevel(nextLvl);
    });
  }

  showWorldUnlockCeremony(worldInfo, nextLvl) {
    this.targetNextLvl = nextLvl;
    if (!this.modalWorldUnlock) {
      this.app.transitionToLevel(nextLvl);
      return;
    }

    if (this.unlockTitle) this.unlockTitle.textContent = `WORLD ${worldInfo.num} UNLOCKED`;
    if (this.unlockSubtitle) this.unlockSubtitle.textContent = `SYSTEM CLASSIFICATION: ${worldInfo.name}`;
    if (this.unlockDesc) this.unlockDesc.textContent = `SECTOR PROTOCOLS DECRYPTED // ACCESS GRANTED`;

    if (this.unlockWidget) {
      this.unlockWidget.classList.remove('unlocked');
    }

    if (this.btnWorldUnlockContinue) {
      this.btnWorldUnlockContinue.disabled = true;
      this.btnWorldUnlockContinue.classList.remove('ready');
    }
    if (this.txtWorldUnlockBtn) {
      this.txtWorldUnlockBtn.textContent = 'DECRYPTING ACCESS...';
    }

    this.modalWorldUnlock.classList.add('active');

    // 1. Play unlock animation after short delay
    setTimeout(() => {
      if (this.unlockWidget) {
        this.unlockWidget.classList.add('unlocked');
      }
      this.app.audio.playWarp();
    }, 450);

    // 2. After unlock animation finishes (1500ms), show interstitial ad
    setTimeout(() => {
      this.app.ads.showInterstitial({
        onComplete: () => {
          // After ad closes, enable button to enter the next world
          if (this.btnWorldUnlockContinue) {
            this.btnWorldUnlockContinue.disabled = false;
            this.btnWorldUnlockContinue.classList.add('ready');
          }
          if (this.txtWorldUnlockBtn) {
            this.txtWorldUnlockBtn.textContent = `ENTER WORLD ${worldInfo.num} //`;
          }
          this.app.audio.playClick();
        }
      });
    }, 1500);
  }

  close() {
    this.clearCharge();
    this.modal.classList.remove('active');
  }
}
