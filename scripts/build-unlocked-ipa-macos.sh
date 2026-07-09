#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/apps/ios/Orange Cloud"
cd "$IOS_DIR"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild not found: please run on macOS with Xcode installed" >&2
  exit 1
fi

xcodebuild -version
xcodebuild \
  -project 'Orange Cloud.xcodeproj' \
  -scheme 'Orange Cloud' \
  -resolvePackageDependencies \
  -skipPackagePluginValidation \
  -skipMacroValidation

rm -rf build Payload OrangeCloud-OpenSourceUnlocked-unsigned.ipa
xcodebuild build \
  -project 'Orange Cloud.xcodeproj' \
  -scheme 'Orange Cloud' \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  -skipPackagePluginValidation \
  -skipMacroValidation \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  AD_HOC_CODE_SIGNING_ALLOWED=NO \
  COMPILER_INDEX_STORE_ENABLE=NO \
  OTHER_SWIFT_FLAGS='$(inherited) -D OPENSOURCE_UNLOCKED' \
  SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) OPENSOURCE_UNLOCKED'

APP_PATH="$(find build -path '*Release-iphoneos/Orange Cloud.app' -type d | head -n 1)"
if [[ -z "$APP_PATH" ]]; then
  echo 'Orange Cloud.app not found' >&2
  find build -name '*.app' -type d -print >&2 || true
  exit 1
fi

mkdir -p Payload
cp -R "$APP_PATH" Payload/
find Payload -name '_CodeSignature' -type d -prune -exec rm -rf {} + || true
find Payload -name 'embedded.mobileprovision' -type f -delete || true
/usr/bin/zip -qry OrangeCloud-OpenSourceUnlocked-unsigned.ipa Payload
printf '\nDone: %s\n' "$IOS_DIR/OrangeCloud-OpenSourceUnlocked-unsigned.ipa"
ls -lh OrangeCloud-OpenSourceUnlocked-unsigned.ipa
