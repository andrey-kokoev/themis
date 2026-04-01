import { parseTabsModule } from "./src/parser/tabs-parser.js";
import { readFileSync } from "fs";

const source = readFileSync(process.argv[2]!, "utf-8");
const mod = parseTabsModule(source);

console.log("Module:", mod.moduleId);
console.log("Workspace:", mod.workspace.name);
console.log("Tabs:");
mod.workspace.tabs.forEach((tab, i) => {
  console.log(`  [${i}] ${tab.name} (layout: ${tab.layout})`);
  tab.panes.forEach((pane, j) => {
    const layout = pane.layout || "(inherited)";
    const cmd = pane.command || "(none)";
    console.log(`      pane ${j}: layout=${layout}, cmd=${cmd}`);
  });
});
