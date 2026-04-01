/**
 * Minimal Parser for Themis DSL Subset
 *
 * Implements the parser contract defined in lawbook 002.
 * Enforces laws P1-P5 for the scoped subset.
 */
import { UnexpectedToken, UnexpectedEOF, MissingRequiredClause, InvalidNesting, TrailingRootContent, } from "../types/errors.js";
// Lexer: converts input string to token stream
function* lexer(input) {
    let pos = 0;
    let line = 1;
    let column = 1;
    const keywords = new Set([
        "workspace",
        "context",
        "persistence",
        "equivalence",
        "role",
        "kind",
        "subject",
        "identity",
        "reference",
        "locator",
        "realizer",
        "witness",
        "relation",
    ]);
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
    while (pos < input.length) {
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
            if (peek() !== '"') {
                throw new UnexpectedEOF("string literal");
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
        // Identifiers/keywords
        if (/[a-zA-Z_]/.test(ch)) {
            let value = "";
            while (peek() && /[a-zA-Z0-9_-]/.test(peek())) {
                value += advance();
            }
            const type = keywords.has(value) ? "KEYWORD" : "STRING";
            yield { type, value, line: startLine, column: startCol };
            continue;
        }
        // Unknown character
        throw new UnexpectedToken("valid token", ch, { line, column });
    }
    yield { type: "EOF", value: "", line, column };
}
// Parser class
class Parser {
    tokens = [];
    pos = 0;
    constructor(input) {
        this.tokens = Array.from(lexer(input));
    }
    peek() {
        return this.tokens[this.pos] ?? { type: "EOF", value: "", line: 0, column: 0 };
    }
    advance() {
        return this.tokens[this.pos++] ?? { type: "EOF", value: "", line: 0, column: 0 };
    }
    expectKeyword(keyword) {
        const tok = this.peek();
        if (tok.type !== "KEYWORD" || tok.value !== keyword) {
            throw new UnexpectedToken(`keyword "${keyword}"`, tok.value, {
                line: tok.line,
                column: tok.column,
            });
        }
        this.advance();
    }
    expectString() {
        const tok = this.peek();
        if (tok.type !== "STRING") {
            throw new UnexpectedToken("string literal", tok.value, {
                line: tok.line,
                column: tok.column,
            });
        }
        this.advance();
        return tok.value;
    }
    expectLBrace() {
        const tok = this.peek();
        if (tok.type !== "LBRACE") {
            throw new UnexpectedToken("'{'", tok.value, {
                line: tok.line,
                column: tok.column,
            });
        }
        this.advance();
    }
    expectRBrace() {
        const tok = this.peek();
        if (tok.type === "EOF") {
            throw new UnexpectedEOF("block");
        }
        if (tok.type !== "RBRACE") {
            throw new UnexpectedToken("'}", tok.value, {
                line: tok.line,
                column: tok.column,
            });
        }
        this.advance();
    }
    checkEOF(context) {
        if (this.peek().type !== "EOF") {
            throw new UnexpectedEOF(context);
        }
    }
    // P1.1, P1.3: Parse workspace root
    parseWorkspace() {
        this.expectKeyword("workspace");
        const name = this.expectString();
        this.expectLBrace();
        const items = this.parseWorkspaceItems();
        this.expectRBrace();
        // P1.2: Check for trailing content
        const after = this.peek();
        if (after.type !== "EOF") {
            throw new TrailingRootContent(after.value);
        }
        return { tag: "Workspace", name, items };
    }
    // Parse workspace-level items
    parseWorkspaceItems() {
        const items = [];
        let hasContext = false;
        let hasPersistence = false;
        let hasEquivalence = false;
        let hasRole = false;
        while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
            const tok = this.peek();
            if (tok.type !== "KEYWORD") {
                throw new UnexpectedToken("workspace-level keyword", tok.value);
            }
            switch (tok.value) {
                case "context":
                    if (hasContext) {
                        throw new UnexpectedToken("single context block", "additional context");
                    }
                    items.push(this.parseContextBlock());
                    hasContext = true;
                    break;
                case "persistence":
                    if (hasPersistence) {
                        throw new UnexpectedToken("single persistence clause", "additional persistence");
                    }
                    items.push(this.parsePersistenceClause());
                    hasPersistence = true;
                    break;
                case "equivalence":
                    if (hasEquivalence) {
                        throw new UnexpectedToken("single equivalence clause", "additional equivalence");
                    }
                    items.push(this.parseEquivalenceClause());
                    hasEquivalence = true;
                    break;
                case "role":
                    items.push(this.parseRoleBlock());
                    hasRole = true;
                    break;
                case "relation":
                    items.push(this.parseRelationBlock());
                    break;
                default:
                    // P2.1-P2.4: Invalid nesting detection
                    if (["subject", "kind", "identity", "reference", "locator", "realizer", "witness"].includes(tok.value)) {
                        throw new InvalidNesting(tok.value, "workspace");
                    }
                    throw new UnexpectedToken("workspace-level item", tok.value);
            }
        }
        // P3.1: Validate workspace requirements
        if (!hasContext) {
            throw new MissingRequiredClause("context", "workspace");
        }
        if (!hasPersistence) {
            throw new MissingRequiredClause("persistence", "workspace");
        }
        if (!hasEquivalence) {
            throw new MissingRequiredClause("equivalence", "workspace");
        }
        if (!hasRole) {
            throw new MissingRequiredClause("role", "workspace");
        }
        return items;
    }
    parseContextBlock() {
        this.expectKeyword("context");
        this.expectLBrace();
        const entries = [];
        while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
            const key = this.expectString();
            const value = this.expectString();
            entries.push({ tag: "ContextEntry", key, value });
        }
        this.expectRBrace();
        return { tag: "ContextBlock", entries };
    }
    parsePersistenceClause() {
        this.expectKeyword("persistence");
        const mode = this.expectString();
        return { tag: "PersistenceClause", mode };
    }
    parseEquivalenceClause() {
        this.expectKeyword("equivalence");
        const name = this.expectString();
        return { tag: "EquivalenceClause", name };
    }
    parseRoleBlock() {
        this.expectKeyword("role");
        const roleId = this.expectString();
        this.expectLBrace();
        let kind;
        let subject;
        const realizers = [];
        const witnesses = [];
        while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
            const tok = this.peek();
            if (tok.type !== "KEYWORD") {
                throw new UnexpectedToken("role-level keyword", tok.value);
            }
            switch (tok.value) {
                case "kind":
                    if (kind) {
                        throw new UnexpectedToken("single kind clause", "additional kind");
                    }
                    this.advance();
                    kind = this.expectString();
                    break;
                case "subject":
                    if (subject) {
                        throw new UnexpectedToken("single subject block", "additional subject");
                    }
                    subject = this.parseSubjectBlock();
                    break;
                case "realizer":
                    realizers.push(this.parseRealizerBlock());
                    break;
                case "witness":
                    witnesses.push(this.parseWitnessBlock());
                    break;
                default:
                    // P2.2: context at role level is invalid
                    if (tok.value === "context") {
                        throw new InvalidNesting("context", "role");
                    }
                    throw new UnexpectedToken("role-level item", tok.value);
            }
        }
        this.expectRBrace();
        // P3.2: Validate role requirements
        if (!kind) {
            throw new MissingRequiredClause("kind", "role");
        }
        if (!subject) {
            throw new MissingRequiredClause("subject", "role");
        }
        if (realizers.length === 0) {
            throw new MissingRequiredClause("realizer", "role");
        }
        if (witnesses.length === 0) {
            throw new MissingRequiredClause("witness", "role");
        }
        return {
            tag: "RoleBlock",
            roleId,
            kind,
            subject,
            realizers,
            witnesses,
        };
    }
    parseSubjectBlock() {
        this.expectKeyword("subject");
        this.expectLBrace();
        let identity;
        let reference;
        let locator;
        while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
            const tok = this.peek();
            if (tok.type !== "KEYWORD") {
                throw new UnexpectedToken("subject-level keyword", tok.value);
            }
            switch (tok.value) {
                case "identity":
                    if (identity) {
                        throw new UnexpectedToken("single identity", "additional identity");
                    }
                    this.advance();
                    identity = this.expectString();
                    break;
                case "reference":
                    if (reference) {
                        throw new UnexpectedToken("single reference", "additional reference");
                    }
                    this.advance();
                    reference = this.expectString();
                    break;
                case "locator":
                    if (locator) {
                        throw new UnexpectedToken("single locator", "additional locator");
                    }
                    this.advance();
                    locator = this.expectString();
                    break;
                default:
                    throw new UnexpectedToken("subject-level item", tok.value);
            }
        }
        this.expectRBrace();
        // P3.2: Validate subject requirements
        if (!identity) {
            throw new MissingRequiredClause("identity", "subject");
        }
        if (!reference) {
            throw new MissingRequiredClause("reference", "subject");
        }
        return {
            tag: "SubjectBlock",
            identity,
            reference,
            locator,
        };
    }
    parseRealizerBlock() {
        this.expectKeyword("realizer");
        const className = this.expectString();
        const payload = this.expectString();
        return { tag: "RealizerBlock", class: className, payload };
    }
    parseWitnessBlock() {
        this.expectKeyword("witness");
        const className = this.expectString();
        const payload = this.expectString();
        return { tag: "WitnessBlock", class: className, payload };
    }
    parseRelationBlock() {
        this.expectKeyword("relation");
        const kind = this.expectString();
        const source = this.expectString();
        const target = this.expectString();
        return { tag: "RelationBlock", kind, source, target };
    }
}
// P4.1: Deterministic parse function
export function parse(input) {
    const parser = new Parser(input);
    return parser.parseWorkspace();
}
//# sourceMappingURL=minimal-parser.js.map