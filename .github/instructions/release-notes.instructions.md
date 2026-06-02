---
description: "Before or during staging/commit prep, assess staged changes and update release notes when the change is release-worthy."
applyTo: "**"
---

# Release Notes

When changes are being staged (or prepared for commit), review what is staged and decide whether it is worthy of release notes.

If yes:
- Add or update an entry in [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md).
- If [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md) does not exist, create it using the standard format template before adding the first entry.
- Stage [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md) with the related changes.

If no:
- Do not force a release-notes update for minor/internal-only edits.

## Format

```markdown
## vX.Y.Z — Month DD, YYYY

### Added
- Short description of new features or files

### Changed
- Short description of modifications to existing behaviour

### Fixed
- Short description of bug fixes

### Removed
- Short description of deleted files or features
```

## Guidelines

- Use [semantic versioning](https://semver.org/): **MAJOR.MINOR.PATCH**
  - **MAJOR** — breaking changes or complete redesigns
  - **MINOR** — new features or pages (backwards-compatible)
  - **PATCH** — fixes, copy updates, minor tweaks
- If no prior version exists in [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md), start at v1.0.0. Otherwise, read the most recent entry and increment the appropriate semantic version segment based on change type.
- If the most recent entry in [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md) has today's date or is otherwise clearly unreleased, append items to that entry instead of creating a duplicate version block.
- Assess release-worthiness when the user asks to stage changes, when files are already staged, or during commit preparation; if you cannot access staged diffs directly, ask the user to provide the diff or a summary of changes.
- One entry per logical unit of change (for example, one feature, one bug fix, or one refactor). If multiple staged changes form one coherent unit, combine them into a single entry.
- Keep entries concise — one line per item.
- List entries in reverse chronological order (newest at the top).
- If a change affects CI/CD or the build pipeline, note it under **Changed** or **Fixed**.

## Release-Worthy Criteria

Good candidates for release notes:
- User-visible features, UI/UX updates, behavior changes, or important fixes.
- Security, privacy, accessibility, SEO, performance, or reliability improvements that matter to the site audience or operators.
- Build/deploy/CI changes that affect how the site is shipped or maintained.

Usually skip release notes for:
- Tiny wording tweaks, pure formatting/cleanup, or strictly local/internal refactors with no meaningful outcome.
- Work-in-progress checkpoints that are superseded before release.

## Staging Workflow

When asked to stage changes:
1. Review staged/targeted diffs.
2. Decide whether they are release-worthy using the criteria above.
3. If worthy, update [docs/RELEASE-NOTES.md](../../docs/RELEASE-NOTES.md) and stage it together with those changes.
4. If not worthy, proceed without release-notes edits.
