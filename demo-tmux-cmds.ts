import { parseTabsModule } from "./src/parser/tabs-parser.js";
import { buildTmuxPaneCommands, formatTmuxCommand } from "./src/backend/tmux-pane-builder.js";
import { readFileSync } from "fs";

const source = readFileSync(process.argv[2]!, "utf-8");
const mod = parseTabsModule(source);
const commands = buildTmuxPaneCommands(mod);

commands.forEach(cmd => {
  console.log("$ " + formatTmuxCommand(cmd));
});
