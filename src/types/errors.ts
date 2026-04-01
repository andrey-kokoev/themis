/**
 * Parser Error Classes
 * 
 * Defined per lawbook 002-minimal-parser-contract-v0
 */

export class ParseError extends Error {
  constructor(
    public readonly className: string,
    message: string,
    public readonly position?: { line: number; column: number }
  ) {
    super(message);
    this.name = className;
  }
}

export class UnexpectedToken extends ParseError {
  constructor(
    expected: string,
    public readonly received: string,
    position?: { line: number; column: number }
  ) {
    super(
      "UnexpectedToken",
      `Expected ${expected}, received "${received}"`,
      position
    );
  }
}

export class UnexpectedEOF extends ParseError {
  constructor(context: string) {
    super("UnexpectedEOF", `Unexpected end of file while parsing ${context}`);
  }
}

export class MissingRequiredClause extends ParseError {
  constructor(clause: string, context: string) {
    super(
      "MissingRequiredClause",
      `Missing required clause "${clause}" in ${context}`
    );
  }
}

export class InvalidNesting extends ParseError {
  constructor(what: string, where: string) {
    super(
      "InvalidNesting",
      `"${what}" cannot appear inside "${where}"`
    );
  }
}

export class TrailingRootContent extends ParseError {
  constructor(content: string) {
    super(
      "TrailingRootContent",
      `Trailing content after workspace: "${content}"`
    );
  }
}
