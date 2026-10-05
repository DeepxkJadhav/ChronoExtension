# AI CONTRACT: TIMELINE & BRANCH SUMMARIZATION

**Contract Version**: 1.0.0  
**Status**: Active  
**Role**: Optional Query Accelerator  

---

## 1. Objective
Given a sequence of raw semantic deltas or state nodes along a branch, generate a concise, human-readable summary of what was accomplished, refactored, or broken across that lineage.

---

## 2. Invariants & Guardrails
1. **Determinism Isolation**: The summary output is strictly advisory display metadata. It is never used to construct node CIDs or calculate DAG ancestry.
2. **Offline Fallback**: When no LLM provider is configured, the system falls back to a deterministic heuristic template (e.g. `"[Count] file edits across [N] paths by [Adapter]"`).
3. **Strict JSON Output**: The model must return valid JSON matching the schema below; no preamble, markdown wrapping, or conversational filler.

---

## 3. Input Specification

```json
{
  "contract_version": "1.0.0",
  "branch_name": "feature/auth-jwt",
  "start_cid": "b3_0123...",
  "end_cid": "b3_9876...",
  "delta_count": 14,
  "deltas_sample": [
    {
      "type": "text.splice",
      "target_uri": "file:///workspace/src/middleware/auth.ts",
      "forward": { "new_text": "verifyJwtToken(req)" },
      "context": { "ast_path": "FunctionDeclaration[name='authenticate']" }
    },
    {
      "type": "terminal.exec",
      "target_uri": "term://pty0",
      "forward": { "command": "npm test test/auth.spec.ts", "exit_code": 0 }
    }
  ]
}
```

---

## 4. Prompt Template

```markdown
You are the CHRONO Semantic Summarizer.
Analyze the following sequence of computational state deltas between nodes {{start_cid}} and {{end_cid}} on branch '{{branch_name}}'.
Describe the engineering intent, core modifications, and execution outcomes.

Respond ONLY with a JSON object conforming to this schema:
{
  "title": "Short 5-8 word imperative title",
  "summary": "1-2 sentence concise technical summary",
  "key_changes": [
    { "target": "file or resource path", "change_description": "specific action" }
  ],
  "outcome": "PASSED" | "FAILED" | "IN_PROGRESS" | "UNKNOWN"
}
```

---

## 5. Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "title": { "type": "string", "maxLength": 80 },
    "summary": { "type": "string", "maxLength": 300 },
    "key_changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target": { "type": "string" },
          "change_description": { "type": "string" }
        },
        "required": ["target", "change_description"]
      }
    },
    "outcome": { "type": "string", "enum": ["PASSED", "FAILED", "IN_PROGRESS", "UNKNOWN"] }
  },
  "required": ["title", "summary", "key_changes", "outcome"],
  "additionalProperties": false
}
```
