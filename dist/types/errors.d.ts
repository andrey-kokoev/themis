/**
 * Parser Error Classes
 *
 * Defined per lawbook 002-minimal-parser-contract-v0
 */
export declare class ParseError extends Error {
    readonly className: string;
    readonly position?: {
        line: number;
        column: number;
    } | undefined;
    constructor(className: string, message: string, position?: {
        line: number;
        column: number;
    } | undefined);
}
export declare class UnexpectedToken extends ParseError {
    readonly received: string;
    constructor(expected: string, received: string, position?: {
        line: number;
        column: number;
    });
}
export declare class UnexpectedEOF extends ParseError {
    constructor(context: string);
}
export declare class MissingRequiredClause extends ParseError {
    constructor(clause: string, context: string);
}
export declare class InvalidNesting extends ParseError {
    constructor(what: string, where: string);
}
export declare class TrailingRootContent extends ParseError {
    constructor(content: string);
}
//# sourceMappingURL=errors.d.ts.map