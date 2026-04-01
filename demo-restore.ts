import { loadState, stateToModule, getStatePath } from "./src/state/session-state.js";

const themisFile = process.argv[2]!;
const statePath = getStatePath(themisFile);
const state = loadState(statePath);
const restored = stateToModule(state);

console.log("Restored module:", restored.moduleId);
console.log("Tabs:", restored.workspace.tabs.length);
restored.workspace.tabs.forEach(tab => {
  console.log(`  - ${tab.name} with ${tab.panes.length} panes`);
});
console.log("\nRestore successful!");
