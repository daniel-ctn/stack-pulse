# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Additional Rules

- Always check the latest documentation when implementing new features and upgrade packages when newer versions are available.
- Prefer pnpm as the package manager for new projects.
- On Windows, prefer Command Prompt (`cmd`/`cmd.exe`) for shell commands instead of PowerShell unless a task explicitly requires PowerShell.
- Always review existing implementations in the project to ensure consistent patterns across the app.
- Write clean code following best practices and optimize for performance.
- Don't use linear gradient background unless I tell you or it's a really necessary case
- Prefer to use color on project's design system over custom color

## Documentation as Working Memory

Use docs as durable project memory, but verify against code before acting.

- Before starting non-trivial work, read `README.md`, `docs/AGENT_START_HERE.md` if present, and any feature doc directly related to the task.
- Treat docs as guidance, not absolute truth. If docs and code disagree, trust the code, surface the mismatch, and update the doc only if the task changes durable behavior.
- Update docs when changing architecture, routes/APIs, environment variables, database schema, billing/auth/security behavior, testing commands, or user-visible feature behavior.
- Do not update docs for incidental implementation details, temporary debugging, tiny refactors, or changes that are already obvious from code/tests.
- Every new or edited doc should make its status clear: `current`, `planned`, `shipped`, `historical`, or `superseded`.
- Prefer one current source-of-truth doc per feature. Move completed plans and stale reviews to `docs/archive/` instead of leaving them beside current operational docs.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->