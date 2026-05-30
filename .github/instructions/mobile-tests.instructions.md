---
description: "Run the relevant Playwright mobile tests after editing HTML pages or CSS/JS assets."
applyTo: "**/*.html,assets/**/*.{css,js}"
---

# Run Mobile Tests After Changes

After editing any HTML page or asset file, run the Playwright tests that cover those files.
Tests run against a local HTTP server and produce an HTML report that opens automatically on failure.

## Run tests for a specific page

| File changed | Command |
|---|---|
| `calendar.html` or calendar-related CSS | `npx playwright test --grep "calendar"` |
| `epoch.html` | `npx playwright test --grep "epoch"` |
| `music.html` | `npx playwright test --grep "music"` |
| `pathfinders.html` | `npx playwright test --grep "pathfinders"` |
| `index.html` | `npx playwright test --grep "index"` |
| Any nav/footer/touch-target change | `npx playwright test --grep "touch targets"` |
| `assets/css/main.css` or `assets/js/main.js` | `npm test` (run all tests) |

## Run all tests

```
npm test
```

## Notes

- Tests require `npm install` to have been run (installs Playwright + http-server).
- First run also needs: `npx playwright install chromium`
- The local server starts automatically and shuts down after the tests finish.
- On failure, a visual HTML report opens in your browser showing the exact failing assertion and a screenshot.
