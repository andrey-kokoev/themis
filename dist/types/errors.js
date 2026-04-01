/**
 * Parser Error Classes
 *
 * Defined per lawbook 002-minimal-parser-contract-v0
 */
export class ParseError extends Error {
    className;
    position;
    constructor(className, message, position) {
        super(message);
        this.className = className;
        this.position = position;
        this.name = className;
    }
}
export class UnexpectedToken extends ParseError {
    received;
    constructor(expected, received, position) {
        super("UnexpectedToken", `Expected ${expected}, received "${received}"`, position);
        this.received = received;
    }
}
export class UnexpectedEOF extends ParseError {
    constructor(context) {
        super("UnexpectedEOF", `Unexpected end of file while parsing ${context}`);
    }
}
export class MissingRequiredClause extends ParseError {
    constructor(clause, context) {
        super("MissingRequiredClause", `Missing required clause "${clause}" in ${context}`);
    }
}
export class InvalidNesting extends ParseError {
    constructor(what, where) {
        super("InvalidNesting", `"${what}" cannot appear inside "${where}"`);
    }
}
export class TrailingRootContent extends ParseError {
    constructor(content) {
        super("TrailingRootContent", `Trailing content after workspace: "${content}"`);
    }
}
//# sourceMappingURL=errors.js.map