---
description: "Use when editing CSS or JS source files. Reminder to run the minification build after saving changes."
applyTo: "assets/**/*.{css,js}"
---

# CSS/JS Build Step

After editing any CSS or JS source file (files that do **not** end in `.min.css` or `.min.js`), run the minification build:

```
npm run build
```

This regenerates all `.min.css` and `.min.js` files in-place. The HTML pages load the `.min.*` versions, so the build must be run before committing for changes to take effect on the live site.

**Do not run the build after editing `.min.*` files directly** — those are generated output and should not be hand-edited.
