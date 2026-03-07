#!/usr/bin/env bash
# Build Bedrock Chat desktop client via Tauri.
#
# This script:
# 1. Sets TAURI_BUILD=true so next.config.ts enables static export
# 2. Runs the Next.js static build (output: ./out/)
# 3. Runs tauri build to compile the Rust binary and create platform installers
#
# Usage:
#   ./scripts/tauri-build.sh          # Build for current platform
#   ./scripts/tauri-build.sh --debug  # Debug build (faster, no optimizations)

set -euo pipefail

export TAURI_BUILD=true

echo "==> Building Next.js static export..."
pnpm next build

echo "==> Building Tauri desktop client..."
pnpm tauri build "$@"

echo "==> Done. Installers are in src-tauri/target/release/bundle/"
