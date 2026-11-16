/**
 * Advertisement Manager Abstraction — VECTOR 2.0
 * Native Google AdMob support via @capacitor-community/admob with Web/Browser fallback.
 */

export const ADMOB_TEST_UNITS = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313'
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  }
};

export const ADMOB_PROD_UNITS = {
  ios: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
    rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/CCCCCCCCCC'
  },
  android: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/DDDDDDDDDD',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/EEEEEEEEEE',
    rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/FFFFFFFFFF'
  }
};

const STORAGE_KEY_COUNT = 'vector_ad_level_count';

export class AdvertisementManager {
  constructor() {
    this.isTestMode = true; // Set to false before production store release
    this.interstitialFrequency = 4; // Show interstitial ad every 4 completed levels
    this.completedLevelsCount = this.loadCompletedCount();

    this.isNative = this.checkIsNative();
    this.platform = this.detectPlatform();
    this.isInitialized = false;
    this.interstitialReady = false;
    this.bannerContainer = null;
    this.pendingInterstitialCallback = null;

    if (typeof document !== 'undefined') {
      this.bannerContainer = document.getElementById('admob-banner-container');
    }
  }

  checkIsNative() {
    return typeof window !== 'undefined' &&
      Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  }

  detectPlatform() {
    if (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.getPlatform === 'function') {
      return window.Capacitor.getPlatform();
    }
    return 'web';
  }

  getPlugin() {
    if (typeof window === 'undefined') return null;
    return window.Capacitor?.Plugins?.AdMob || null;
  }

  getUnits() {
    const units = this.isTestMode ? ADMOB_TEST_UNITS : ADMOB_PROD_UNITS;
    const plat = this.platform === 'ios' ? 'ios' : 'android';
    return units[plat];
  }

  loadCompletedCount() {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(STORAGE_KEY_COUNT);
        return val ? parseInt(val, 10) || 0 : 0;
      }
    } catch (_) {}
    return 0;
  }

  saveCompletedCount() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_COUNT, String(this.completedLevelsCount));
      }
    } catch (_) {}
  }

  /**
   * Initialize AdMob SDK (Called on app startup)
   */
  async init() {
    if (this.isInitialized) return;

    if (!this.isNative) {
      console.log('[AdMob] Running in Web environment. Using simulated modal overlay.');
      this.isInitialized = true;
      return;
    }

    const AdMob = this.getPlugin();
    if (!AdMob) {
      console.warn('[AdMob] Native platform detected but Capacitor AdMob plugin is not available.');
      this.isInitialized = true;
      return;
    }

    try {
      // 1. iOS App Tracking Transparency (ATT)
      if (this.platform === 'ios' && typeof AdMob.requestTrackingAuthorization === 'function') {
        try {
          const info = await AdMob.trackingAuthorizationStatus();
          if (info.status === 'notDetermined') {
            await AdMob.requestTrackingAuthorization();
          }
        } catch (attErr) {
          console.warn('[AdMob] ATT authorization request skipped/error:', attErr);
        }
      }

      // 2. Initialize AdMob SDK
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: this.isTestMode
      });

      console.log('[AdMob] Native SDK initialized successfully.');
      this.setupNativeListeners(AdMob);
      this.isInitialized = true;

      // 3. Preload first interstitial ad
      this.prepareInterstitial();

    } catch (err) {
      console.error('[AdMob] Failed to initialize AdMob SDK:', err);
      this.isInitialized = true;
    }
  }

  setupNativeListeners(AdMob) {
    try {
      AdMob.addListener('interstitialAdLoaded', () => {
        console.log('[AdMob] Interstitial ad preloaded and ready.');
        this.interstitialReady = true;
      });

      AdMob.addListener('interstitialAdDismissed', () => {
        console.log('[AdMob] Interstitial ad dismissed by user.');
        this.interstitialReady = false;
        if (this.pendingInterstitialCallback) {
          const cb = this.pendingInterstitialCallback;
          this.pendingInterstitialCallback = null;
          cb();
        }
        // Preload next interstitial after 2 seconds
        setTimeout(() => this.prepareInterstitial(), 2000);
      });

      AdMob.addListener('interstitialAdFailedToLoad', (err) => {
        console.warn('[AdMob] Interstitial ad failed to load:', err);
        this.interstitialReady = false;
        // Retry loading after 10 seconds
        setTimeout(() => this.prepareInterstitial(), 10000);
      });

      AdMob.addListener('interstitialAdFailedToShow', (err) => {
        console.warn('[AdMob] Interstitial ad failed to show:', err);
        this.interstitialReady = false;
        if (this.pendingInterstitialCallback) {
          const cb = this.pendingInterstitialCallback;
          this.pendingInterstitialCallback = null;
          cb();
        }
        this.prepareInterstitial();
      });
    } catch (e) {
      console.warn('[AdMob] Error attaching listeners:', e);
    }
  }

  async prepareInterstitial() {
    if (!this.isNative) return;
    const AdMob = this.getPlugin();
    if (!AdMob) return;

    try {
      const units = this.getUnits();
      await AdMob.prepareInterstitial({
        adId: units.interstitial,
        isTesting: this.isTestMode
      });
    } catch (e) {
      console.warn('[AdMob] prepareInterstitial error:', e);
    }
  }

  /**
   * Increments level count and triggers interstitial if frequency threshold is met
   */
  checkAndShowLevelInterstitial(onFinished) {
    this.completedLevelsCount++;
    this.saveCompletedCount();

    if (this.completedLevelsCount % this.interstitialFrequency === 0) {
      console.log(`[AdMob] Interstitial triggered (Sector complete count: ${this.completedLevelsCount})`);
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

  /**
   * Show Interstitial Ad (Native or Web Simulation)
   */
  async showInterstitial({ onComplete, onSkipped } = {}) {
    const callback = onComplete || onSkipped || (() => {});

    // 1. Native Capacitor AdMob
    if (this.isNative) {
      const AdMob = this.getPlugin();
      if (AdMob && this.interstitialReady) {
        try {
          this.pendingInterstitialCallback = callback;
          await AdMob.showInterstitial();
          return;
        } catch (showErr) {
          console.warn('[AdMob] Native showInterstitial failed, falling back:', showErr);
          this.pendingInterstitialCallback = null;
          this.prepareInterstitial();
        }
      }
    }

    // 2. Web / Browser Simulated Interstitial
    this.showWebSimulatedInterstitial(callback);
  }

  showWebSimulatedInterstitial(onComplete) {
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

  showBanner() {
    if (this.isNative) {
      const AdMob = this.getPlugin();
      if (AdMob) {
        const units = this.getUnits();
        AdMob.showBanner({
          adId: units.banner,
          position: 'BOTTOM_CENTER',
          isTesting: this.isTestMode
        }).catch(err => console.warn('[AdMob] Native banner error:', err));
        return;
      }
    }

    // Web simulation banner
    if (!this.bannerContainer && typeof document !== 'undefined') {
      this.bannerContainer = document.getElementById('admob-banner-container');
    }
    if (this.bannerContainer) {
      this.bannerContainer.style.display = 'flex';
    }
  }

  hideBanner() {
    if (this.isNative) {
      const AdMob = this.getPlugin();
      if (AdMob) {
        AdMob.hideBanner().catch(() => {});
        return;
      }
    }
    if (this.bannerContainer) {
      this.bannerContainer.style.display = 'none';
    }
  }
}
