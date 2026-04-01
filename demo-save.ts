import { parseTabsModule } from "./src/parser/tabs-parser.js";
import { saveState, getStatePath } from "./src/state/session-state.js";
import { readFileSync } from "fs";

const themisFile = process.argv[2]!;
const source = readFileSync(themisFile, "utf-8");
const mod = parseTabsModule(source);
const statePath = getStatePath(themisFile);

saveState(mod, "tmux", statePath);
console.log("State saved.");
