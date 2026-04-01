#!/bin/bash
# Demo script for Task 029: Pane Layout and Session Persistence
# Shows full loop: declare → parse → save → restore

set -e

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
THEMIS_FILE="$DEMO_DIR/demo-workspace.themis"
STATE_FILE="${THEMIS_FILE}.state.json"

echo "=========================================="
echo "Themis Pane Layout Demo"
echo "=========================================="
echo ""

# Step 1: Show the declaration
echo "Step 1: Workspace Declaration"
echo "------------------------------"
cat "$THEMIS_FILE"
echo ""

# Step 2: Parse and display structure
echo "Step 2: Parse Structure"
echo "------------------------------"
npx tsx -e "
import { parseTabsModule } from './src/parser/tabs-parser.js';
import fs from 'fs';
const source = fs.readFileSync('$THEMIS_FILE', 'utf-8');
const mod = parseTabsModule(source);

console.log('Module:', mod.moduleId);
console.log('Workspace:', mod.workspace.name);
console.log('Tabs:');
mod.workspace.tabs.forEach((tab, i) => {
  console.log('  [' + i + '] ' + tab.name + ' (layout: ' + tab.layout + ')');
  tab.panes.forEach((pane, j) => {
    const layout = pane.layout || '(inherited)';
    const cmd = pane.command || '(none)';
    console.log('      pane ' + j + ': layout=' + layout + ', cmd=' + cmd);
  });
});
"
echo ""

# Step 3: Show what tmux commands would be generated
echo "Step 3: Tmux Command Preview"
echo "------------------------------"
npx tsx -e "
import { parseTabsModule } from './src/parser/tabs-parser.js';
import { buildTmuxPaneCommands, formatTmuxCommand } from './src/backend/tmux-pane-builder.js';
import fs from 'fs';

const source = fs.readFileSync('$THEMIS_FILE', 'utf-8');
const mod = parseTabsModule(source);
const commands = buildTmuxPaneCommands(mod);

commands.forEach(cmd => {
  console.log('\$ ' + formatTmuxCommand(cmd));
});
"
echo ""

# Step 4: Save state
echo "Step 4: Save Session State"
echo "------------------------------"
npx tsx -e "
import { parseTabsModule } from './src/parser/tabs-parser.js';
import { saveState, getStatePath } from './src/state/session-state.js';
import fs from 'fs';

const source = fs.readFileSync('$THEMIS_FILE', 'utf-8');
const mod = parseTabsModule(source);
const statePath = getStatePath('$THEMIS_FILE');

saveState(mod, 'tmux', statePath);
console.log('State saved to:', statePath);
"
echo ""

# Step 5: Show state file
echo "Step 5: State File Content"
echo "------------------------------"
cat "$STATE_FILE"
echo ""
echo ""

# Step 6: Demonstrate restore
echo "Step 6: Restore from State"
echo "------------------------------"
npx tsx -e "
import { loadState, stateToModule } from './src/state/session-state.js';

const state = loadState('$STATE_FILE');
const restored = stateToModule(state);

console.log('Restored module:', restored.moduleId);
console.log('Tabs:', restored.workspace.tabs.length);
restored.workspace.tabs.forEach(tab => {
  console.log('  - ' + tab.name + ' with ' + tab.panes.length + ' panes');
});
console.log('');
console.log('State restore successful. After reboot, run:');
console.log('  npx tsx src/cli-tabs.ts restore demo-workspace.themis');
"
echo ""

echo "=========================================="
echo "Demo Complete"
echo "=========================================="
echo ""
echo "To actually run this workspace:"
echo "  cd $DEMO_DIR"
echo "  npx tsx src/cli-tabs.ts demo-workspace.themis"
echo ""
