# Jeevan Mobile Conversion — Technical Audit & Architecture Assessment

**Date:** October 2, 2026  
**Target:** Convert Jeevan Web (React 19 + Vite 8) to Production-Ready Native Mobile App (Capacitor: Android + iOS) while preserving 100% of Web functionality.

---

## 1. System & Architecture Overview

| Area | Current Implementation | Mobile Native Assessment |
|---|---|---|
| **Frontend Framework** | React 19.2, Vite 8.2, React Router v7, TanStack Query v5 | Fully compatible with Capacitor WebView (Chromium on Android 8+, WebKit on iOS 14+). |
| **Styling & Design Tokens** | Tailwind CSS v4 (`@tailwindcss/vite`), CSS custom properties, Outfit & JetBrains Mono fonts | Works seamlessly. Safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) need formal integration for notches and gesture navigation pills. |
| **Animation & Graphics** | Framer Motion v13, `canvas-confetti`, Three.js | High performance on modern mobile GPUs; hardware acceleration works well. Complex blurs should remain restrained on low-tier Android devices. |
| **Backend & Database** | Node.js + Express 4, PostgreSQL (Neon serverless with `pg` pool), Passport.js | Backend runs as a standalone server. Native mobile app communicates with this backend over HTTPS/HTTP REST API. No backend code runs inside the APK. |
| **Database ORM/Querying** | Raw parameterized SQL via `pg.Pool` transactions (`SELECT ... FOR UPDATE` on `character_stats`) | Clean separation. DB credentials remain securely on the server; zero database credentials are exposed to the client. |
| **Authentication System** | Dual-token: short-lived access JWT in memory + HttpOnly rotating refresh cookie (`/auth/refresh`) | In native WebViews, cross-origin third-party cookies can be restricted by Android/iOS sandboxes. We already introduced `localStorage` access token caching, and Capacitor will be configured to handle cookie persistence or header tokens securely. |

---

## 2. WebView Behavioral Differences & Mitigations

### 2.1 Network Origin & CORS
* **Behavior in Browser:** Frontend served at `http://localhost:5173` or domain; requests go to `http://localhost:5000/api/v1`.
* **Behavior in Capacitor:** 
  * Android WebView origin is `https://localhost` or `http://localhost`.
  * iOS WebView origin is `capacitor://localhost`.
* **Risk:** Server CORS rejects requests from `https://localhost` or `capacitor://localhost`.
* **Mitigation:** Add `https://localhost`, `http://localhost`, and `capacitor://localhost` to `server/src/app.js` CORS allowed origins.

### 2.2 API Base URL Resolution
* **Behavior in Browser:** `axios.js` falls back to `window.location.hostname:5000`.
* **Behavior in Capacitor:** On a physical phone, `window.location.hostname` is `localhost`, which points to the *phone itself* (where no Express server is running), causing `ERR_CONNECTION_REFUSED`.
* **Mitigation:** Configure a dynamic API URL resolver:
  1. Checks `VITE_API_BASE_URL` (production or LAN IP e.g. `http://10.119.50.108:5000/api/v1`).
  2. Supports runtime fallback or local network configuration for development testing.

### 2.3 Status Bar & Bottom Navigation Overlap
* **Behavior in Browser:** Mobile browser provides its own URL bar and bottom controls.
* **Behavior in Capacitor:** The WebView renders edge-to-edge underneath the Android/iOS system status bar (notches, camera punch-holes) and bottom gesture pill.
* **Mitigation:**
  * Define `--sat: env(safe-area-inset-top, 0px)` and `--sab: env(safe-area-inset-bottom, 0px)` in `client/src/index.css`.
  * Add safe area bottom padding to `BottomNav.jsx` so the navigation bar floats above the gesture pill.
  * Add safe area top padding to `PlayerHud.jsx`.
  * Use `@capacitor/status-bar` to style the system bar dark with light icons matching the Jeevan dark obsidian theme.

### 2.4 Google OAuth in Native WebView
* **Behavior in Browser:** Standard redirect to `accounts.google.com`.
* **Behavior in Capacitor:** Google blocks OAuth inside standard embedded WebViews (`disallowed_useragent: 403`).
* **Mitigation:**
  * For native apps, Google OAuth is handled via `@capacitor/browser` or deep link callbacks (`jeevan://auth/callback`).
  * Email and password registration/login functions 100% natively without external redirects.

### 2.5 Hardware Back Button (Android)
* **Behavior in Browser:** Browser back button triggers history popstate.
* **Behavior in Capacitor:** Pressing Android hardware back button closes the entire app by default if not intercepted.
* **Mitigation:** Register `@capacitor/app` `backButton` listener to close open modals, drawers, or navigate back in history before exiting the app.

### 2.6 Native Haptic Feedback
* **Opportunity:** On web, `navigator.vibrate` is rarely supported or sluggish.
* **Mitigation:** With `@capacitor/haptics`, we can provide crisp physical feedback on:
  * Checking off a Daily Ritual
  * Clicking (+) on a Habit
  * Conquering a Quest
  * Claiming a Shop Reward

---

## 3. Implementation Roadmap

1. **Capacitor Core Installation:** Install official Capacitor packages (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/app`, `@capacitor/splash-screen`).
2. **Capacitor Configuration:** Create `capacitor.config.json` with ID `com.jeevan.lifeos`, Name `Jeevan`, and Web Directory `dist`.
3. **Android Platform Generation:** Run `npx cap add android` and configure permissions in `AndroidManifest.xml`.
4. **App Branding & Assets:** Generate Android mipmap icons and splash screens from the official Jeevan branding.
5. **CSS & Safe Area Enhancements:** Update `index.css`, `BottomNav.jsx`, `PlayerHud.jsx`, and `AppShell.jsx`.
6. **Native Device Services:** Create modular wrappers (`nativeHaptics.js`, `nativeStatusBar.js`, `nativeApp.js`) that gracefully fall back to web no-ops when running in a browser.
7. **CORS & Server Updates:** Add Capacitor origins to Express backend.
8. **Build Verification & APK Compilation:** Compile client with Vite, sync to Android, and run Gradle build for debug APK and release AAB configuration.
9. **Documentation:** Write comprehensive developer guide in `docs/mobile-capacitor-guide.md`.
