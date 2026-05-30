# Website Improvements

A comprehensive, categorized list of suggested improvements for the CKSDA website. Check items off as you complete them.

> **Tip:** Sections are ordered roughly from most to least important — start at the top and work down. Within each section, prioritize quick wins (alt text, IDs, robots/sitemap) before larger structural work (build tooling, PWA).

---

## 1. Analytics & Privacy

- [x] **Publish a privacy policy and cookie policy** — Disclose what GA4 and Clarity collect, retention periods, and how to opt out.
- [x] **Cookie consent banner** — Both GA4 and Clarity set cookies; EU/UK and California users should be given an opt-in/opt-out.
- [x] **Adopt Google Consent Mode v2** — Even without a full CMP, this lets you respect consent signals.

---

## 2. UX / Content

- [x] **Add a privacy policy** — Required given GA + Clarity tracking. Create `/privacy.html` and link from the footer.
- [x] **Clean up placeholder Epoch content** — [epoch.html](epoch.html#L41), [epoch.html](epoch.html#L44), [epoch.html](epoch.html#L59) show "Video information is currently unavailable" for past years. Update or hide.
- [x] **Rethink redirect pages** — [college.html](college.html), [connection.html](connection.html), [directory.html](directory.html) silently meta-refresh. Either remove (and update links) or show a brief loading state.
- [x] **Fix mislabeled IDs in [music.html](music.html)** — [music.html](music.html#L20) and [music.html](music.html#L22) use `id="personalMinistriesTitle"` / `id="personalMinistriesBlurb"` for music content; rename to match.
- [x] **Expand thin ministry pages** — [young-adults.html](young-adults.html), [personal-ministries.html](personal-ministries.html), [children.html](children.html) have very little content. Add descriptions, meeting times, and photos.
- [x] **Add clearer calls-to-action** — Visible buttons for "Join us", "Subscribe to newsletter", "Give online", etc.
- [x] **Consolidate social links** — Currently scattered across a few pages; standardize in the footer.

---

## 3. Security

- [x] **Move HTML out of translation JSON** — [assets/langStrings/en.json](assets/langStrings/en.json#L46) embeds `<a>` and `<br />` in strings. This is fragile and a latent XSS vector if `innerHTML` is ever used with untrusted data. Keep markup in templates, text in JSON.
- [x] **Add a Content Security Policy** — Add a `<meta http-equiv="Content-Security-Policy" ...>` (or a server header if you proxy) limiting script sources to `self`, `googletagmanager.com`, `clarity.ms`, etc.
- [x] **Enforce HTTPS on GitHub Pages** — Confirm the repo setting "Enforce HTTPS" is enabled for `cksda.church`.
- [x] **Audit embedded iframes** — Sources like SharePoint embeds in [epoch.html](epoch.html#L47) should be reviewed periodically; consider `sandbox` attributes where feasible.

---

## 4. Accessibility (a11y)

- [x] **Empty alt text on logo images** — [pathfinders.html](pathfinders.html#L42) and [pathfinders.html](pathfinders.html#L77) have `alt=""` on logos. Provide descriptive alt text like `alt="Pioneers Pathfinders Club logo"`.
- [x] **Use more semantic HTML** — Many pages use `<div>` for content that should be `<section>`, `<article>`, `<nav>`, or `<main>`. This improves screen-reader navigation.
- [x] **No skip-to-content link** — Keyboard and screen-reader users must tab through the full header on every page. Add a hidden skip link that jumps to main content.
- [x] **Ensure visible focus indicators** — Some interactive elements/iframes may have focus styles hidden by inline styles. Verify `:focus` rings are visible site-wide.
- [x] **Add `aria-label` to icon-only links** — Social media links in [pathfinders.html](pathfinders.html#L71-L74) rely on visually hidden `<span class="label">` only. Add `aria-label` on the `<a>` for redundancy.
- [x] **Audit heading hierarchy** — Some pages skip heading levels (e.g., `<h1>` → `<h3>`). Keep a logical order starting with one `<h1>` per page.
- [x] **Replace vague link text** — "Click Here" links in [epoch.html](epoch.html#L56), [epoch.html](epoch.html#L71), [music.html](music.html#L50) should be descriptive (e.g., "View full calendar").
- [x] **Verify color contrast (WCAG AA)** — Test [assets/css/darkmode.css](assets/css/darkmode.css) and [assets/css/lightmode.css](assets/css/lightmode.css) with axe/WAVE for 4.5:1 text contrast. *(Body text `#4a4540` on `#f7f3ed` ≈ 8.3:1; headings `#2c3830` ≈ 11:1; body links `#2c545e` ≈ 7.2:1; dark-mode links `#5ba8b5` on `#042D2D` ≈ 5.5:1 — all pass WCAG AA.)*
- [x] **Plan labels for any future forms** — No `<label for="...">` used today; ensure any future inputs are properly labeled.

---

## 5. SEO & Metadata

- [ ] **Create `robots.txt`** — Give crawlers explicit directives and point them to the sitemap.
- [ ] **Create `sitemap.xml`** — Help search engines discover all pages, with priorities (e.g., index = 1.0, ministry pages = 0.8).
- [ ] **Add canonical URLs** — `<link rel="canonical" href="https://cksda.church/page.html">` on each page to avoid duplicate-content issues.
- [ ] **Add JSON-LD structured data** — Use Schema.org `Church`/`Organization`/`Event` markup so search engines understand the church, service times, address, and upcoming events.
- [ ] **Standardize page `<title>` format** — Pick one format (e.g., `Page Topic | Collegedale Korean SDA Church`) and apply consistently.
- [ ] **Replace meta-refresh redirect pages** — [college.html](college.html), [connection.html](connection.html), [directory.html](directory.html) use `<meta http-equiv="Refresh">`. Use proper 301 redirects (e.g., GitHub Pages `_redirects` if migrated, or update internal links to the real destinations).

---

## 6. Performance

- [ ] **Add `defer` to scripts** — [assets/js/browser.min.js](assets/js/browser.min.js), [assets/js/breakpoints.min.js](assets/js/breakpoints.min.js), [assets/js/util.js](assets/js/util.js), [assets/js/main.js](assets/js/main.js) should use `defer` to avoid blocking parsing.
- [ ] **Stop `@import` for Google Fonts** — [assets/css/main.css](assets/css/main.css#L5) uses `@import url("https://fonts.googleapis.com/...")` which is render-blocking. Use `<link rel="preconnect">` + `<link rel="stylesheet">` (or self-host).
- [ ] **Defer Microsoft Clarity** — The inline Clarity loader runs immediately on every page; consider deferring until after page load.
- [ ] **Optimize images** — Provide WebP/AVIF versions of `images/pic01.jpg`, `images/pic02.jpg`, `images/header.jpg`, etc., and use `<picture>` / `srcset` for responsive sizes.
- [ ] **Reduce or remove jQuery** — [assets/js/jquery.min.js](assets/js/jquery.min.js) is loaded on every page but used lightly. Replacing `$('#x')` with `document.getElementById('x')` lets you drop ~30KB.
- [ ] **Minify CSS/JS** — Files like [assets/css/newsletter.css](assets/css/newsletter.css) are unminified. A build step (esbuild/cssnano) could shrink them ~30%.
- [ ] **Verify gzip/brotli on GitHub Pages** — Confirm `Content-Encoding` headers are present in production responses.

---

## 7. Responsive Design / Mobile

- [ ] **Audit fixed-size iframe embeds** — [calendar.html](calendar.html#L38) uses fixed `height="650px"`; consider a responsive wrapper with aspect-ratio.
- [ ] **Move inline `style` to CSS** — e.g., [epoch.html](epoch.html#L46) hardcodes `max-width: 1280px` inline; using a class lets media queries adjust on small screens.
- [ ] **Touch-target sizing** — Verify nav and footer links meet ~44×44 px touch targets on mobile.
- [ ] **Document mobile testing** — Add a manual checklist (or Playwright snapshot test) for the most-visited pages on phone viewports.

---

## 8. Internationalization (i18n)

- [ ] **Fill in missing keys in `es.json` and `ko.json`** — Compare to [assets/langStrings/en.json](assets/langStrings/en.json) and add any missing translations; consider a small script to detect drift.
- [ ] **Move HTML out of translation strings** — As noted under Security; also makes translator work easier.
- [ ] **Make non-English `<html lang>` dynamic** — When the language switches, update the `<html lang>` attribute (currently always `en` even after switch).
- [ ] **Localize date/time formatting** — Service/newsletter times appear in English format only; use `Intl.DateTimeFormat` keyed to the active language.
- [ ] **Add a fallback warning for unsupported languages** — [assets/js/main.js](assets/js/main.js) silently falls back to English; consider logging or a visible notice for debugging.

---

## 9. Code Quality & Maintainability

- [ ] **Centralize header/footer/analytics** — The GA snippet, Clarity snippet, and `<div id="header">`/`<div id="footer">` are duplicated in every HTML file. Consider a static site generator (11ty, Hugo, Astro) or at minimum a small build script to inject shared partials.
- [ ] **Centralize analytics IDs** — `G-LK9DNYP0NB` and `hik5wt3z51` are hardcoded in every page; move to a shared partial once partials exist.
- [ ] **Extract page config from `main.js`** — The large `PAGE_CONFIG` block in [assets/js/main.js](assets/js/main.js) is hard to scan; move it to its own module or a JSON file.
- [ ] **Replace jQuery DOM calls with vanilla** — Most uses are simple selectors that don't need jQuery.
- [ ] **Add `.editorconfig` + Prettier** — Indentation and quote style are inconsistent across files. A formatter + editorconfig keeps things tidy.
- [ ] **Add ESLint + Stylelint** — Catch unused vars, undefined globals, and CSS mistakes before deploy.
- [ ] **Standardize modern JS** — Mix of older patterns and ES6; pick a baseline (ES2020+) and apply consistently.

---

## 10. Build / Tooling / DX

- [ ] **Add local dev instructions** — A `package.json` with `npm start` running a simple static server would lower contributor friction.
- [ ] **Expand GitHub Actions workflow** — [.github/workflows/deploy.yml](.github/workflows/deploy.yml) should also run a linter and a link checker (e.g., `lychee-action`).
- [ ] **Add a link checker to CI** — External links to Google Forms, YouTube, SharePoint break silently otherwise.
- [ ] **Reconsider API-key injection approach** — The Python regex replace is brittle; a small build step (Node/esbuild) reading from `process.env` would be cleaner.
- [ ] **Add a CSS/JS minification step** — Pairs naturally with adding a build tool.
- [ ] **Add `.editorconfig` and `.prettierrc`** — As noted under Code Quality.

---

## 11. PWA / Modern Web

- [ ] **Add a `manifest.json`** — Enables "Add to Home Screen" with proper icons and theme color.
- [ ] **Add a basic service worker** — Cache critical assets (CSS, logo, fonts) and serve a friendly offline page.
- [ ] **Add an `offline.html`** — Lightweight fallback page if the user has no connection.

---

## 12. Page-Specific Notes

- [ ] **[index.html](index.html)** — Consider a more prominent service-times section above the fold.
- [ ] **[calendar.html](calendar.html#L38)** — Make iframe height responsive.
- [ ] **[pathfinders.html](pathfinders.html)** — Fix empty alt text and add a registration CTA.
- [ ] **[epoch.html](epoch.html)** — Move inline iframe styles into CSS and update placeholders.
- [ ] **[music.html](music.html)** — Rename mislabeled IDs and move inline iframe styles into CSS.
- [ ] **[college.html](college.html) / [connection.html](connection.html) / [collegiate.html](collegiate.html) / [directory.html](directory.html)** — Replace meta-refresh redirects with proper destination links or 301s; add `<meta name="robots" content="noindex">` so they don't compete in search.
- [ ] **[young-adults.html](young-adults.html) / [personal-ministries.html](personal-ministries.html) / [children.html](children.html)** — Expand with ministry descriptions, schedules, leader contacts, photos.
- [ ] **[zeitgeist.html](zeitgeist.html)** — Decide whether it should redirect to Epoch or be removed entirely; either way, update the canonical link strategy.

<!-- End of improvements checklist -->
