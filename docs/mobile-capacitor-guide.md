# Jeevan Mobile & Native Architecture Guide (Capacitor)

This guide documents the mobile architecture for **Jeevan**, converting the React 19 + Vite web application into installable, production-ready native apps for **Android** and **iOS** with **100% shared code**.

---

## 1. High-Level Architecture

```text
                           JEEVAN
                             │
                    React 19 + Vite App
                             │
               ┌─────────────┴─────────────┐
               │                           │
           Web Browser                 Capacitor
                                           │
                                 ┌─────────┴─────────┐
                                 │                   │
                            Android App           iOS App
                           (APK / AAB)          (Xcode / IPA)
```

- **Shared Application Layer:** All business logic, React components, TanStack Query hooks, Framer Motion animations, themes, and gamification calculations live in `client/src/` and are shared across Web, Android, and iOS.
- **Native Device Bridge:** Optional native capabilities (haptics, system status bar coloring, hardware back button, deep links) live in `client/src/lib/native/`. When running in a standard web browser, they automatically and gracefully fall back to web standards without throwing errors.
- **Backend & Database:** The Node.js/Express backend and PostgreSQL (Neon) database remain independent. No server or database credentials are embedded inside the client app.

---

## 2. Directory Structure

```text
d:\PROJECT/
├── client/
│   ├── android/                  # Native Android Studio project
│   │   ├── app/
│   │   │   ├── src/main/AndroidManifest.xml
│   │   │   └── src/main/res/     # Mipmap launcher icons & dark splash drawables
│   │   └── build.gradle
│   ├── ios/                      # Native iOS Xcode project
│   │   └── App/
│   │       └── App/Assets.xcassets/ # 1024x1024 AppIcon & 2732x2732 Splash
│   ├── capacitor.config.json     # Capacitor metadata, plugins & splash config
│   ├── src/
│   │   ├── lib/native/           # Haptics, StatusBar, App lifecycle bridge
│   │   └── ...                   # Shared React application
│   └── package.json
├── server/                       # Node.js + Express backend with CORS for Capacitor
└── .github/workflows/
    └── build-mobile.yml          # Automated Cloud APK & AAB builder
```

---

## 3. How to Run & Develop

### 3.1 Running the Web App (Desktop / Mobile Browser)
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Vite (Port 5173, accessible over LAN)
cd client
npm run dev -- --host
```

### 3.2 Running the Android App Locally (Live Reload)
To test on a physical Android device or emulator with live code reload:
```bash
cd client
# Build current code
npm run build
npx cap sync android

# Open Android Studio
npx cap open android
```
In Android Studio:
1. Connect your Android phone via USB (with USB Debugging enabled) or start an emulator.
2. Click **Run 'app'** (Green play button).

---

## 4. How to Build the Android APK & AAB

### Method A: Automated Cloud Build via GitHub Actions *(Fastest & Recommended)*
1. Push your code to `main` on GitHub (or go to GitHub repository -> **Actions** -> **Build Jeevan Mobile App** -> **Run workflow**).
2. The workflow compiles the React production bundle, syncs Capacitor, and runs Gradle in the cloud.
3. Download the built files from **Artifacts**:
   - `jeevan-debug-apk`: Direct `.apk` file ready to install on any Android phone.
   - `jeevan-release-aab`: Google Play Store upload bundle.

### Method B: Local Gradle Build
```bash
cd client
npm run build
npx cap sync android

cd android
# Build Debug APK
./gradlew assembleDebug

# Output APK path:
# client/android/app/build/outputs/apk/debug/app-debug.apk

# Build Release AAB (for Google Play):
./gradlew bundleRelease
# Output AAB path:
# client/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 5. iOS Configuration & Building

Building an iOS `.ipa` binary requires macOS and Xcode:
```bash
cd client
npm run build
npx cap sync ios
npx cap open ios
```
In Xcode:
1. Select your target device (iPhone or Simulator).
2. Configure **Signing & Capabilities** with your Apple Developer Team.
3. Click **Product -> Archive** to build the App Store package.

---

## 6. Safe Area & Mobile Layout Standards

Jeevan incorporates CSS environment insets for edge-to-edge mobile displays:
- **Top Safe Area:** `env(safe-area-inset-top, 0px)` ensures header elements avoid camera punch-holes and iPhone Dynamic Islands.
- **Bottom Safe Area:** `env(safe-area-inset-bottom, 0px)` ensures the floating glassy bottom navigation bar remains accessible without overlapping the Android/iOS gesture navigation pill.
- **Hardware Back Button:** Managed via `@capacitor/app` in `client/src/lib/native/nativeApp.js`. Navigates back in history or closes open drawers before prompting on double-tap to exit.

---

## 7. Adding Future Features across Web + Mobile

Because the codebase is unified, you **write features once in React**:
1. Build the UI in `client/src/components/` and `client/src/pages/`.
2. Connect to TanStack Query hooks in `client/src/features/`.
3. If the feature benefits from a native capability (e.g. haptics on item click, native notifications), call the helper from `client/src/lib/native/`:
   ```javascript
   import { triggerHaptic } from '@/lib/native';
   
   // Crisp physical vibration on phone; no-op on web
   triggerHaptic('medium');
   ```
4. Run `npm run build && npx cap sync` to update the native packages.
