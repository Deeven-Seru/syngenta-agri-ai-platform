# Restrict Repository Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a GitHub Repository Ruleset to restrict direct pushes to all branches except for `Deeven-Seru` and `tejanvk43`.

**Architecture:** Use the GitHub REST API via the `gh` CLI to create a branch ruleset targeting `~ALL` with specific user bypasses.

**Tech Stack:** GitHub CLI (`gh`), JSON.

---

### Task 1: Create Ruleset Payload

**Files:**
- Create: `ruleset_payload.json`

- [ ] **Step 1: Write the payload to a temporary file**

```json
{
  "name": "Restrict Direct Pushes to All Branches",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~ALL"],
      "exclude": []
    }
  },
  "bypass_actors": [
    {
      "actor_id": 144827577,
      "actor_type": "User",
      "bypass_mode": "always"
    },
    {
      "actor_id": 200023128,
      "actor_type": "User",
      "bypass_mode": "always"
    }
  ],
  "rules": [
    {
      "type": "update"
    },
    {
      "type": "deletion"
    }
  ]
}
```

- [ ] **Step 2: Verify file content**
Run: `cat ruleset_payload.json`
Expected: The JSON structure above.

---

### Task 2: Create Repository Ruleset

**Files:**
- Modify: N/A (External API Call)

- [ ] **Step 1: Execute GitHub API command**

Run:
```bash
gh api --method POST /repos/Deeven-Seru/syngenta-agri-ai-platform/rulesets \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  --input ruleset_payload.json
```

Expected: A JSON response containing the new ruleset ID and details.

---

### Task 3: Verify and Cleanup

**Files:**
- Delete: `ruleset_payload.json`

- [ ] **Step 1: List rulesets to verify creation**

Run: `gh api repos/Deeven-Seru/syngenta-agri-ai-platform/rulesets --jq '.[0].name'`
Expected: `Restrict Direct Pushes to All Branches`

- [ ] **Step 2: Delete temporary payload file**

Run: `rm ruleset_payload.json`

- [ ] **Step 3: Commit the plan and spec** (Already done for spec, but good to ensure everything is synced).
