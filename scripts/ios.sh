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
    npx quasar build -m capacitor -T ios
    (cd "$CAP_DIR" && npx cap open ios)
    ;;
  *)
    echo "Unknown mode '$MODE'. Use 'run' or 'build'."
    exit 1
    ;;
esac
