import { Capacitor } from '@capacitor/core';

export const APP_CATALOG = [
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', category: 'Social Media', defaultDomain: 'instagram.com' },
  { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube', category: 'Entertainment', defaultDomain: 'youtube.com' },
  { id: 'twitter', name: 'X (Twitter)', packageName: 'com.twitter.android', category: 'Social Media', defaultDomain: 'x.com' },
  { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage', category: 'Social Media', defaultDomain: 'reddit.com' },
  { id: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', category: 'Social Media', defaultDomain: 'tiktok.com' },
  { id: 'netflix', name: 'Netflix', packageName: 'com.netflix.mediaclient', category: 'Entertainment', defaultDomain: 'netflix.com' },
  { id: 'discord', name: 'Discord', packageName: 'com.discord', category: 'Messaging', defaultDomain: 'discord.com' },
  { id: 'twitch', name: 'Twitch', packageName: 'tv.twitch.android.app', category: 'Entertainment', defaultDomain: 'twitch.tv' },
  { id: 'facebook', name: 'Facebook', packageName: 'com.facebook.katana', category: 'Social Media', defaultDomain: 'facebook.com' },
];

export const PRESET_PROFILES = [
  {
    name: 'GATE Study',
    description: 'Shield against social media feeds and endless video scrolls during technical preparation.',
    category: 'study',
    restrictedApps: [
      { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android' },
      { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube' },
      { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage' },
      { id: 'discord', name: 'Discord', packageName: 'com.discord' },
    ],
    restrictedDomains: [
      { domain: 'instagram.com', name: 'Instagram' },
      { domain: 'youtube.com', name: 'YouTube' },
      { domain: 'reddit.com', name: 'Reddit' },
    ],
    defaultDurationSeconds: 2700,
    commitmentLevel: 2,
  },
  {
    name: 'Coding Sprint',
    description: 'Block social distractors and short-form video while keeping documentation accessible.',
    category: 'coding',
    restrictedApps: [
      { id: 'twitter', name: 'X (Twitter)', packageName: 'com.twitter.android' },
      { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage' },
      { id: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
    ],
    restrictedDomains: [
      { domain: 'x.com', name: 'X' },
      { domain: 'reddit.com', name: 'Reddit' },
      { domain: 'tiktok.com', name: 'TikTok' },
    ],
    defaultDurationSeconds: 3600,
    commitmentLevel: 2,
  },
  {
    name: 'Deep Work (Max Shield)',
    description: 'Maximum distraction barrier: blocks all social, video, and streaming platforms.',
    category: 'deep_work',
    restrictedApps: APP_CATALOG.map((a) => ({ id: a.id, name: a.name, packageName: a.packageName })),
    restrictedDomains: APP_CATALOG.map((a) => ({ domain: a.defaultDomain, name: a.name })),
    defaultDurationSeconds: 5400,
    commitmentLevel: 3,
  },
];

class DistractionShieldService {
  constructor() {
    this.platform = Capacitor.getPlatform();
    this.activeSessionId = null;
    this.activeRestrictions = [];
    this.listeners = new Set();
    this.visibilityListener = null;
  }

  /**
   * Retrieves honest multidimensional platform capabilities.
   */
  async getCapabilities() {
    if (this.platform === 'android') {
      try {
        const plugin = Capacitor.Plugins?.DistractionShield;
        if (plugin?.getCapabilities) {
          return await plugin.getCapabilities();
        }
      } catch (err) {
        console.warn('Native DistractionShield plugin call failed, returning fallback specs:', err);
      }

      return {
        platform: 'android',
        canDetectForegroundApp: true,
        canDisplayWarningOverlay: true,
        canEnforceAppRestriction: false, // Standard Android does not support hard-blocking 3rd party apps
        canMaintainBackgroundEnforcement: false,
        canRecoverAfterInterruption: true,
        usageAccessGranted: false,
        overlayPermissionGranted: false,
        status: 'permission_required',
        requiredPermissions: ['Usage Access (PACKAGE_USAGE_STATS)', 'Display Over Other Apps (SYSTEM_ALERT_WINDOW)'],
        degradedModeExplanation:
          'On Android, Jeevan detects foreground app switching and presents a Focus Chamber warning overlay. It cannot permanently terminate external apps.',
      };
    }

    if (this.platform === 'ios') {
      return {
        platform: 'ios',
        canDetectForegroundApp: false,
        canDisplayWarningOverlay: false,
        canEnforceAppRestriction: false,
        canMaintainBackgroundEnforcement: false,
        canRecoverAfterInterruption: true,
        status: 'requires_apple_family_controls_entitlement',
        requiredPermissions: ['Family Controls Entitlement (com.apple.developer.family-controls)'],
        degradedModeExplanation:
          'Apple Screen Time / ManagedSettings requires paid Apple Developer Program enrollment and Apple entitlement grant. Running in web accountability mode.',
      };
    }

    // Default: Web Browser / PWA
    return {
      platform: 'web',
      canDetectForegroundApp: false,
      canDisplayWarningOverlay: false,
      canEnforceAppRestriction: false,
      canMaintainBackgroundEnforcement: false,
      canRecoverAfterInterruption: true,
      status: 'browser_accountability',
      requiredPermissions: [],
      degradedModeExplanation:
        'Web browsers cannot access installed OS applications. Jeevan monitors tab visibility and window focus changes to honestly record interruptions.',
    };
  }

  /**
   * Request native Android usage access settings.
   */
  async requestUsageAccess() {
    if (this.platform === 'android' && Capacitor.Plugins?.DistractionShield?.requestUsageAccess) {
      await Capacitor.Plugins.DistractionShield.requestUsageAccess();
    }
  }

  /**
   * Request native Android overlay permission.
   */
  async requestOverlayPermission() {
    if (this.platform === 'android' && Capacitor.Plugins?.DistractionShield?.requestOverlayPermission) {
      await Capacitor.Plugins.DistractionShield.requestOverlayPermission();
    }
  }

  /**
   * Start distraction shield for active session.
   */
  async startShield(sessionId, { restrictedApps = [], onInterruption = null }) {
    this.activeSessionId = sessionId;
    this.activeRestrictions = restrictedApps;

    if (onInterruption) {
      this.listeners.add(onInterruption);
    }

    // 1. Android Native Shield
    if (this.platform === 'android' && Capacitor.Plugins?.DistractionShield?.startShield) {
      try {
        const packageList = restrictedApps
          .map((a) => a.packageName)
          .filter(Boolean);

        await Capacitor.Plugins.DistractionShield.startShield({
          sessionId,
          blockedPackages: packageList,
        });
      } catch (err) {
        console.warn('Could not engage Android native shield:', err);
      }
    }

    // 2. Web Visibility & Focus tracking
    this.setupWebListeners();
  }

  /**
   * Stop distraction shield and release restrictions.
   */
  async stopShield(sessionId) {
    this.activeSessionId = null;
    this.activeRestrictions = [];
    this.listeners.clear();

    if (this.platform === 'android' && Capacitor.Plugins?.DistractionShield?.stopShield) {
      try {
        await Capacitor.Plugins.DistractionShield.stopShield();
      } catch (err) {
        console.warn('Could not stop Android native shield:', err);
      }
    }

    this.teardownWebListeners();
  }

  setupWebListeners() {
    if (typeof document === 'undefined') return;

    this.teardownWebListeners();

    this.visibilityListener = () => {
      if (document.hidden) {
        this.notifyInterruption('visibility_hidden', {
          reason: 'Tab was switched or minimized',
          timestamp: new Date().toISOString(),
        });
      } else {
        this.notifyInterruption('visibility_visible', {
          reason: 'Returned to Jeevan Focus Chamber',
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  teardownWebListeners() {
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
  }

  notifyInterruption(eventType, metadata) {
    this.listeners.forEach((cb) => {
      try {
        cb(eventType, metadata);
      } catch (e) {
        console.error('Error in distraction shield listener:', e);
      }
    });
  }
}

export const distractionShield = new DistractionShieldService();
