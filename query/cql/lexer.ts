/**
 * CHRONO QUERY LANGUAGE: LEXER
 * 
 * Tokenizer scanning raw CQL query strings into typed Token streams.
 */

import { TokenType } from "./tokens.ts";
import type { Token } from "./tokens.ts";

export class Lexer {
  private readonly source: string;
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];
      const startLine = this.line;
      const startCol = this.column;

      if (ch === "-" && this.source[this.pos + 1] === "-") {
        this.skipComment();
        continue;
      }

      if (ch === ";") {
        this.advance();
        tokens.push({ type: TokenType.SEMICOLON, value: ";", line: startLine, column: startCol });
      } else if (ch === ",") {
        this.advance();
        tokens.push({ type: TokenType.COMMA, value: ",", line: startLine, column: startCol });
      } else if (ch === ".") {
        this.advance();
        tokens.push({ type: TokenType.DOT, value: ".", line: startLine, column: startCol });
      } else if (ch === "(") {
        this.advance();
        tokens.push({ type: TokenType.LPAREN, value: "(", line: startLine, column: startCol });
      } else if (ch === ")") {
        this.advance();
        tokens.push({ type: TokenType.RPAREN, value: ")", line: startLine, column: startCol });
      } else if (ch === "[") {
        this.advance();
        tokens.push({ type: TokenType.LBRACKET, value: "[", line: startLine, column: startCol });
      } else if (ch === "]") {
        this.advance();
        tokens.push({ type: TokenType.RBRACKET, value: "]", line: startLine, column: startCol });
      } else if (ch === "=" && this.source[this.pos + 1] === "=") {
        this.advance(2);
        tokens.push({ type: TokenType.EQ, value: "==", line: startLine, column: startCol });
      } else if (ch === "=" && this.source[this.pos + 1] === "~") {
        this.advance(2);
        tokens.push({ type: TokenType.MATCH, value: "=~", line: startLine, column: startCol });
      } else if (ch === "!" && this.source[this.pos + 1] === "=") {
        this.advance(2);
        tokens.push({ type: TokenType.NEQ, value: "!=", line: startLine, column: startCol });
      } else if (ch === "<" && this.source[this.pos + 1] === "=") {
        this.advance(2);
        tokens.push({ type: TokenType.LTE, value: "<=", line: startLine, column: startCol });
      } else if (ch === "<") {
        this.advance();
        tokens.push({ type: TokenType.LT, value: "<", line: startLine, column: startCol });
      } else if (ch === ">" && this.source[this.pos + 1] === "=") {
        this.advance(2);
        tokens.push({ type: TokenType.GTE, value: ">=", line: startLine, column: startCol });
      } else if (ch === ">") {
        this.advance();
        tokens.push({ type: TokenType.GT, value: ">", line: startLine, column: startCol });
      } else if (ch === "'" || ch === '"') {
        tokens.push(this.readString(ch, startLine, startCol));
      } else if (this.isDigit(ch)) {
        tokens.push(this.readNumber(startLine, startCol));
      } else if (this.isAlpha(ch)) {
        tokens.push(this.readIdentifier(startLine, startCol));
      } else if (ch === "*") {
        this.advance();
        tokens.push({ type: TokenType.IDENTIFIER, value: "*", line: startLine, column: startCol });
      } else {
        throw new SyntaxError(`Unexpected character '${ch}' at line ${startLine}, col ${startCol}`);
      }
    }

    tokens.push({ type: TokenType.EOF, value: "", line: this.line, column: this.column });
    return tokens;
  }

  private advance(count = 1): void {
    for (let i = 0; i < count; i++) {
      if (this.pos < this.source.length) {
        if (this.source[this.pos] === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      }
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance();
    }
  }

  private skipComment(): void {
    while (this.pos < this.source.length && this.source[this.pos] !== "\n") {
      this.advance();
    }
  }

  private readString(quote: string, line: number, column: number): Token {
    this.advance(); // consume opening quote
    let str = "";
    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === "\\" && this.pos + 1 < this.source.length) {
        this.advance();
        str += this.source[this.pos];
      } else {
        str += this.source[this.pos];
      }
      this.advance();
    }
    if (this.pos >= this.source.length) {
      throw new SyntaxError(`Unterminated string starting at line ${line}, col ${column}`);
    }
    this.advance(); // consume closing quote
    return { type: TokenType.STRING, value: str, line, column };
  }

  private readNumber(line: number, column: number): Token {
    let numStr = "";
    while (this.pos < this.source.length && (this.isDigit(this.source[this.pos]) || this.source[this.pos] === ".")) {
      numStr += this.source[this.pos];
      this.advance();
    }
    return { type: TokenType.NUMBER, value: numStr, line, column };
  }

  private readIdentifier(line: number, column: number): Token {
    let id = "";
    while (this.pos < this.source.length && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === "_" || this.source[this.pos] === "/")) {
      id += this.source[this.pos];
      this.advance();
    }

    const upper = id.toUpperCase();
    const keywordMap: Record<string, TokenType> = {
      SELECT: TokenType.SELECT,
      FROM: TokenType.FROM,
      WHERE: TokenType.WHERE,
      ORDER: TokenType.ORDER,
      BY: TokenType.BY,
      ASC: TokenType.ASC,
      DESC: TokenType.DESC,
      LIMIT: TokenType.LIMIT,
      OFFSET: TokenType.OFFSET,
      AND: TokenType.AND,
      OR: TokenType.OR,
      NOT: TokenType.NOT,
      IN: TokenType.IN,
      TRUE: TokenType.TRUE,
      FALSE: TokenType.FALSE,
      NULL: TokenType.NULL,
    };

    if (keywordMap[upper]) {
      return { type: keywordMap[upper], value: upper, line, column };
    }

    return { type: TokenType.IDENTIFIER, value: id, line, column };
  }

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isAlpha(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}
