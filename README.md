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

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
