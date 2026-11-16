/**
 * Advertisement Manager Abstraction
 * Ready for Google AdMob / Capacitor Plugins
 * Gracefully operates offline or with test banners.
 */
export const ADMOB_TEST_UNITS = {
  BANNER_ANDROID: 'ca-app-pub-3940256099942544/6300978111',
  BANNER_IOS: 'ca-app-pub-3940256099942544/2934735716',
  INTERSTITIAL_ANDROID: 'ca-app-pub-3940256099942544/1033173712',
  INTERSTITIAL_IOS: 'ca-app-pub-3940256099942544/4411468910',
  REWARDED_ANDROID: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_IOS: 'ca-app-pub-3940256099942544/1712485313'
};

export class AdvertisementManager {
  constructor() {
    this.completedLevelsCount = 0;
    this.interstitialFrequency = 5; // Show interstitial every 5 completed levels
    this.isAdmobReady = false;
    this.bannerContainer = null;

    // Connect to test banner container in DOM
    if (typeof document !== 'undefined') {
      this.bannerContainer = document.getElementById('admob-banner-container');
    }
  }

  showBanner() {
    if (!this.bannerContainer && typeof document !== 'undefined') {
      this.bannerContainer = document.getElementById('admob-banner-container');
    }
    if (this.bannerContainer) {
      this.bannerContainer.style.display = 'flex';
    }
  }

  hideBanner() {
    if (this.bannerContainer) {
      this.bannerContainer.style.display = 'none';
    }
  }

  isAvailable(adType = 'interstitial') {
    // In current standalone web release, ads are simulated or unavailable
    return this.isAdmobReady;
  }

  /**
   * Called after a level is completed
   */
  checkAndShowLevelInterstitial(onFinished) {
    this.completedLevelsCount++;

    if (this.completedLevelsCount % this.interstitialFrequency === 0) {
      this.showInterstitial({
        onComplete: () => {
          if (onFinished) onFinished();
        },
        onSkipped: () => {
          if (onFinished) onFinished();
        }
      });
    } else {
      if (onFinished) onFinished();
    }
  }

  showInterstitial({ onComplete, onSkipped }) {
    const modalAd = typeof document !== 'undefined' ? document.getElementById('modal-ad-interstitial') : null;
    const btnClose = typeof document !== 'undefined' ? document.getElementById('btn-ad-close') : null;
    const txtCountdown = typeof document !== 'undefined' ? document.getElementById('txt-ad-countdown') : null;

    if (!modalAd || !btnClose) {
      if (onComplete) onComplete();
      return;
    }

    // Reset button state
    btnClose.disabled = true;
    btnClose.classList.remove('ready');
    if (txtCountdown) txtCountdown.textContent = 'Ad closes in 3s';

    modalAd.classList.add('active');

    let secondsLeft = 3;
    const timer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        if (txtCountdown) txtCountdown.textContent = `Ad closes in ${secondsLeft}s`;
      } else {
        clearInterval(timer);
        if (txtCountdown) txtCountdown.textContent = '✕ CLOSE AD';
        btnClose.disabled = false;
        btnClose.classList.add('ready');
      }
    }, 1000);

    const handleClose = () => {
      clearInterval(timer);
      btnClose.removeEventListener('click', handleClose);
      modalAd.classList.remove('active');
      if (onComplete) onComplete();
    };

    btnClose.addEventListener('click', handleClose);
  }

  showRewarded({ onRewarded, onClose, onError }) {
    if (!this.isAvailable('rewarded')) {
      // In offline/mock mode, grant reward directly so player is never penalized
      console.log('[AdManager] No ad provider; granting rewarded benefit directly');
      if (onRewarded) onRewarded();
      if (onClose) onClose();
      return;
    }

    // Future Capacitor / AdMob rewarded ad hook
    if (onRewarded) onRewarded();
    if (onClose) onClose();
  }
}
