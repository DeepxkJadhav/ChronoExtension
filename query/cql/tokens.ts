/**
 * CHRONO QUERY LANGUAGE: TOKENS
 * 
 * Token definitions for CQL lexer matching spec/CQL.md.
 */

export const TokenType = {
  // Keywords
  SELECT: "SELECT",
  FROM: "FROM",
  WHERE: "WHERE",
  ORDER: "ORDER",
  BY: "BY",
  ASC: "ASC",
  DESC: "DESC",
  LIMIT: "LIMIT",
  OFFSET: "OFFSET",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  IN: "IN",
  TRUE: "TRUE",
  FALSE: "FALSE",
  NULL: "NULL",

  // Literals & Identifiers
  IDENTIFIER: "IDENTIFIER",
  STRING: "STRING",
  NUMBER: "NUMBER",

  // Operators & Punctuators
  COMMA: "COMMA",
  DOT: "DOT",
  SEMICOLON: "SEMICOLON",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  EQ: "EQ",       // ==
  NEQ: "NEQ",     // !=
  LT: "LT",       // <
  LTE: "LTE",     // <=
  GT: "GT",       // >
  GTE: "GTE",     // >=
  MATCH: "MATCH", // =~

  EOF: "EOF",
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
