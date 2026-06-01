---
description: "After completing any set of changes, add a release notes entry to docs/CHANGELOG.md."
applyTo: "**"
---

# Release Notes

After completing any meaningful set of changes, add an entry to [docs/CHANGELOG.md](../../docs/CHANGELOG.md).

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
- One entry per work session or logical unit of change; don't create an entry for every individual file edit.
- Keep entries concise — one line per item.
- List entries in reverse chronological order (newest at the top).
- If a change affects CI/CD or the build pipeline, note it under **Changed** or **Fixed**.
