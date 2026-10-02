import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Initialize native application lifecycle, deep links, and back button handling.
 *
 * @param {object} options
 * @param {(path: string) => void} options.onNavigate - Router navigation function
 * @param {() => boolean} [options.canGoBack] - Check if history or modal can go back
 * @param {() => void} [options.onBack] - Custom back handler
 */
export function initNativeApp({ onNavigate, canGoBack, onBack } = {}) {
  if (!Capacitor.isNativePlatform()) return () => {};

  // Hide initial native splash once React takes control
  setTimeout(() => {
    try {
      SplashScreen.hide({ fadeOutDuration: 400 });
    } catch {}
  }, 300);

  // Deep linking handler: jeevan://<path>
  const appUrlListener = CapApp.addListener('appUrlOpen', (event) => {
    try {
      const url = new URL(event.url);
      // Remove custom scheme, extract path: jeevan://habits -> /habits
      const path = url.pathname ? `${url.pathname}${url.search}` : `/${url.host || ''}`;
      if (path && onNavigate) {
        onNavigate(path);
      }
    } catch (e) {
      console.warn('Deep link parse error:', e);
    }
  });

  // Android hardware back button handler
  let lastBackPress = 0;
  const backButtonListener = CapApp.addListener('backButton', () => {
    if (onBack) {
      onBack();
      return;
    }

    if (canGoBack && canGoBack()) {
      window.history.back();
      return;
    }

    if (window.location.pathname !== '/') {
      if (onNavigate) {
        onNavigate('/');
      } else {
        window.history.back();
      }
      return;
    }

    // On root dashboard, double press back to exit
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      CapApp.exitApp();
    } else {
      lastBackPress = now;
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('lifeos:toast', {
            detail: { message: 'Press back again to exit Jeevan', type: 'info' },
          })
        );
      }
    }
  });

  return () => {
    appUrlListener.then((l) => l.remove()).catch(() => {});
    backButtonListener.then((l) => l.remove()).catch(() => {});
  };
}
