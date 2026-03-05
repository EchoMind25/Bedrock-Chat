#!/usr/bin/env bash
# Generate all required Tauri app icons from a single 1024x1024 source PNG.
#
# Requirements:
#   - ImageMagick 7 (`magick` command) OR ImageMagick 6 (`convert` command)
#   - icnsutils (`png2icns`) for macOS .icns — or use `sips` on macOS
#
# Usage:
#   ./scripts/generate-icons.sh [source.png]
#   Default source: src-tauri/icons/source-1024x1024.png
#
# === Required Icon Files for Tauri v2 ===
#
# Windows (.ico):
#   icon.ico — Multi-resolution ICO containing 16x16, 24x24, 32x32, 48x48, 64x64, 256x256
#
# macOS (.icns):
#   icon.icns — Apple icon format containing all retina/non-retina sizes
#
# Linux / Tray / General PNG:
#   32x32.png
#   128x128.png
#   128x128@2x.png (256x256 pixels, named with @2x for HiDPI)
#   icon.png (512x512 — used for tray icon and fallback)
#
# Full dimension list for reference:
#   16x16, 24x24, 32x32, 48x48, 64x64, 128x128,
#   256x256 (128x128@2x), 512x512 (icon.png), 1024x1024 (source)

set -euo pipefail

SOURCE="${1:-src-tauri/icons/source-1024x1024.png}"
OUTDIR="src-tauri/icons"

if [ ! -f "$SOURCE" ]; then
  echo "Error: Source icon not found at $SOURCE"
  echo "Please provide a 1024x1024 PNG file."
  echo "Usage: $0 [path/to/source-1024x1024.png]"
  exit 1
fi

# Detect ImageMagick command
if command -v magick &>/dev/null; then
  CONVERT="magick"
elif command -v convert &>/dev/null; then
  CONVERT="convert"
else
  echo "Error: ImageMagick not found. Install with:"
  echo "  brew install imagemagick    # macOS"
  echo "  sudo apt install imagemagick  # Linux"
  echo "  choco install imagemagick   # Windows"
  exit 1
fi

mkdir -p "$OUTDIR"

echo "==> Generating PNG icons..."
$CONVERT "$SOURCE" -resize 32x32     "$OUTDIR/32x32.png"
$CONVERT "$SOURCE" -resize 128x128   "$OUTDIR/128x128.png"
$CONVERT "$SOURCE" -resize 256x256   "$OUTDIR/128x128@2x.png"
$CONVERT "$SOURCE" -resize 512x512   "$OUTDIR/icon.png"

echo "==> Generating Windows ICO..."
# Create multi-resolution ICO
$CONVERT "$SOURCE" \
  \( -clone 0 -resize 16x16 \) \
  \( -clone 0 -resize 24x24 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 48x48 \) \
  \( -clone 0 -resize 64x64 \) \
  \( -clone 0 -resize 256x256 \) \
  -delete 0 "$OUTDIR/icon.ico"

echo "==> Generating macOS ICNS..."
if command -v png2icns &>/dev/null; then
  # Generate temp PNGs at Apple-required sizes, then combine
  TMPDIR_ICNS=$(mktemp -d)
  $CONVERT "$SOURCE" -resize 16x16     "$TMPDIR_ICNS/icon_16x16.png"
  $CONVERT "$SOURCE" -resize 32x32     "$TMPDIR_ICNS/icon_32x32.png"
  $CONVERT "$SOURCE" -resize 128x128   "$TMPDIR_ICNS/icon_128x128.png"
  $CONVERT "$SOURCE" -resize 256x256   "$TMPDIR_ICNS/icon_256x256.png"
  $CONVERT "$SOURCE" -resize 512x512   "$TMPDIR_ICNS/icon_512x512.png"
  png2icns "$OUTDIR/icon.icns" \
    "$TMPDIR_ICNS/icon_16x16.png" \
    "$TMPDIR_ICNS/icon_32x32.png" \
    "$TMPDIR_ICNS/icon_128x128.png" \
    "$TMPDIR_ICNS/icon_256x256.png" \
    "$TMPDIR_ICNS/icon_512x512.png"
  rm -rf "$TMPDIR_ICNS"
elif command -v sips &>/dev/null && command -v iconutil &>/dev/null; then
  # macOS native toolchain
  ICONSET=$(mktemp -d)/icon.iconset
  mkdir -p "$ICONSET"
  sips -z 16 16     "$SOURCE" --out "$ICONSET/icon_16x16.png"      >/dev/null
  sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_16x16@2x.png"   >/dev/null
  sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_32x32.png"      >/dev/null
  sips -z 64 64     "$SOURCE" --out "$ICONSET/icon_32x32@2x.png"   >/dev/null
  sips -z 128 128   "$SOURCE" --out "$ICONSET/icon_128x128.png"    >/dev/null
  sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
  sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_256x256.png"    >/dev/null
  sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
  sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_512x512.png"    >/dev/null
  sips -z 1024 1024 "$SOURCE" --out "$ICONSET/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$ICONSET" -o "$OUTDIR/icon.icns"
  rm -rf "$(dirname "$ICONSET")"
else
  echo "WARN: Cannot generate .icns — install icnsutils (Linux) or use macOS."
  echo "      Skipping icon.icns generation."
fi

echo "==> Done! Icons generated in $OUTDIR/"
ls -la "$OUTDIR/"
