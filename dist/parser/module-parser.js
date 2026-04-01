/**
 * Module Parser for Themis DSL
 *
 * Implements module/import surface syntax (Task 017).
 * Extends minimal parser with module root and composition declarations.
 */
import { parse as parseWorkspace } from "./minimal-parser.js";
// Parser error classes
export class ModuleParseError extends Error {
    line;
    column;
    constructor(message, line, column) {
        super(`${message} at line ${line}, column ${column}`);
        this.line = line;
        this.column = column;
        this.name = "ModuleParseError";
    }
}
export class MultipleModuleRootsError extends ModuleParseError {
    constructor(line, column) {
        super("Multiple module roots found", line, column);
        this.name = "MultipleModuleRootsError";
    }
}
export class MissingWorkspaceError extends ModuleParseError {
    constructor(line, column) {
        super("Module must contain exactly one workspace", line, column);
        this.name = "MissingWorkspaceError";
    }
}
export class InvalidPlacementError extends ModuleParseError {
    constructor(what, line, column) {
        super(`${what} must appear at module top level before workspace`, line, column);
        this.name = "InvalidPlacementError";
    }
}
// Keywords for module syntax
const MODULE_KEYWORDS = new Set([
    "module",
    "import",
    "namespace",
    "alias",
    "role",
    "as",
    "share",
    "subject",
    "across",
    "workspace",
]);
// Lexer for module syntax
function* lexer(input) {
    let pos = 0;
    let line = 1;
    let column = 1;
    function peek() {
        return input[pos];
    }
    function advance() {
        const ch = input[pos++];
        if (ch === "\n") {
            line++;
            column = 1;
        }
        else {
            column++;
        }
        return ch;
    }
    function skipWhitespace() {
        while (peek() && /\s/.test(peek())) {
            advance();
        }
    }
    function skipComment() {
        if (peek() === "/" && input[pos + 1] === "/") {
            while (peek() && peek() !== "\n") {
                advance();
            }
        }
    }
    while (pos < input.length) {
        skipWhitespace();
        skipComment();
        skipWhitespace();
        if (pos >= input.length)
            break;
        const startLine = line;
        const startCol = column;
        const ch = peek();
        // String literal
        if (ch === '"') {
            advance(); // consume opening quote
            let value = "";
            while (peek() && peek() !== '"') {
                value += advance();
            }
            if (!peek()) {
                throw new ModuleParseError("Unterminated string", startLine, startCol);
            }
            advance(); // consume closing quote
            yield { type: "STRING", value, line: startLine, column: startCol };
            continue;
        }
        // Braces
        if (ch === "{") {
            advance();
            yield { type: "LBRACE", value: "{", line: startLine, column: startCol };
            continue;
        }
        if (ch === "}") {
            advance();
            yield { type: "RBRACE", value: "}", line: startLine, column: startCol };
            continue;
        }
        // Dot
        if (ch === ".") {
            advance();
            yield { type: "DOT", value: ".", line: startLine, column: startCol };
            continue;
        }
        // Comma
        if (ch === ",") {
            advance();
            yield { type: "COMMA", value: ",", line: startLine, column: startCol };
            continue;
        }
        // Keywords and identifiers
        if (/[a-zA-Z_]/.test(ch)) {
            let value = "";
            while (peek() && /[a-zA-Z0-9_-]/.test(peek())) {
                value += advance();
            }
            const type = MODULE_KEYWORDS.has(value) ? "KEYWORD" : "STRING";
            yield { type, value, line: startLine, column: startCol };
            continue;
        }
        // Unexpected character
        throw new ModuleParseError(`Unexpected character: ${ch}`, line, column);
    }
    yield { type: "EOF", value: "", line, column };
}
// Parser state
class Parser {
    tokens = [];
    pos = 0;
    input;
    constructor(input) {
        this.input = input;
        this.tokens = Array.from(lexer(input));
    }
    peek() {
        return this.tokens[this.pos];
    }
    advance() {
        return this.tokens[this.pos++];
    }
    expect(type, value) {
        const token = this.peek();
        if (token.type !== type) {
            throw new ModuleParseError(`Expected ${type} but got ${token.type}`, token.line, token.column);
        }
        if (value && token.value !== value) {
            throw new ModuleParseError(`Expected "${value}" but got "${token.value}"`, token.line, token.column);
        }
        return this.advance();
    }
    match(type, value) {
        const token = this.peek();
        if (token.type !== type)
            return false;
        if (value && token.value !== value)
            return false;
        return true;
    }
    consume(type, value) {
        if (this.match(type, value)) {
            this.advance();
            return true;
        }
        return false;
    }
    // Parse module file
    parseModule() {
        const imports = [];
        const namespaces = [];
        const aliases = [];
        const sharedIdentities = [];
        let workspace = null;
        let moduleId = null;
        let moduleStartLine = 0;
        let moduleStartCol = 0;
        // Look for module keyword
        while (!this.match("EOF")) {
            if (this.match("KEYWORD", "module")) {
                if (moduleId !== null) {
                    throw new MultipleModuleRootsError(this.peek().line, this.peek().column);
                }
                const moduleTok = this.advance(); // consume "module"
                moduleStartLine = moduleTok.line;
                moduleStartCol = moduleTok.column;
                const nameTok = this.expect("STRING");
                moduleId = nameTok.value;
                this.expect("LBRACE");
                // Parse module body
                while (!this.match("RBRACE") && !this.match("EOF")) {
                    if (this.match("KEYWORD", "import")) {
                        if (workspace !== null) {
                            throw new InvalidPlacementError("Import", this.peek().line, this.peek().column);
                        }
                        imports.push(this.parseImport());
                    }
                    else if (this.match("KEYWORD", "namespace")) {
                        if (workspace !== null) {
                            throw new InvalidPlacementError("Namespace declaration", this.peek().line, this.peek().column);
                        }
                        namespaces.push(this.parseNamespace());
                    }
                    else if (this.match("KEYWORD", "alias")) {
                        if (workspace !== null) {
                            throw new InvalidPlacementError("Alias declaration", this.peek().line, this.peek().column);
                        }
                        aliases.push(this.parseAlias());
                    }
                    else if (this.match("KEYWORD", "share")) {
                        if (workspace !== null) {
                            throw new InvalidPlacementError("Shared identity declaration", this.peek().line, this.peek().column);
                        }
                        sharedIdentities.push(this.parseSharedIdentity());
                    }
                    else if (this.match("KEYWORD", "workspace")) {
                        if (workspace !== null) {
                            throw new MissingWorkspaceError(this.peek().line, this.peek().column);
                        }
                        workspace = this.parseWorkspace();
                    }
                    else {
                        throw new ModuleParseError(`Unexpected token in module: ${this.peek().value}`, this.peek().line, this.peek().column);
                    }
                }
                this.expect("RBRACE");
            }
            else if (this.match("KEYWORD", "workspace")) {
                // Workspace outside module - use legacy parse
                if (workspace !== null) {
                    throw new ModuleParseError("Multiple workspaces found", this.peek().line, this.peek().column);
                }
                // No module wrapper - treat as legacy workspace file
                workspace = this.parseWorkspace();
                moduleId = workspace.name;
            }
            else {
                throw new ModuleParseError(`Expected module or workspace, got: ${this.peek().value}`, this.peek().line, this.peek().column);
            }
        }
        if (moduleId === null) {
            throw new MissingWorkspaceError(moduleStartLine, moduleStartCol);
        }
        if (workspace === null) {
            throw new MissingWorkspaceError(moduleStartLine, moduleStartCol);
        }
        return {
            tag: "Module",
            moduleId,
            imports,
            namespaces,
            aliases,
            sharedIdentities,
            workspace,
        };
    }
    parseImport() {
        this.expect("KEYWORD", "import");
        const moduleTok = this.expect("STRING");
        return { tag: "Import", moduleId: moduleTok.value };
    }
    parseNamespace() {
        this.expect("KEYWORD", "namespace");
        const moduleTok = this.expect("STRING");
        this.expect("KEYWORD", "as");
        const nsTok = this.expect("STRING");
        return {
            tag: "Namespace",
            moduleId: moduleTok.value,
            namespace: nsTok.value,
        };
    }
    parseAlias() {
        this.expect("KEYWORD", "alias");
        this.expect("KEYWORD", "role");
        const moduleTok = this.expect("STRING");
        this.expect("DOT");
        const roleTok = this.expect("STRING");
        this.expect("KEYWORD", "as");
        const composedTok = this.expect("STRING");
        return {
            tag: "RoleAlias",
            moduleId: moduleTok.value,
            localRoleId: roleTok.value,
            composedRoleId: composedTok.value,
        };
    }
    parseSharedIdentity() {
        this.expect("KEYWORD", "share");
        this.expect("KEYWORD", "subject");
        const subjectTok = this.expect("STRING");
        this.expect("KEYWORD", "across");
        const modules = [];
        modules.push(this.expect("STRING").value);
        while (this.consume("COMMA")) {
            modules.push(this.expect("STRING").value);
        }
        return {
            tag: "SharedIdentity",
            subjectId: subjectTok.value,
            modules,
        };
    }
    parseWorkspace() {
        // Find the workspace keyword position in the original input
        const startToken = this.peek();
        // Find position of "workspace" keyword in original input
        let searchPos = 0;
        let foundPos = -1;
        let braceDepth = 0;
        let inString = false;
        // Count tokens up to current position to find rough location
        for (let i = 0; i < this.pos && i < this.tokens.length; i++) {
            const tok = this.tokens[i];
            const tokStr = tok.type === "STRING" ? `"${tok.value}"` : tok.value;
            // Find this token in input starting from searchPos
            const idx = this.input.indexOf(tokStr, searchPos);
            if (idx !== -1) {
                searchPos = idx + tokStr.length;
            }
        }
        // Now find the workspace keyword
        const wsKeyword = "workspace";
        foundPos = this.input.indexOf(wsKeyword, searchPos);
        if (foundPos === -1) {
            throw new ModuleParseError("Could not find workspace in input", startToken.line, startToken.column);
        }
        // Find the matching closing brace
        let braceStart = this.input.indexOf("{", foundPos);
        if (braceStart === -1) {
            throw new ModuleParseError("Could not find workspace opening brace", startToken.line, startToken.column);
        }
        braceDepth = 1;
        let pos = braceStart + 1;
        while (braceDepth > 0 && pos < this.input.length) {
            const ch = this.input[pos];
            if (ch === '"') {
                // Skip string literal
                pos++;
                while (pos < this.input.length && this.input[pos] !== '"') {
                    if (this.input[pos] === '\\')
                        pos++;
                    pos++;
                }
                if (pos < this.input.length)
                    pos++;
            }
            else if (ch === '{') {
                braceDepth++;
                pos++;
            }
            else if (ch === '}') {
                braceDepth--;
                if (braceDepth > 0)
                    pos++;
                else
                    break;
            }
            else {
                pos++;
            }
        }
        if (braceDepth !== 0) {
            throw new ModuleParseError("Unclosed workspace brace", startToken.line, startToken.column);
        }
        // Extract the workspace body (excluding outer braces) for validation
        const workspaceBody = this.input.substring(braceStart + 1, pos);
        // Check for composition declarations inside workspace body
        const compositionKeywords = ["namespace", "alias", "share", "import"];
        for (const keyword of compositionKeywords) {
            // Use regex to find keyword as a whole word not inside a string
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            let match;
            while ((match = regex.exec(workspaceBody)) !== null) {
                // Check if match is inside a string by counting quotes before it
                const beforeMatch = workspaceBody.substring(0, match.index);
                const quoteCount = (beforeMatch.match(/"/g) || []).length;
                if (quoteCount % 2 === 0) {
                    // Not inside a string - this is an invalid placement
                    throw new InvalidPlacementError(`Composition declaration "${keyword}"`, startToken.line, startToken.column);
                }
            }
        }
        // Extract the workspace substring (including closing brace)
        const workspaceDsl = this.input.substring(foundPos, pos + 1);
        // Advance tokens to match what we consumed
        this.expect("KEYWORD", "workspace");
        this.expect("STRING"); // workspace name
        this.expect("LBRACE");
        // Skip all tokens until we find the matching RBRACE
        let tokenBraceDepth = 1;
        while (tokenBraceDepth > 0 && !this.match("EOF")) {
            if (this.match("LBRACE")) {
                tokenBraceDepth++;
                this.advance();
            }
            else if (this.match("RBRACE")) {
                tokenBraceDepth--;
                if (tokenBraceDepth > 0) {
                    this.advance();
                }
            }
            else {
                this.advance();
            }
        }
        this.expect("RBRACE");
        return parseWorkspace(workspaceDsl);
    }
}
// Public API
export function parseModule(input) {
    const parser = new Parser(input);
    return parser.parseModule();
}
// Lowering function: SurfaceModule -> LoweredModule
export function lowerModule(surface) {
    return {
        tag: "LoweredModule",
        module: {
            moduleId: surface.moduleId,
            workspace: surface.workspace,
        },
        policy: {
            namespaces: surface.namespaces,
            aliases: surface.aliases,
            sharedIdentities: surface.sharedIdentities,
        },
        imports: surface.imports.map(i => i.moduleId),
    };
}
//# sourceMappingURL=module-parser.js.map