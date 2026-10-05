/**
 * CHRONO QUERY LANGUAGE: PARSER
 * 
 * Recursive descent parser constructing CqlQuery AST from tokens.
 */

import { TokenType } from "./tokens.ts";
import type { Token } from "./tokens.ts";
import { Lexer } from "./lexer.ts";
import type {
  CqlQuery,
  ProjectionItem,
  GraphSource,
  Expression,
  BinaryExpr,
  PathExpr,
  FunctionCallExpr,
  LiteralExpr,
  OrderByClause,
  LimitClause,
} from "./ast.ts";

export class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(cql: string): CqlQuery {
    const lexer = new Lexer(cql);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parseQuery();
  }

  public parseQuery(): CqlQuery {
    this.consume(TokenType.SELECT, "Expected 'SELECT' at start of query");
    const projections = this.parseProjectionList();

    this.consume(TokenType.FROM, "Expected 'FROM' after projections");
    const source = this.parseGraphSource();

    let whereClause: Expression | undefined;
    if (this.match(TokenType.WHERE)) {
      whereClause = this.parseExpression();
    }

    let orderBy: OrderByClause | undefined;
    if (this.match(TokenType.ORDER)) {
      this.consume(TokenType.BY, "Expected 'BY' after 'ORDER'");
      const path = this.parsePathExpression();
      let direction: "ASC" | "DESC" = "ASC";
      if (this.match(TokenType.DESC)) {
        direction = "DESC";
      } else if (this.match(TokenType.ASC)) {
        direction = "ASC";
      }
      orderBy = { type: "OrderBy", path, direction };
    }

    let limit: LimitClause | undefined;
    if (this.match(TokenType.LIMIT)) {
      const limitTok = this.consume(TokenType.NUMBER, "Expected number after LIMIT");
      let offset: number | undefined;
      if (this.match(TokenType.OFFSET)) {
        const offsetTok = this.consume(TokenType.NUMBER, "Expected number after OFFSET");
        offset = parseInt(offsetTok.value, 10);
      }
      limit = { type: "Limit", limit: parseInt(limitTok.value, 10), offset };
    }

    this.match(TokenType.SEMICOLON); // Optional trailing semicolon

    return {
      type: "Query",
      projections,
      source,
      whereClause,
      orderBy,
      limit,
    };
  }

  private parseProjectionList(): ProjectionItem[] {
    const items: ProjectionItem[] = [];
    do {
      const expr = this.parseExpression();
      items.push({ type: "ProjectionItem", expression: expr });
    } while (this.match(TokenType.COMMA));
    return items;
  }

  private parseGraphSource(): GraphSource {
    const tok = this.peek();
    if (this.match(TokenType.IDENTIFIER)) {
      const name = tok.value.toLowerCase();
      this.consume(TokenType.LPAREN, `Expected '(' after ${name}`);

      if (name === "branch") {
        const arg = this.consume(TokenType.STRING, "Expected string branch name in branch('name')");
        this.consume(TokenType.RPAREN, "Expected ')' after branch argument");
        return { type: "BranchSource", branchName: arg.value };
      } else if (name === "lineage") {
        const arg = this.consume(TokenType.STRING, "Expected string node CID in lineage('cid')");
        this.consume(TokenType.RPAREN, "Expected ')' after lineage argument");
        return { type: "LineageSource", nodeCid: arg.value };
      } else if (name === "epoch") {
        const arg = this.advance();
        if (arg.type !== TokenType.STRING && arg.type !== TokenType.NUMBER) {
          throw new SyntaxError(`Expected epoch identifier at line ${arg.line}`);
        }
        this.consume(TokenType.RPAREN, "Expected ')' after epoch argument");
        return { type: "EpochSource", epochId: arg.value };
      } else if (name === "dag") {
        this.consume(TokenType.RPAREN, "Expected ')' for dag()");
        return { type: "DagSource" };
      }
    }

    throw new SyntaxError(`Expected valid graph source at line ${tok.line}, col ${tok.column}`);
  }

  private parseExpression(): Expression {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalAnd();
    while (this.match(TokenType.OR)) {
      const right = this.parseLogicalAnd();
      left = { type: "BinaryExpression", operator: "OR", left, right };
    }
    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseEquality();
    while (this.match(TokenType.AND)) {
      const right = this.parseEquality();
      left = { type: "BinaryExpression", operator: "AND", left, right };
    }
    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseRelational();
    while (this.check(TokenType.EQ) || this.check(TokenType.NEQ) || this.check(TokenType.MATCH)) {
      const opTok = this.advance();
      const right = this.parseRelational();
      left = {
        type: "BinaryExpression",
        operator: opTok.value as "==" | "!=" | "=~",
        left,
        right,
      };
    }
    return left;
  }

  private parseRelational(): Expression {
    let left = this.parsePrimary();
    while (
      this.check(TokenType.LT) ||
      this.check(TokenType.LTE) ||
      this.check(TokenType.GT) ||
      this.check(TokenType.GTE) ||
      this.check(TokenType.IN)
    ) {
      const opTok = this.advance();
      const right = this.parsePrimary();
      left = {
        type: "BinaryExpression",
        operator: opTok.value as "<" | "<=" | ">" | ">=" | "IN",
        left,
        right,
      };
    }
    return left;
  }

  private parsePrimary(): Expression {
    if (this.match(TokenType.NOT)) {
      const argument = this.parsePrimary();
      return { type: "UnaryExpression", operator: "NOT", argument };
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    if (this.match(TokenType.STRING)) {
      return { type: "Literal", valueType: "string", value: this.previous().value };
    }

    if (this.match(TokenType.NUMBER)) {
      const val = parseFloat(this.previous().value);
      return { type: "Literal", valueType: "number", value: val };
    }

    if (this.match(TokenType.TRUE)) {
      return { type: "Literal", valueType: "boolean", value: true };
    }

    if (this.match(TokenType.FALSE)) {
      return { type: "Literal", valueType: "boolean", value: false };
    }

    if (this.match(TokenType.NULL)) {
      return { type: "Literal", valueType: "null", value: null };
    }

    // Function call or Path
    if (this.check(TokenType.IDENTIFIER)) {
      if (this.peekNext()?.type === TokenType.LPAREN) {
        return this.parseFunctionCall();
      }
      return this.parsePathExpression();
    }

    const curr = this.peek();
    throw new SyntaxError(`Unexpected token '${curr.value}' at line ${curr.line}, col ${curr.column}`);
  }

  private parseFunctionCall(): FunctionCallExpr {
    const idTok = this.consume(TokenType.IDENTIFIER, "Expected function name");
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    const args: Expression[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after function arguments");
    return { type: "FunctionCall", name: idTok.value, arguments: args };
  }

  private parsePathExpression(): PathExpr {
    const parts: string[] = [];
    const firstTok = this.consume(TokenType.IDENTIFIER, "Expected identifier");
    parts.push(firstTok.value);

    while (this.match(TokenType.DOT) || this.match(TokenType.LBRACKET)) {
      const prev = this.previous();
      if (prev.type === TokenType.DOT) {
        const nextId = this.consume(TokenType.IDENTIFIER, "Expected identifier after '.'");
        parts.push(nextId.value);
      } else {
        // [ 'key' ] or [ index ]
        const idxTok = this.advance();
        parts.push(idxTok.value);
        this.consume(TokenType.RBRACKET, "Expected ']' after path index");
      }
    }

    return { type: "PathExpression", parts };
  }

  private match(...types: TokenType[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const curr = this.peek();
    throw new SyntaxError(`${message} at line ${curr.line}, col ${curr.column} (got '${curr.value}')`);
  }
}
