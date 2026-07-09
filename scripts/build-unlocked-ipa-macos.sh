#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/apps/ios/Orange Cloud"
LOG_DIR="$ROOT/build-logs"
mkdir -p "$LOG_DIR"
cd "$IOS_DIR"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild not found: please run on macOS with Xcode installed" >&2
  exit 1
fi

run_logged() {
  local name="$1"
  shift
  local log="$LOG_DIR/${name}.log"
  echo "==> $name"
  set +e
  "$@" 2>&1 | tee "$log"
  local status=${PIPESTATUS[0]}
  set -e
  if [[ $status -ne 0 ]]; then
    echo "::group::${name} failure tail"
    tail -n 160 "$log" || true
    echo "::endgroup::"
    {
      echo "${name} failed with exit code ${status}"
      echo ""
      tail -n 80 "$log" || true
    } > "$LOG_DIR/${name}-summary.txt"
    # Put compact real errors into GitHub annotations so they are visible without opening full logs.
    {
      grep -E -i "(^|[[:space:]])(error:|fatal error:|warning:|BUILD FAILED|failed|unavailable|cannot find|no such module|Provisioning profile|CodeSign)" "$log" | tail -n 80 || true
      echo "---- tail ----"
      tail -n 40 "$log" || true
    } | sed 's/%/%25/g; s/\r/%0D/g; s/\n/%0A/g' | while IFS= read -r line; do
      echo "::error title=${name} failed::${line}"
    done
    exit "$status"
  fi
}

xcodebuild -version | tee "$LOG_DIR/xcode-version.log"
run_logged resolve-packages \
  xcodebuild \
    -project 'Orange Cloud.xcodeproj' \
    -scheme 'Orange Cloud' \
    -resolvePackageDependencies \
    -skipPackagePluginValidation \
    -skipMacroValidation

rm -rf build Payload OrangeCloud-OpenSourceUnlocked-unsigned.ipa
run_logged build-unlocked \
  xcodebuild build \
    -project 'Orange Cloud.xcodeproj' \
    -scheme 'Orange Cloud' \
    -configuration Release \
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
ls -lh OrangeCloud-OpenSourceUnlocked-unsigned.ipa | tee "$LOG_DIR/artifact.txt"
