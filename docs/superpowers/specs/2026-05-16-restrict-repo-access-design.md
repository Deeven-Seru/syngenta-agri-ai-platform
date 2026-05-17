# Design Spec: Repository Access Restriction for Syngenta Agri-AI Platform

## Goal
Restrict commit access to the `Deeven-Seru/syngenta-agri-ai-platform` repository so that only `Deeven-Seru` and `tejanvk43` can push directly to any branch. All other users must use Pull Requests (from forks).

## Architecture
We will use **GitHub Repository Rulesets** to enforce this. Rulesets are more flexible and powerful than traditional branch protection, especially for applying rules to all branches simultaneously.

## Configuration Details

### Ruleset Properties
- **Name**: `Restrict Direct Pushes to All Branches`
- **Target**: `branch`
- **Enforcement**: `active`
- **Conditions**:
    - **ref_name**: `{"include": ["~ALL"], "exclude": []}` (Targets every branch in the repo)

### Bypass Actors
The following users are granted `always` bypass mode, allowing them to push directly:
1. **Deeven-Seru** (Actor ID: `144827577`, Type: `User`)
2. **tejanvk43** (Actor ID: `200023128`, Type: `User`)

### Rules
1. **Restrict Updates (`update`)**: Prevents any pushes that update existing branches.
2. **Restrict Deletions (`deletion`)**: Prevents branches from being deleted.

## Implementation Steps
1. Prepare the JSON payload for the GitHub API.
2. Execute the `gh api` command to create the ruleset:
   ```bash
   gh api --method POST /repos/Deeven-Seru/syngenta-agri-ai-platform/rulesets \
     -H "X-GitHub-Api-Version: 2022-11-28" \
     --input payload.json
   ```
3. Verify the ruleset exists and is active.

## Success Criteria
- `Deeven-Seru` can push to `main` and feature branches.
- `tejanvk43` can push to `main` and feature branches.
- Any other user attempting to push to any branch receives a "protected branch" error from GitHub and is forced to use a PR.
