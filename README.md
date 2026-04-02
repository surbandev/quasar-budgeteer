# Budgeteer (quasar-budgeteer)

A Quasar Project

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

E2E tests use [Playwright](https://playwright.dev/) and live in `e2e/`.

**Prerequisite:** The dev server must be running before executing tests, as Playwright connects to `http://localhost:9000`.

```bash
quasar dev
```

Install Playwright browsers once (if not already installed):

```bash
npx playwright install
```

Then in a separate terminal:

```bash
npm run test:e2e       # run all e2e tests (visible Chromium window)
npm run test:e2e:ui    # open Playwright UI for interactive test running
```

- Tests run in a **visible Chromium browser window** (non-headless).
- On failure, screenshots and videos are saved to `playwright-report/`.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
