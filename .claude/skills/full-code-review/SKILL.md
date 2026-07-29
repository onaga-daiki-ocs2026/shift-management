---
name: full-code-review
description: Deep whole-repository code review — not diff-based. Reads every source file in the repo (not just changed files) and reports findings across five axes (security, performance, correctness, readability/maintainability, architecture), each classified by severity (高/中/低). Use when the user asks for a full/deep/whole-project review, a security+performance+readability audit of the entire codebase, or explicitly invokes /full-code-review — as opposed to /code-review which reviews only the current diff.
---

# full-code-review

Whole-repository deep review across five fixed axes. This is NOT a diff review —
always target every source file in the repo, regardless of git status.

## When to use this vs `/code-review`

- `/code-review` reviews the current diff / pending changes only.
- `full-code-review` ignores git diff state entirely and reviews the full checked-out
  tree. Use it when the user asks to review "the whole project," "全体," "リポジトリ全体,"
  or explicitly asks for security/performance/readability/architecture coverage of
  everything, not just what changed.

## The five review axes (always cover all five, in this order)

1. **セキュリティ (Security)** — SQL/JPQL/NoSQL injection, missing or client-side-only
   authn/authz, IDOR, hardcoded secrets/API keys/tokens, unsafe deserialization, XSS,
   CSRF, insecure CORS, unsafe file upload handling, mass assignment via DTOs/request
   bodies, secrets committed to the repo (check for `.env` files, hardcoded keys in
   config files) — even if gitignored, flag them if physically present in the working
   tree.
2. **パフォーマンス (Performance)** — N+1 queries, missing indexes implied by query
   patterns, unnecessary full-table scans, per-row DB round-trips inside loops
   (especially where batch/bulk operations exist), redundant/duplicate API calls,
   blocking I/O in scheduled jobs or request threads, missing memoization on expensive
   client-side computations, large unbounded payloads.
3. **正確性 (Correctness)** — unhandled edge cases (null/empty/boundary values),
   missing error handling, swallowed exceptions that should propagate (or vice versa),
   race conditions, off-by-one errors, timezone/locale bugs, incorrect transaction
   boundaries.
4. **可読性・保守性 (Readability/Maintainability)** — misleading names, duplicated
   logic that should be shared, functions/files that mix unrelated responsibilities,
   dead code, inconsistent patterns between similar modules, missing separation of
   concerns.
5. **アーキテクチャ (Architecture)** — directory/module structure vs. actual
   responsibilities, layering violations (e.g. controller doing repository-level work,
   business logic leaking into UI components), circular or inappropriate dependencies,
   inconsistent conventions across similarly-shaped modules (e.g. two services that
   should follow the same pattern but don't).

Skip an axis only if truly inapplicable to the repo (e.g. no DB present) — say so
explicitly rather than silently omitting it.

## Procedure

1. **Read project context first.** If a `CLAUDE.md` (root or nested) exists, read it
   for architecture/conventions before reviewing — known, intentional tradeoffs
   documented there (e.g. "delete-then-reinsert is deliberate") are not findings.
2. **Map the repo.** Use Glob/Explore to enumerate top-level source directories
   (e.g. `backend/`, `frontend/`, or per-language/module split). Get a file count per
   area to decide how to split work.
3. **Split into parallel review passes by area, not by axis.** For a typical
   frontend+backend split (or however the repo is actually organized — e.g. by
   service in a monorepo), launch one Agent (subagent_type: general-purpose,
   run_in_background: true) per area, each instructed to cover **all five axes** for
   its area. Do not split by axis (e.g. one agent per security) — that agent would
   lack the code context to judge severity correctly.
   - Give each agent: the relevant CLAUDE.md context, the exact file list/directory
     to read (every file — this is a full review, not a sample), the five axes with
     the definitions above, and an explicit instruction to report file:line-anchored,
     concrete findings only (no generic advice), each pre-classified as 高/中/低.
   - Cap each agent's report length so findings stay concrete rather than padded
     (e.g. "under 800 words" per area for small/medium repos; raise for very large
     repos but keep pressure toward specificity).
   - If the repo is small enough (roughly under ~40 source files total), it's fine to
     review directly without spawning subagents — use judgment, don't spawn agents for
     trivially-sized repos.
4. **Consolidate.** Once all area agents report back, merge into one report grouped
   by axis (security → performance → correctness → readability → architecture), and
   within each axis sorted 高 → 中 → 低. Deduplicate overlapping findings from
   different agents (e.g. both frontend and backend agents flagging the same
   missing-authz pattern from their own side — merge into one finding noting both
   ends).
5. **Report findings, don't fix them**, unless the user explicitly asked for fixes in
   the same request. Default to read-only analysis.

## Output format

For each finding: `重要度 | file:line | 一言サマリ` followed by 1-3 sentences
explaining the concrete failure scenario or impact — not generic advice like "should
validate input," but what specifically breaks, how, and under what condition.

Group output like:

```
## 高
### セキュリティ
- ...
### パフォーマンス
- ...

## 中
### ...

## 低
### ...
```

(Group by severity first, then axis within each severity — this makes the highest-
priority items scannable without reading the whole report. If the user's project
context is Japanese, write the report in Japanese; otherwise match the user's
language.)

Do not pad the report with axes that found nothing — write "特に指摘なし" (or
equivalent) briefly rather than omitting the axis silently, so the user knows it was
actually checked.
