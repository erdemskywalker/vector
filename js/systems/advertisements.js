/**
 * Advertisement Manager Abstraction
 * Ready for Google AdMob / Capacitor Plugins
 * Gracefully operates offline or when ads are unavailable.
 */
export class AdvertisementManager {
  constructor() {
    this.completedLevelsCount = 0;
    this.interstitialFrequency = 5; // Show interstitial every 5 completed levels
    this.isAdmobReady = false;
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
    if (!this.isAvailable('interstitial')) {
      // Graceful fallback when no ad provider is loaded
      if (onComplete) onComplete();
      return;
    }

    // Future Capacitor / AdMob implementation hook
    console.log('[AdManager] Displaying Interstitial Ad');
    if (onComplete) onComplete();
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
