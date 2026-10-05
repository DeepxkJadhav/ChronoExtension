# AI CONTRACT: NATURAL LANGUAGE TO CQL COMPILER

**Contract Version**: 1.0.0  
**Status**: Active  
**Role**: Query Frontend Accelerator  

---

## 1. Objective
Translate ambiguous natural-language human developer queries into strictly valid, type-safe Chrono Query Language (CQL) queries adhering to `spec/CQL.md`.

---

## 2. Invariants & Guardrails
1. **Never Execute Hallucinations**: The compiled CQL must be validated against the formal grammar before query planning. If grammar validation fails, return an error rather than executing.
2. **Safe Read-Only Scope**: CQL statements emitted must be read-only (`SELECT ... FROM ... WHERE ...`).
3. **Deterministic Fallback**: If offline or disabled, the query engine prompts the user for standard CQL syntax.

---

## 3. Input Specification

```json
{
  "contract_version": "1.0.0",
  "user_prompt": "Find when the test suite failed right after I edited the database connection",
  "context": {
    "active_branch": "main",
    "recent_files": ["src/db/connection.ts", "package.json"],
    "available_branches": ["main", "refactor/db"]
  }
}
```

---

## 4. Prompt Template

```markdown
You are the CHRONO Query Compiler.
Translate the user's natural language question into a valid Chrono Query Language (CQL) statement.

CQL Rules:
- Only read statements: SELECT <projections> FROM <source> WHERE <predicates> [ORDER BY <field>] [LIMIT <n>];
- Valid sources: branch('name'), epoch('id'), lineage('cid'), dag()
- Standard fields: node, delta, cid, clock, wall_time, delta.target_uri, delta.type

User Question: "{{user_prompt}}"
Active Branch: "{{context.active_branch}}"

Output ONLY valid JSON matching this schema:
{
  "cql": "SELECT ...;",
  "explanation": "Brief reasoning for query construction",
  "confidence": 0.0 to 1.0
}
```

---

## 5. Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "cql": { "type": "string" },
    "explanation": { "type": "string" },
    "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
  },
  "required": ["cql", "explanation", "confidence"],
  "additionalProperties": false
}
```
