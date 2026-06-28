#!/usr/bin/env bash
# iOS build/run helper for Budgeteer (Capacitor).
#
# Usage: bash scripts/ios.sh [run|build]
#   run   -> live-reload dev build on a connected iPhone / simulator
#   build -> production web build, sync to iOS, then open the project in Xcode
#
# The script is idempotent: the first time it runs it installs @capacitor/ios,
# adds the native iOS project, and installs CocoaPods. Subsequent runs skip
# straight to build/run.
#
# Requirements (macOS only): Xcode + command line tools, and CocoaPods
# (`sudo gem install cocoapods` or `brew install cocoapods`).

set -euo pipefail

MODE="${1:-run}"

# --- Platform guard -------------------------------------------------------
if [[ "$(uname)" != "Darwin" ]]; then
  echo "iOS builds require macOS with Xcode. Detected platform: $(uname)."
  echo "Run this command from your Mac."
  exit 1
fi

# --- Tooling guard --------------------------------------------------------
if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found in PATH."
  echo "Install Node.js, then restart the terminal. Example:"
  echo "  export PATH=\"\$HOME/.local/node/bin:\$PATH\""
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Full Xcode is required (Command Line Tools alone are not enough)."
  echo "Install Xcode from the Mac App Store, then run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo "Open Xcode once to accept the license."
  exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods is not installed."
  echo "After installing Homebrew (https://brew.sh), run:"
  echo "  brew install cocoapods"
  exit 1
fi

# Resolve repo root (this script lives in scripts/).
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CAP_DIR="$ROOT_DIR/src-capacitor"

# --- Dependencies ---------------------------------------------------------
if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "Installing root dependencies..."
  npm install
fi

# Ensure @capacitor/ios is present inside the Capacitor project.
if [[ ! -d "$CAP_DIR/node_modules/@capacitor/ios" ]]; then
  echo "Installing @capacitor/ios..."
  (cd "$CAP_DIR" && npm install)
fi

# --- First-time iOS platform setup (idempotent) ---------------------------
if [[ ! -d "$CAP_DIR/ios" ]]; then
  echo "First run detected: adding the native iOS platform..."

  # `npx cap add ios` needs the web assets dir (www) to exist first. Seed a
  # placeholder; the real bundle is produced by the quasar build/dev below.
  mkdir -p "$CAP_DIR/www"
  if [[ ! -f "$CAP_DIR/www/index.html" ]]; then
    echo "<!doctype html><title>Budgeteer</title>" > "$CAP_DIR/www/index.html"
  fi

  # Creates src-capacitor/ios and runs `pod install`.
  (cd "$CAP_DIR" && npx cap add ios)
fi

# --- Build / run ----------------------------------------------------------
case "$MODE" in
  run)
    echo "Launching iOS dev build (live reload). Choose your device/simulator when prompted."
    npx quasar dev -m capacitor -T ios
    ;;
  build)
    echo "Building iOS production bundle and opening Xcode..."
    # --skip-pkg builds web assets + cap sync only. We open App.xcworkspace
    # ourselves because Quasar --ide may pick App.xcodeproj first (no Capacitor).
    npx quasar build -m capacitor -T ios --skip-pkg
    open "$CAP_DIR/ios/App/App.xcworkspace"

    DEST_OUTPUT="$(xcodebuild -showdestinations \
      -workspace "$CAP_DIR/ios/App/App.xcworkspace" \
      -scheme App 2>&1 || true)"

    if echo "$DEST_OUTPUT" | grep -q 'is not installed'; then
      echo ""
      echo "Note: An iOS platform SDK is missing in Xcode."
      echo "Install it from Xcode > Settings > Components, then press Run (⌘R)."
      echo ""
    elif ! echo "$DEST_OUTPUT" | grep -qE 'platform:iOS Simulator, id:[0-9A-F-]+'; then
      echo ""
      echo "Note: No iOS Simulator destinations are available yet."
      echo "Install an iOS simulator runtime in Xcode > Settings > Components."
      echo ""
    fi
    ;;
  *)
    echo "Unknown mode '$MODE'. Use 'run' or 'build'."
    exit 1
    ;;
esac
