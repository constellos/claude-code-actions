# Claude Code Review Actions

AI-powered code review using Claude - modular GitHub Actions for automated PR quality checks.

## Overview

This repository provides a suite of 8 composable GitHub Actions for comprehensive PR reviews using Claude AI. Each action focuses on a specific aspect of code quality, from requirements compliance to visual design.

### Available Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **requirements-reviewer** | Reviews changes against issue requirements | Ensure PRs meet acceptance criteria |
| **code-quality-reviewer** | Evaluates DRY, YAGNI, modularity | Maintain code quality standards |
| **context-reviewer** | Validates against CLAUDE.md patterns | Enforce architectural consistency |
| **visual-reviewer** | Analyzes UI screenshots | Catch visual regressions |
| **ux-reviewer** | Detects UX issues and console errors | Improve user experience |
| **review-comment** | Manages consolidated PR comments | Display all review results |
| **changed-files** | Detects file changes efficiently | Optimize CI workflows |
| **capture-routes** | Discovers routes and captures screenshots | Automate visual testing |

## Quick Start

### Simple Usage (Root Action)

Use the root action to run a single review type:

```yaml
name: PR Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run requirements review
        uses: constellos/claude-code-actions@v1
        with:
          review_type: 'requirements'
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          pr_number: ${{ github.event.pull_request.number }}
          branch: ${{ github.head_ref }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Full CI Pipeline

For complete CI with all reviewers, see the [org-level reusable workflow](#org-level-workflows) pattern.

## Action Details

### 1. Requirements Reviewer

Reviews PR changes against GitHub issue requirements.

**Path**: `constellos/claude-code-actions/.github/actions/requirements-reviewer@v1`

**Inputs**:
- `claude_code_oauth_token` (required): Claude Code OAuth token
- `pr_number` (required): Pull request number
- `branch` (required): Branch name for issue extraction
- `github_token` (required): GitHub token

**Outputs**:
- `passed`: Whether review passed (true/false)
- `result`: JSON result with summary

**Example**:
```yaml
- name: Requirements Review
  uses: constellos/claude-code-actions/.github/actions/requirements-reviewer@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    pr_number: ${{ github.event.pull_request.number }}
    branch: ${{ github.head_ref }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Custom Prompts**: Create `.claude/agents/reviewers/requirements.md` to customize the review prompt.

---

### 2. Code Quality Reviewer

Evaluates code quality using DRY, YAGNI, modularity principles.

**Path**: `constellos/claude-code-actions/.github/actions/code-quality-reviewer@v1`

**Inputs**:
- `claude_code_oauth_token` (required): Claude Code OAuth token
- `pr_number` (required): Pull request number
- `github_token` (required): GitHub token

**Outputs**:
- `passed`: Whether review passed
- `result`: JSON result with summary

**Example**:
```yaml
- name: Code Quality Review
  uses: constellos/claude-code-actions/.github/actions/code-quality-reviewer@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Custom Prompts**: Create `.claude/agents/reviewers/code-quality.md` to customize.

---

### 3. Context Reviewer

Validates changes against CLAUDE.md context files.

**Path**: `constellos/claude-code-actions/.github/actions/context-reviewer@v1`

**Inputs**:
- `claude_code_oauth_token` (required): Claude Code OAuth token
- `pr_number` (required): Pull request number
- `github_token` (required): GitHub token

**Outputs**:
- `passed`: Whether review passed
- `result`: JSON result with summary

**Example**:
```yaml
- name: Context Review
  uses: constellos/claude-code-actions/.github/actions/context-reviewer@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Custom Prompts**: Create `.claude/agents/reviewers/context.md` to customize.

**Note**: Automatically finds parent CLAUDE.md files for each changed file.

---

### 4. Visual Reviewer

Analyzes UI screenshots for design, accessibility, and visual regressions.

**Path**: `constellos/claude-code-actions/.github/actions/visual-reviewer@v1`

**Inputs**:
- `claude_code_oauth_token` (required): Claude Code OAuth token
- `pr_number` (required): Pull request number
- `github_token` (required): GitHub token
- `screenshots_dir` (optional): Directory containing screenshots (default: `.claude/screenshots`)
- `approvals_file` (optional): Path to visual approvals JSON (default: `.claude-review/visual-approvals.json`)
- `model` (optional): Claude model to use (default: `claude-sonnet-4-5-20250929`)

**Outputs**:
- `passed`: Whether review passed
- `result`: JSON result with summary
- `regression_detected`: Whether visual regression detected
- `changed_screenshots`: List of changed screenshots

**Example**:
```yaml
- name: Visual Review
  uses: constellos/claude-code-actions/.github/actions/visual-reviewer@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    screenshots_dir: '.claude/screenshots'
```

**Visual Regression Detection**: Uses SHA256 hashes to detect changes. Approve screenshots by creating `.claude-review/visual-approvals.json`:
```json
{
  "approvals": [
    {
      "screenshot": "homepage.png",
      "hash": "abc123...",
      "approved_by": "user",
      "approved_at": "2026-01-05T00:00:00Z"
    }
  ]
}
```

---

### 5. UX Reviewer

Reviews UX patterns, interactivity, and detects console errors.

**Path**: `constellos/claude-code-actions/.github/actions/ux-reviewer@v1`

**Inputs**:
- `claude_code_oauth_token` (required): Claude Code OAuth token
- `pr_number` (required): Pull request number
- `github_token` (required): GitHub token
- `e2e_results_path` (optional): Path to E2E test results (default: `test-results`)

**Outputs**:
- `passed`: Whether review passed
- `result`: JSON result with summary
- `console_errors`: List of console errors found

**Example**:
```yaml
- name: UX Review
  uses: constellos/claude-code-actions/.github/actions/ux-reviewer@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Note**: Automatically extracts console errors from Playwright test results.

---

### 6. Review Comment

Manages a consolidated PR comment displaying all review results with collapsible agent sections.

**Path**: `constellos/claude-code-actions/.github/actions/review-comment@v1`

**Inputs**:
- `review_name` (required): Name of the review agent (e.g., "Code Quality", "Requirements")
- `passed` (required): Whether review passed (true/false)
- `result_json` (required): JSON result with checks array
- `checks_passed` (required): Number of checks that passed
- `checks_failed` (required): Number of checks that failed
- `checks_skipped` (required): Number of checks that were skipped
- `pr_number` (required): Pull request number
- `sha` (required): Commit SHA for unique comment marker
- `github_token` (required): GitHub token
- `prompt_file` (optional): Path to agent prompt file for GitHub link

**Outputs**: None

**Example**:
```yaml
- name: Update comment
  if: always()
  uses: constellos/claude-code-actions/.github/actions/review-comment@v1
  with:
    review_name: 'Code Quality'
    passed: ${{ steps.review.outputs.passed }}
    result_json: ${{ steps.review.outputs.result }}
    checks_passed: ${{ steps.review.outputs.checks_passed }}
    checks_failed: ${{ steps.review.outputs.checks_failed }}
    checks_skipped: ${{ steps.review.outputs.checks_skipped }}
    pr_number: ${{ github.event.pull_request.number }}
    sha: ${{ github.sha }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    prompt_file: '.claude/agents/reviewers/code-quality.md'
```

**Note**: Creates a single comment with collapsible sections per agent. Shows aggregate pass/fail counts at the top and detailed checks table per agent.

---

### 7. Changed Files

Smart file change detection for efficient CI pipelines.

**Path**: `constellos/claude-code-actions/.github/actions/changed-files@v1`

**Inputs**:
- `pattern` (optional): Regex pattern to filter files (default: `.*`)

**Outputs**:
- `changed_files`: Newline-separated list of changed files
- `has_changes`: Whether any matching files changed
- `file_count`: Number of changed files
- `has_ts_files`: Whether TypeScript files changed
- `has_test_files`: Whether test files changed
- `ts_files`: List of TypeScript files
- `test_files`: List of test files

**Example**:
```yaml
- name: Detect changes
  id: changes
  uses: constellos/claude-code-actions/.github/actions/changed-files@v1
  with:
    pattern: '\.(ts|tsx)$'

- name: Run linting
  if: steps.changes.outputs.has_ts_files == 'true'
  run: npm run lint
```

---

### 8. Capture Routes

Discovers Playwright-visited routes and captures screenshots.

**Path**: `constellos/claude-code-actions/.github/actions/capture-routes@v1`

**Inputs**:
- `screenshots_dir` (optional): Directory to store screenshots (default: `.claude-review/screenshots`)
- `max_routes` (optional): Maximum routes to capture (default: `10`)
- `har_path` (optional): Path to HAR files (default: `test-results`)
- `trace_path` (optional): Path to trace files (default: `test-results`)
- `base_url` (optional): Base URL for screenshots (auto-detected if not provided)

**Outputs**:
- `routes`: Newline-separated list of discovered routes
- `route_count`: Number of routes discovered
- `screenshots`: List of screenshot paths
- `screenshot_count`: Number of screenshots captured

**Example**:
```yaml
- name: Capture screenshots
  uses: constellos/claude-code-actions/.github/actions/capture-routes@v1
  with:
    screenshots_dir: '.claude/screenshots'
    max_routes: '15'
```

**Note**: Automatically extracts routes from Playwright HAR and trace files.

---

## Authentication Setup

### Getting a Claude Code OAuth Token

1. Visit [https://code.claude.com/settings/oauth](https://code.claude.com/settings/oauth)
2. Create a new OAuth application
3. Generate a token
4. Add it as a repository secret named `CLAUDE_CODE_OAUTH_TOKEN`

### Required Secrets

Add these secrets to your repository (Settings → Secrets → Actions):

| Secret | Description | Required |
|--------|-------------|----------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth token | Yes |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions | No (auto-provided) |

## Org-Level Workflows

For centralized management, use a reusable workflow in your org's `.github` repository:

**In `constellos/.github/.github/workflows/ci-pipeline-reusable.yml`:**
```yaml
name: Reusable CI Pipeline

on:
  workflow_call:
    inputs:
      actions_version:
        type: string
        default: 'v1.0.0'
    secrets:
      CLAUDE_CODE_OAUTH_TOKEN:
        required: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint

  requirements:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - name: Requirements Review
        id: review
        uses: constellos/claude-code-actions/.github/actions/requirements-reviewer@${{ inputs.actions_version }}
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          pr_number: ${{ github.event.pull_request.number }}
          branch: ${{ github.head_ref }}
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update comment
        if: always()
        uses: constellos/claude-code-actions/.github/actions/review-comment@${{ inputs.actions_version }}
        with:
          review_name: 'Requirements'
          passed: ${{ steps.review.outputs.passed }}
          result_json: ${{ steps.review.outputs.result }}
          checks_passed: ${{ steps.review.outputs.checks_passed }}
          checks_failed: ${{ steps.review.outputs.checks_failed }}
          checks_skipped: ${{ steps.review.outputs.checks_skipped }}
          pr_number: ${{ github.event.pull_request.number }}
          sha: ${{ github.sha }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          prompt_file: '.claude/agents/reviewers/requirements.md'
```

**In individual repos:**
```yaml
name: CI
on: [pull_request]

jobs:
  ci:
    uses: constellos/.github/.github/workflows/ci-pipeline-reusable.yml@main
    with:
      actions_version: 'v1.0.0'
    secrets: inherit
```

## Custom Review Prompts

Each reviewer action supports custom prompts via files in `.claude/agents/reviewers/`:

- `.claude/agents/reviewers/requirements.md` - Requirements review prompt
- `.claude/agents/reviewers/code-quality.md` - Code quality review prompt
- `.claude/agents/reviewers/context.md` - Context review prompt
- `.claude/agents/reviewers/visual.md` - Visual review prompt
- `.claude/agents/reviewers/ux.md` - UX review prompt

**Example prompt** (`.claude/agents/reviewers/requirements.md`):
```markdown
# Requirements Review

You are reviewing a PR against its linked GitHub issue requirements.

## Context
- Changed files: `.claude/review-context/changed.txt`
- Issue context: `.claude/review-context/issue.json`

## Evaluation Criteria
1. All acceptance criteria addressed
2. Changes within issue scope
3. No scope creep
4. Appropriate test coverage

## Output Format
```json
{
  "passed": true|false,
  "summary": "Brief summary of review findings"
}
```\n```

## Troubleshooting

### Issue: Reviews stalling for 5 minutes

**Cause**: Old workflow using `/tmp/` paths blocked by sandboxing.

**Fix**: Upgrade to v1.0.0+ which uses `.claude/review-context/` instead.

### Issue: "Permission denied" errors

**Cause**: `CLAUDE_CODE_OAUTH_TOKEN` not set or invalid.

**Fix**:
1. Verify secret exists in repository settings
2. Regenerate token at [code.claude.com/settings/oauth](https://code.claude.com/settings/oauth)
3. Update repository secret

### Issue: No screenshots found for visual review

**Cause**: Screenshots not uploaded before visual review runs.

**Fix**: Ensure E2E tests run before visual review and upload artifacts:
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: playwright-screenshots-${{ github.sha }}
    path: .claude/screenshots/

- uses: actions/download-artifact@v4
  with:
    name: playwright-screenshots-${{ github.sha }}
    path: .claude/screenshots/
```

### Issue: Review comment not appearing

**Cause**: Missing `pull-requests: write` permission.

**Fix**: Add permissions to workflow:
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: read
```

## Version Pinning

### Recommended Versioning Strategy

| Use Case | Version | Example |
|----------|---------|---------|
| **Production** | Specific version tag | `@v1.0.0` |
| **Latest stable** | Major version | `@v1` |
| **Development** | Main branch | `@main` |
| **Maximum stability** | Commit SHA | `@abc123...` |

### Example
```yaml
uses: constellos/claude-code-actions/.github/actions/requirements-reviewer@v1.0.0
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://github.com/constellos/claude-code-actions](https://github.com/constellos/claude-code-actions)
- Issues: [https://github.com/constellos/claude-code-actions/issues](https://github.com/constellos/claude-code-actions/issues)
- Discussions: [https://github.com/constellos/claude-code-actions/discussions](https://github.com/constellos/claude-code-actions/discussions)

---

Built with [Claude Code](https://claude.com/claude-code) by [Constellos](https://github.com/constellos)
