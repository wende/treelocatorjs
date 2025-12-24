#!/bin/bash

# Ancestry Chain E2E Tests Runner
# This script starts all demo apps, waits for them to be ready, runs tests, and cleans up
#
# Usage:
#   ./run-ancestry-tests.sh           # Full run with build
#   ./run-ancestry-tests.sh --no-build # Skip build step
#   ./run-ancestry-tests.sh --no-phoenix # Skip Phoenix demo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$(dirname "$SCRIPT_DIR")/.."
PLAYWRIGHT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse arguments
SKIP_BUILD=false
SKIP_PHOENIX=false
for arg in "$@"; do
  case $arg in
    --no-build) SKIP_BUILD=true ;;
    --no-phoenix) SKIP_PHOENIX=true ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track PIDs for cleanup
declare -a PIDS=()

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Kill any remaining processes on our ports
  for port in 3343 3344 3345 3346 3347 3350; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  done
  echo -e "${GREEN}Cleanup complete${NC}"
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Wait for a URL to become available
wait_for_url() {
  local url=$1
  local name=$2
  local max_attempts=30
  local attempt=0

  echo -e "${BLUE}Waiting for $name ($url)...${NC}"

  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
      echo -e "${GREEN}✓ $name is ready${NC}"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  echo -e "${RED}✗ $name failed to start${NC}"
  return 1
}

# Start a demo app
start_app() {
  local dir=$1
  local name=$2
  local port=$3

  echo -e "${BLUE}Starting $name on port $port...${NC}"

  cd "$APPS_DIR/$dir"
  pnpm dev > /dev/null 2>&1 &
  PIDS+=($!)

  cd "$PLAYWRIGHT_DIR"
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TreeLocatorJS Ancestry Chain Tests   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Build first (show output on failure)
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}Building packages...${NC}"
  cd "$APPS_DIR/.."
  if ! pnpm build; then
    echo -e "${RED}Build failed! See output above.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Build complete${NC}"
  echo ""
else
  echo -e "${YELLOW}Skipping build (--no-build)${NC}"
  echo ""
fi

# Start all demo apps
echo -e "${YELLOW}Starting demo apps...${NC}"

start_app "vite-react-project" "React" 3343
if [ "$SKIP_PHOENIX" = false ]; then
  start_app "phoenix-demo" "Phoenix" 3344
fi
start_app "vite-solid-project" "Solid" 3345
start_app "vite-preact-project" "Preact" 3346
start_app "vite-svelte-project" "Svelte" 3347
start_app "vite-vue-project" "Vue" 3350

echo ""
echo -e "${YELLOW}Waiting for apps to be ready...${NC}"

# Wait for all apps
wait_for_url "http://localhost:3343" "React"
if [ "$SKIP_PHOENIX" = false ]; then
  wait_for_url "http://localhost:3344" "Phoenix"
fi
wait_for_url "http://localhost:3345" "Solid"
wait_for_url "http://localhost:3346" "Preact"
wait_for_url "http://localhost:3347" "Svelte"
wait_for_url "http://localhost:3350" "Vue"

echo ""
echo -e "${GREEN}All apps are ready!${NC}"
echo ""

# Run Playwright tests
echo -e "${YELLOW}Running Playwright ancestry tests...${NC}"
echo ""

cd "$PLAYWRIGHT_DIR"

# Run only the ancestry tests
if [ "$SKIP_PHOENIX" = false ]; then
  npx playwright test tests/ancestry/ --reporter=list
else
  # Skip Phoenix tests when Phoenix is not running
  npx playwright test tests/ancestry/ancestry-chain.spec.ts --reporter=list
fi

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  All ancestry tests passed! ✓         ${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}  Some tests failed. Exit code: $TEST_EXIT_CODE  ${NC}"
  echo -e "${RED}========================================${NC}"
fi

exit $TEST_EXIT_CODE
