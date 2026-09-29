# TCC Codex Working Agreement

## Start every task

- Read `PROJECT_HANDOFF.md` before inspecting or changing the codebase.
- Treat the latest user request and the repository state as authoritative.
- Check `git status`, the current branch, and the latest commit before editing.
- Preserve existing user changes and never discard unrelated work.

## Project safety

- Never commit `.env.local`, passwords, tokens, service-role keys, or other secrets.
- Preserve Supabase Row Level Security. Do not disable or weaken RLS to make a feature work.
- Use versioned files under `supabase/migrations/` for database schema changes.
- Preserve stable Fit IDs and customer Saved Look references.
- Prefer archive/deactivate lifecycle controls over permanent deletion of catalogue records.
- Do not start a later project phase unless the user explicitly requests it.

## Verification

- For TypeScript or application changes, run `npm run typecheck`, `npm run lint`, and `npm test`.
- Run `npm run build` before delivery when the change affects production behavior.
- For Supabase changes, verify migrations, RLS behavior, row preservation, storage policy, and the Supabase security/performance advisors.
- Use port `3001` for local browser verification unless the user specifies another port.
- Remove temporary test records, screenshots, and browser sessions after verification.

## Handoffs and parallel work

- Keep `PROJECT_HANDOFF.md` current after every completed phase, deployment-relevant change, or unfinished handoff.
- Two Codex accounts must not edit the same branch or working directory at the same time.
- For parallel work, create a separate Git worktree and a dedicated `codex/<task>` branch for each account.
- Divide work by non-overlapping files or modules, commit small coherent changes, and merge through review.
- Before resuming another account's task, pull the latest remote branch and read its commits plus `PROJECT_HANDOFF.md`.

