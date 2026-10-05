# AI CONTRACT: SEMANTIC DIFF EXPLAINER

**Contract Version**: 1.0.0  
**Status**: Active  
**Role**: Optional Query Accelerator  

---

## 1. Objective
Given two state nodes $A$ and $B$ (or divergent branch heads), explain the high-level behavioral and architectural differences between them, highlighting potential breaking changes, regressions, or performance implications.

---

## 2. Invariants & Guardrails
1. **Advisory View**: Outputs are used exclusively in UI diff dialogs and CLI explanations.
2. **Deterministic Fallback**: If offline or disabled, output raw delta listings and file patch statistics.
3. **Structured Format**: Must produce valid JSON with categorized changes (breaking, structural, cosmetic).

---

## 3. Input Specification

```json
{
  "contract_version": "1.0.0",
  "base_cid": "b3_base...",
  "target_cid": "b3_target...",
  "delta_summary": {
    "total_deltas": 8,
    "modified_targets": ["src/api/routes.ts", "package.json"],
    "operations": [
      {
        "type": "text.splice",
        "target": "src/api/routes.ts",
        "removed": "app.get('/users', oldHandler)",
        "added": "app.get('/v2/users', newHandler)"
      }
    ]
  }
}
```

---

## 4. Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "breaking_changes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "behavioral_shifts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "risk_level": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    },
    "rationale": { "type": "string" }
  },
  "required": ["breaking_changes", "behavioral_shifts", "risk_level", "rationale"],
  "additionalProperties": false
}
```
