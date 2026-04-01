#!/bin/bash
# Simple demo for Task 029 - using tsx directly

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
THEMIS_FILE="$DEMO_DIR/demo-workspace.themis"
STATE_FILE="${THEMIS_FILE}.state.json"

echo "=========================================="
echo "Themis Pane Layout Demo"
echo "=========================================="
echo ""

echo "1. Workspace file:"
cat "$THEMIS_FILE"
echo ""

echo "2. Parse and show structure:"
npx tsx "$DEMO_DIR/demo-parse.ts" "$THEMIS_FILE"
echo ""

echo "3. Show tmux commands that would be generated:"
npx tsx "$DEMO_DIR/demo-tmux-cmds.ts" "$THEMIS_FILE"
echo ""

echo "4. Save state:"
npx tsx "$DEMO_DIR/demo-save.ts" "$THEMIS_FILE"
echo "Saved to: $STATE_FILE"
echo ""

echo "5. State file content:"
cat "$STATE_FILE"
echo ""
echo ""

echo "6. Restore from state:"
npx tsx "$DEMO_DIR/demo-restore.ts" "$THEMIS_FILE"
echo ""

echo "=========================================="
echo "Demo complete!"
echo "=========================================="
echo ""
echo "To run the workspace:"
echo "  npx tsx src/cli-tabs.ts demo-workspace.themis"
echo ""
