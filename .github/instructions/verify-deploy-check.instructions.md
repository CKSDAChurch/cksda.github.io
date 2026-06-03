---
description: "After adding, renaming, or deleting any file, check that the GitHub verify and deploy jobs will still pass."
applyTo: "**"
---

# Verify & Deploy Compatibility Check

Any time a file is **added, renamed, or deleted**, run through the checklist below before finishing. These mirror the exact steps in `.github/workflows/deploy.yml` so failures are caught locally instead of in CI.

If a file is moved to a different directory level, also audit all relative `href`/`src` paths **inside** the moved file itself, since path depth changes (e.g., moving from root to `subdir/`) invalidate relative references like `../assets/`.

---

## 1. Verify job — Linting (`npm run lint`)

Runs `eslint .` (JS) and `stylelint "assets/css/**/*.css"` (CSS).

- **New `.js` file** → make sure it passes ESLint. Run: `npm run lint:js`
- **New `.css` file** → make sure it passes Stylelint. Run: `npm run lint:css`
- **Deleted a linted file** → search all `.js`, `.html`, and ESLint-scoped files for `import` statements or `require()` calls referencing the deleted file path, and confirm none remain.

## 2. Verify job — Link checker (lychee)

Scans: `./*.html  ./sitemap.xml  ./*.md  docs/*.md`

- **New `.html` page added** → add it to `sitemap.xml`. Verify every `href` and `src` inside it resolves to an existing file or an allowed external URL.
- **HTML page renamed or deleted** → update `sitemap.xml` and search all other HTML/MD files for inbound links to the old path.
- **New asset (image, font, script, stylesheet) added** → ensure it is referenced by a valid relative path from the HTML that uses it.
- **Asset renamed or deleted** → find every reference to the old path and update or remove it.

## 3. Deploy job — Build (`npm run build`)

`scripts/build.js` minifies an **explicit list** of files. It does **not** auto-discover new files.

### CSS — add to `cssFiles` array in `scripts/build.js`

```js
const cssFiles = ['main', 'lightmode', 'darkmode', 'menu', 'newsletter', 'pathfinders'];
```

If you add `assets/css/foo.css`, append `'foo'` to `cssFiles` and commit both the source file and the updated build script. The HTML must reference `assets/css/foo.min.css`, not the source. The output filename is always `<arrayEntry>.min.css` (or `.min.js`). If `scripts/build.js` applies any suffix or prefix transformation, match the HTML reference to the actual emitted filename by checking the build script output path configuration.

### JS — choose the correct bundle list in `scripts/build.js`

| List | Format | Use for |
|---|---|---|
| `classicJsFiles` | IIFE / classic | Legacy synchronous scripts (e.g. analytics) |
| `esmJsFiles` | ESM | Deferred `<script type="module">` with no imports |
| Explicit `esbuild.build(...)` call | ESM + bundle | Scripts that `import` other files, or need API key injection |

A script needs API key injection if it references `process.env.*` variables that esbuild must substitute at build time via the `define` option in its `esbuild.build(...)` call.

Evaluate in this order: (1) If the script uses `import` statements or requires API key injection → use explicit `esbuild.build(...)`. (2) If the script is ESM with no imports and no API keys → add to `esmJsFiles`. (3) Otherwise → add to `classicJsFiles`.

Add new JS files to the right list, or add a standalone `esbuild.build(...)` block. The HTML must reference the `.min.js` output.

### PWA icon source images

The build generates icons from `images/logo-light.png`. If that file is renamed or deleted, update the paths in `generateIcon(...)` calls inside `scripts/build.js`.

## 4. Deploy job — Cleanup step

Before publishing, CI removes these paths:

```
docs/  scripts/  tests/  test-results/  playwright-report/  node_modules/
package.json  package-lock.json  eslint.config.js  playwright.config.js  README.md
```

- **New non-web file or directory** → add it to the `rm -rf` / `rm -f` line in the deploy workflow so it is not published.
- **New publishable web file** → make sure it is **not** inside one of the removed directories.
- **File moved out of a removed directory (e.g., `docs/` → root)** → confirm the file is intentionally publishable; verify it passes lint and link checks.

---

## Quick checklist summary

| Change type | Action required |
|---|---|
| Add `.html` page | Update `sitemap.xml`; verify all links inside it |
| Add/rename/delete asset | Check all `href`/`src` references in HTML/CSS |
| Add `.css` source file | Add name to `cssFiles` in `scripts/build.js` |
| Add `.js` source file | Add to appropriate list or add explicit esbuild block in `scripts/build.js` |
| Add non-web file or dir | Add to cleanup `rm` commands in `.github/workflows/deploy.yml` |
| Rename/delete any file | Search workspace for old path references |
| File moved out of a removed directory (e.g., `docs/` → root) | Confirm the file is intentionally publishable; verify it passes lint and link checks |
