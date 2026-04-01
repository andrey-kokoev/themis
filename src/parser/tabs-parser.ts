/**
 * Tabs Parser for Pane Layout DSL (Task 029A)
 * 
 * Parses tab/pane syntax extending the module parser.
 * Grammar from lawbook 064A.
 */

import type { TabbedModule, TabWorkspace, TabBlock, PaneBlock, LayoutKind } from "../types/tabs.js";

// Token types
type TokenType = "KEYWORD" | "STRING" | "LBRACE" | "RBRACE" | "EOF";

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  "module", "workspace", "tab", "in", "layout", "horizontal", "vertical", "pane", "command"
]);

// Lexer
function* lexer(input: string): Generator<Token> {
  let pos = 0;
  let line = 1;
  let column = 1;

  const peek = () => input[pos];
  const advance = () => {
    const ch = input[pos++];
    if (ch === "\n") { line++; column = 1; }
    else { column++; }
    return ch;
  };

  while (pos < input.length) {
    const ch = peek();

    // Skip whitespace
    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    // Skip comments
    if (ch === "#") {
      while (peek() !== "\n" && peek() !== undefined) advance();
      continue;
    }

    // String literal
    if (ch === '"') {
      const startCol = column;
      advance(); // consume "
      let value = "";
      while (peek() !== '"' && peek() !== undefined) {
        if (peek() === "\\") {
          advance();
          const escaped = advance();
          value += escaped;
        } else {
          value += advance();
        }
      }
      if (peek() === '"') advance(); // consume closing "
      yield { type: "STRING", value, line, column: startCol };
      continue;
    }

    // Braces
    if (ch === "{") { advance(); yield { type: "LBRACE", value: "{", line, column: column - 1 }; continue; }
    if (ch === "}") { advance(); yield { type: "RBRACE", value: "}", line, column: column - 1 }; continue; }

    // Keywords and identifiers
    if (/[a-zA-Z_]/.test(ch)) {
      const startCol = column;
      let value = "";
      while (/[a-zA-Z0-9_]/.test(peek() ?? "")) {
        value += advance();
      }
      const type = KEYWORDS.has(value) ? "KEYWORD" : "STRING";
      yield { type, value, line, column: startCol };
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character '${ch}' at line ${line}, column ${column}`);
  }

  yield { type: "EOF", value: "", line, column };
}

// Parser class
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(input: string) {
    this.tokens = Array.from(lexer(input));
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!;
  }

  private advance(): Token {
    return this.tokens[this.pos++] ?? this.tokens[this.tokens.length - 1]!;
  }

  private expect(type: TokenType, value?: string): Token {
    const tok = this.peek();
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      throw new Error(
        `Expected ${type}${value ? ` "${value}"` : ""} but got ${tok.type}${tok.value ? ` "${tok.value}"` : ""} at line ${tok.line}`
      );
    }
    return this.advance();
  }

  private match(type: TokenType, value?: string): boolean {
    const tok = this.peek();
    return tok.type === type && (value === undefined || tok.value === value);
  }

  private consume(type: TokenType, value?: string): boolean {
    if (this.match(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  parseModule(): TabbedModule {
    this.expect("KEYWORD", "module");
    const moduleId = this.expect("STRING").value;
    this.expect("LBRACE");

    const imports: string[] = [];
    let workspace: TabWorkspace | null = null;

    while (!this.match("RBRACE") && !this.match("EOF")) {
      if (this.match("KEYWORD", "import")) {
        this.advance();
        imports.push(this.expect("STRING").value);
      } else if (this.match("KEYWORD", "workspace")) {
        workspace = this.parseWorkspace();
      } else {
        throw new Error(`Unexpected token ${this.peek().value} at line ${this.peek().line}`);
      }
    }

    this.expect("RBRACE");

    if (!workspace) {
      throw new Error("Module must contain a workspace");
    }

    return {
      tag: "TabbedModule",
      moduleId,
      imports,
      workspace,
    };
  }

  private parseWorkspace(): TabWorkspace {
    this.expect("KEYWORD", "workspace");
    const name = this.expect("STRING").value;
    this.expect("LBRACE");

    const tabs: TabBlock[] = [];
    while (!this.match("RBRACE") && !this.match("EOF")) {
      tabs.push(this.parseTab());
    }

    this.expect("RBRACE");

    return { tag: "TabWorkspace", name, tabs };
  }

  private parseTab(): TabBlock {
    this.expect("KEYWORD", "tab");
    const name = this.expect("STRING").value;
    this.expect("KEYWORD", "in");
    const target = this.expect("STRING").value;

    // Optional layout clause
    let layout: LayoutKind = "horizontal";
    if (this.consume("KEYWORD", "layout")) {
      // Layout can be STRING or KEYWORD
      const layoutTok = this.match("STRING") ? this.advance().value : 
                       this.match("KEYWORD") ? this.advance().value : null;
      if (layoutTok !== "horizontal" && layoutTok !== "vertical") {
        throw new Error(`Invalid layout "${layoutTok}" at line ${this.peek().line}`);
      }
      layout = layoutTok as LayoutKind;
    }

    this.expect("LBRACE");

    const panes: PaneBlock[] = [];
    while (!this.match("RBRACE") && !this.match("EOF")) {
      panes.push(this.parsePane());
    }

    this.expect("RBRACE");

    // If no explicit panes, create implicit single pane
    if (panes.length === 0) {
      panes.push({ tag: "PaneBlock", layout: undefined, command: undefined });
    }

    return { tag: "TabBlock", name, target, layout, panes };
  }

  private parsePane(): PaneBlock {
    this.expect("KEYWORD", "pane");

    // Optional layout modifier
    let layout: LayoutKind | undefined;
    if (this.match("STRING") || this.match("KEYWORD")) {
      const layoutTok = this.advance().value;
      if (layoutTok === "horizontal" || layoutTok === "vertical") {
        layout = layoutTok as LayoutKind;
      } else {
        // Not a valid layout keyword - error
        throw new Error(`Expected layout (horizontal/vertical) or '{' but got "${layoutTok}" at line ${this.peek().line}`);
      }
    }

    this.expect("LBRACE");

    // Optional command clause
    let command: string | undefined;
    if (this.consume("KEYWORD", "command")) {
      command = this.expect("STRING").value;
    }

    this.expect("RBRACE");

    return { tag: "PaneBlock", layout, command };
  }
}

/**
 * Parse tabs module from source.
 */
export function parseTabsModule(input: string): TabbedModule {
  const parser = new Parser(input);
  return parser.parseModule();
}
