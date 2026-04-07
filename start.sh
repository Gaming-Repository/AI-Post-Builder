#!/usr/bin/env bash
set -e

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "🔧 Installing dependencies..."
pnpm install

echo "🚀 Starting AI Post Builder (client + server)..."
pnpm dev
