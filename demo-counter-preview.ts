import { parseTabsModule } from "./src/parser/tabs-parser.js";
import { buildTmuxPaneCommands, formatTmuxCommand } from "./src/backend/tmux-pane-builder.js";
import { readFileSync } from "fs";

const source = readFileSync("demo-counter-simple.themis", "utf-8");
const mod = parseTabsModule(source);
const commands = buildTmuxPaneCommands(mod);

console.log("Commands to execute:\n");
commands.forEach(cmd => console.log(formatTmuxCommand(cmd)));

console.log("\n--- What you'll see ---");
console.log("Two panes side-by-side:");
console.log("  Left:  [alice] -5, 3, -2, 7... (random -10 to 10)");
console.log("  Right: [bob]   2, -8, 4, 1... (random -10 to 10)");
