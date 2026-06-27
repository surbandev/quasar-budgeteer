# Budgeteer (quasar-budgeteer)

Budgeteer is a forward-looking personal budgeting app. Instead of only recording
what you've already spent, it **projects your finances into the future** from
recurring income and bills, models loans (amortization, escrow), and lets you
explore "what-if" **scenarios** you can combine and compare.

It's built mobile-first for iPhone and Android (via Capacitor), with a more
detailed experience on the web for deeper planning.

- **Frontend:** Quasar 2 + Vue 3 (`<script setup>`), Pinia (setup-style stores in
  `src/stores/`), Vue Router, Chart.js, Luxon + date-fns.
- **Backend:** Node/Express with a DAL + logic split (`backend/`); the projection
  engine lives in `backend/logic/analysis.js`.
- **Mobile shell:** Capacitor (`src-capacitor/`).

See [`ROADMAP.md`](./ROADMAP.md) for the planned direction and open questions.

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Android APK (Capacitor)

Web assets must be built and synced before Gradle can package an APK. From the project root:

```bash
npm run build:cap
```

That runs `quasar build -m capacitor` and triggers the Android Gradle step. To rebuild only the native APK after the web bundle is already in `src-capacitor/www`, use Gradle from the Android project directory:

```bash
cd src-capacitor/android
./gradlew clean assembleRelease   # release APK (see signing notes in android/keystore.properties.example)
./gradlew assembleDebug           # debug APK (signed with the debug keystore; good for sideloading)
```

Output locations:

- **Debug:** `src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `src-capacitor/android/app/build/outputs/apk/release/app-release.apk`

You need the Android SDK configured (for example `local.properties` with `sdk.dir=…`). Open the project in Android Studio from `src-capacitor/android` if you prefer a GUI build.

### iOS (Capacitor) — macOS only

iOS builds require **macOS with Xcode** (and CocoaPods: `brew install cocoapods`).
Two helper scripts wrap the whole flow and are **idempotent** — the first run
installs `@capacitor/ios`, adds the native `src-capacitor/ios` project, and runs
`pod install`; later runs skip straight to build/run.

```bash
npm run ios:run     # live-reload dev build on a connected iPhone / simulator
npm run ios:build   # production web build, sync to iOS, then open Xcode
```

These are also available in VS Code / Cursor as the **"Run on iOS (device/simulator, macOS)"**
and **"Build iOS + open Xcode (macOS)"** launch configurations. From Xcode you can
run on a device or archive for TestFlight / the App Store (signing set up there).

Under the hood the scripts call `quasar dev|build -m capacitor -T ios`. The app id
is `com.surbanwebdev.budgeteer` (see `src-capacitor/capacitor.config.json`). Running
either script on a non-macOS machine exits early with a clear message.

### Run tests

Tests use [Vitest](https://vitest.dev/) and live in `src/tests/` for easy access.

```bash
npm run test        # watch mode – re-runs on file changes
npm run test:run    # single run (e.g. for CI)
npm run test:ui     # Vitest UI (optional)
```

- **Unit tests**: `src/tests/js/` (utils, dates) and `src/tests/stores/` (e.g. constants). Mirror `src/` layout; import with the `src/` alias (e.g. `from 'src/js/utils.js'`).
- Add new tests as `*.spec.js` or `*.test.js` under `src/tests/`.
- After making changes, run `npm run test:run` (or leave `npm run test` running) to confirm nothing breaks.

### Run E2E tests (Playwright)

E2E tests use [Playwright](https://playwright.dev/) and live in `src/tests/e2e/`.
Playwright's `webServer` config starts `npm run dev:all` automatically, so the
backend and frontend boot for you on `http://localhost:9000`.

Install Playwright browsers once (if not already installed):

```bash
npx playwright install
```

**Credentials:** The sign-in test reads the login from environment variables so
the real password is never committed. Set `E2E_PASSWORD` (and optionally
`E2E_USERNAME`, which defaults to `surban`) before running. If `E2E_PASSWORD` is
unset, the sign-in test is skipped rather than failing.

```bash
# PowerShell
$env:E2E_PASSWORD = '<password>'; npm run test:e2e

# bash/zsh
E2E_PASSWORD='<password>' npm run test:e2e
```

```bash
npm run test:e2e       # run all e2e tests (visible Chromium window)
npm run test:e2e:ui    # open Playwright UI for interactive test running
```

- Tests run in a **visible Chromium browser window** (non-headless).
- On failure, screenshots and videos are saved to `playwright-report/`.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
