# cksda.github.io

Static website for Collegedale Korean Seventh-day Adventist Church.

## Local Development

Use any static file server from the repository root.

### Option 1: Python

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

### Option 2: VS Code Live Server

Open the project in VS Code and start Live Server on index.html.

## Deployment Flow

This site is published from the GitHub repository and served via GitHub Pages.

1. Create a branch for your change.
2. Test pages locally.
3. Open a pull request to main.
4. Merge after review; GitHub Pages publishes the update.

If a workflow is configured in .github/workflows/deploy.yml, it will run as part of the deploy pipeline.

## Translation Workflow

Language strings live in assets/langStrings:

- en.json
- es.json
- ko.json

When updating copy:

1. Add or update the key in en.json first.
2. Add the same key to es.json and ko.json.
3. Keep keys aligned across all language files.
4. Verify page text renders correctly in each language.

## How To Add A New Page

1. Copy an existing page with similar layout (for example children.html).
2. Update the page content and IDs used for translated text.
3. Add route and menu keys in language JSON files under menuItems and pageTitles.
4. Add page mapping logic in assets/js/main.js inside PAGE_CONFIG.
5. Add navigation links where appropriate.
6. Test desktop and mobile layouts before merging.
