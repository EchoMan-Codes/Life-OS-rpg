import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Sync native system status bar with current Jeevan theme.
 */
export async function updateNativeStatusBar(isDark = true) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (isDark) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#07080C' });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  } catch (err) {
    console.debug('StatusBar sync skipped:', err);
  }
}

/**
 * Initialize status bar at application startup.
 */
export async function initNativeStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await updateNativeStatusBar(true);
  } catch (err) {
    console.debug('StatusBar init skipped:', err);
  }
}
