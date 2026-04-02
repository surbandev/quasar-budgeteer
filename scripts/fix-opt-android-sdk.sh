#!/usr/bin/env bash
# One-time fix when ANDROID_SDK_ROOT=/opt/android-sdk (root-owned, no licenses).
# Run: ./scripts/fix-opt-android-sdk.sh
# Set AUTO_INSTALL_CMDLINE_TOOLS=0 to skip downloading cmdline-tools (~170MB).
set -euo pipefail

SDK="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
# Pin JDK for sdkmanager (avoid system Java 25+ incompatibilities)
export JAVA_HOME="${JAVA_HOME:-/opt/android-studio/jbr}"

if [[ ! -d "$SDK" ]]; then
  echo "SDK directory not found: $SDK" >&2
  exit 1
fi

echo "Using SDK: $SDK"
echo "This script uses sudo to create license files and fix ownership so Gradle can install/update packages."
echo

sudo mkdir -p "$SDK/licenses"

# Standard Android SDK license fingerprints (used by sdkmanager / Gradle)
sudo tee "$SDK/licenses/android-sdk-license" >/dev/null <<'EOF'

24333f8a63b6825ea9c5514f83c2829b004d1fee
EOF

sudo tee "$SDK/licenses/android-sdk-preview-license" >/dev/null <<'EOF'

84831b9409646a918e30573bab4c9c91346d8abd
EOF

# Own the tree so your user (not root) can write package.xml / Gradle downloads.
# Set CHOWN_SDK_TO_USER=0 to skip if your distro manages /opt/android-sdk as root-only.
if [[ "${CHOWN_SDK_TO_USER:-1}" != "0" ]]; then
  sudo chown -R "$(id -un):$(id -gn)" "$SDK"
fi

find_sdkmanager() {
  local c
  for c in "$SDK/cmdline-tools/latest/bin/sdkmanager" \
           "$SDK/cmdline-tools/bin/sdkmanager"; do
    if [[ -x "$c" ]]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

# Old tools/bin/sdkmanager breaks on JDK 17+ (javax.xml.bind); do not use it.

install_cmdline_tools_from_google() {
  local zipver=14742923
  local url="https://dl.google.com/android/repository/commandlinetools-linux-${zipver}_latest.zip"
  local tmp
  tmp="$(mktemp -d)"

  echo "Downloading Android SDK command-line tools (~170 MB)..."
  echo "  $url"
  curl -fL --progress-bar "$url" -o "$tmp/cmdline.zip"

  unzip -q "$tmp/cmdline.zip" -d "$tmp/extract"
  mkdir -p "$SDK/cmdline-tools"
  rm -rf "$SDK/cmdline-tools/latest"
  mv "$tmp/extract/cmdline-tools" "$SDK/cmdline-tools/latest"
  rm -rf "$tmp"

  echo "Installed: $SDK/cmdline-tools/latest/bin/sdkmanager"
}

SDKMANAGER=""
if path="$(find_sdkmanager)"; then
  SDKMANAGER="$path"
elif [[ "${AUTO_INSTALL_CMDLINE_TOOLS:-1}" != "0" ]]; then
  if ! command -v curl >/dev/null || ! command -v unzip >/dev/null; then
    echo "Need curl and unzip to auto-install cmdline-tools. Install them, then re-run." >&2
    exit 1
  fi
  install_cmdline_tools_from_google
  SDKMANAGER="$(find_sdkmanager || true)"
fi

if [[ -n "$SDKMANAGER" ]]; then
  echo "Installing platforms;android-35 and build-tools;34.0.0 via: $SDKMANAGER"
  yes | "$SDKMANAGER" --sdk_root="$SDK" "platforms;android-35" "build-tools;34.0.0"
else
  echo "sdkmanager still not found under $SDK/cmdline-tools." >&2
  echo "Install \"Android SDK Command-line Tools\" in Android Studio (SDK Tools tab), then re-run this script," >&2
  echo "or run with default settings so this script can download cmdline-tools (see AUTO_INSTALL_CMDLINE_TOOLS)." >&2
  exit 1
fi

echo
echo "Done. Try: npm run build:cap"
