import { parseTabsModule } from "./src/parser/tabs-parser.js";
import { buildTmuxPaneCommands, formatTmuxCommand } from "./src/backend/tmux-pane-builder.js";
import { readFileSync } from "fs";

const source = readFileSync("demo-two-kimi.themis", "utf-8");
const mod = parseTabsModule(source);
const commands = buildTmuxPaneCommands(mod);

console.log("Commands to execute:\n");
commands.forEach(cmd => console.log(formatTmuxCommand(cmd)));
