# Website Improvements — Round 2

> **Created:** All items created by Claude Opus 4.7 on **May 30, 2026**.  
> **Archived:** All items completed and this document moved to `docs/` on **TBD**.

A fresh batch of suggestions building on the work captured in [2026-05-29-ImprovementSuggestions.md](2026-05-30-ImprovementSuggestions.md). These focus on **engagement, observability, content depth, and modernization** now that foundational accessibility, SEO, security, performance, and PWA work is in place.

> **Scope update (June 1, 2026):** Newsletter should stay focused on automation reliability only (no signup/share/archive/read-time changes for now); prayer requests should emphasize the existing texting hotline; service times already exist in the footer (focus on clarity improvements, not duplication); avoid Cloudflare-dependent recommendations.

> **Tip:** Sections are ordered from most to least impactful for a church website. Within each section, quick wins are listed before larger structural work.

---

## Cost Assessment — GitHub Pages + Nonprofit Tools

> **Assessed:** May 30, 2026. Constraints: GitHub Pages (static hosting), nonprofit Google Workspace, nonprofit Microsoft 365.

**~90% of all items are fully free.** Summary:

| Category | Count | Notes |
|---|---|---|
| Free, no new dependencies | ~80 items | Pure HTML/CSS/JS/build changes, GitHub Actions, GA4, Playwright |
| Free via nonprofit/existing services | ~10 items | Google Forms/Workspace workflows, YouTube-first content, AudioVerse linking options |
| Free but requires architectural decision | ~3 items | Localized `/es/` `/ko/` paths, static OG image generation, optional host migration |
| **Requires paid service** | **0** | — |

### Key free-tool mappings

- **Forms (§1):** Existing native forms plus Google Workspace-friendly flows for contact/RSVP and clear prayer-text hotline CTAs
- **Observability (§4):** UptimeRobot free, Sentry free (5K events/mo), GA4 + `web-vitals`, Discord webhook from Actions
- **Search (§5):** Pagefind — zero-config, fully static, free
- **Audio distribution (§2):** Keep YouTube as primary source; optionally link to AudioVerse if/when sermons are published there
- **SEO tools (§6):** Google Search Console (free), Bing Webmaster Tools (free)
- **Static OG images (§6):** `sharp` + `node-canvas` in existing Actions build — free

---

---

## 1. Engagement & Forms

The site currently has zero `<form>` elements — every interaction is a `mailto:`, phone link, or external Google Form. Native forms unlock measurable conversion and remove friction. This is the single biggest gap.

- [ ] **Prayer request texting hotline CTA** — Keep prayer requests centered on the existing text hotline; improve wording/visibility wherever prayer actions appear so people know texting is the primary path.
- [ ] **Contact form** — General inquiries form on a new `/contact.html` (or section on index) with topic dropdown (worship, ministry, technical, other) and spam honeypot.
- [ ] **First-time visitor card** — Lightweight form (name, family size, what brought you) on `/visiting.html` that emails the greeting team.
- [ ] **Event RSVP forms** — For Pathfinder registrations and special services, replace the external Google Form links with native forms.
- [ ] **Form validation UX** — Use HTML5 constraints + `:user-invalid` and inline error text rather than browser-default messages.
- [ ] **Add `<dialog>` for confirmations** — Native modal for "thank you" confirmations after form submission; no JS modal libraries needed.

---

## 2. Content Features

The site is currently a brochure. Adding evergreen, repeatable content is what keeps people returning and what visitors actually search for.

- [ ] **"What to expect on your first visit" page** — Dress, parking, kids' programs, language services. Highest-converting page a church website can have.
- [ ] **Service-times footer enhancement** — Keep service times in the existing footer on every page, but improve readability and visual hierarchy (especially mobile).
- [x] **Calendar ICS export** — Publish `/cksda.ics` that mirrors the Google/Outlook calendar so visitors can subscribe without needing a Google account.
- [ ] **Ministry leader bios** — Photo + short bio + contact for each ministry page. Builds trust and gives visitors a real person to reach out to.
- [ ] **AudioVerse link strategy (optional)** — If sermons are later mirrored to AudioVerse, add a simple outbound link and explanation rather than introducing a separate in-site audio pipeline now.
- [ ] **Instagram-first photo strategy** — Keep photos on Instagram as the source of truth; if needed, add a lightweight "latest photos" link/embed rather than maintaining a separate gallery page.

---

## 3. Community & Outreach Features

Conversion-oriented features that turn casual visitors into engaged members.

- [x] **AdventistGiving outbound flow improvements** — Evaluated: AdventistGiving does not publish a custom URL scheme and has not configured universal/app links, so there is no way to open the app automatically from a web link. The existing `https://adventistgiving.org` link is kept as-is.
- [ ] **"Watch live" status indicator** — Small dot in the header that turns green during Sabbath service hours.
- [ ] **Sabbath countdown only** — Keep a single countdown to next Sabbath service; remove additional per-ministry event countdown complexity.
- [ ] **Volunteer signup** — `/serve.html` listing ministries with open volunteer roles; clicking opens a contact form.
- [ ] **Member directory ownership hardening** — Directory already exists at `directory.cksda.church`. Stack confirmed: Gunicorn (Python WSGI) on Render, behind Cloudflare. Framework is Python-based (Django most likely given the auth/directory feature set, but could be Flask). Prioritize moving source/deploy ownership into the church GitHub org (not a personal machine/account) and documenting the Render deploy config, then reassess auth/privacy improvements.

---

## 4. Observability & Health

You have GA4 + Clarity for behavior, but no signal when the site itself misbehaves.

- [ ] **Uptime monitoring** — Free tier of UptimeRobot / BetterStack pinging `cksda.church/` and `cksda.church/newsletter.html` every 5 minutes; alert to email or Discord.
- [x] **404 page with analytics** — Custom `/404.html` that logs a GA4 event with the requested path, so broken inbound links surface in reports.
- [x] **Synthetic check for verse-of-day API** — The `update-verse.yml` cron silently no-ops if the upstream API changes shape. Add a workflow assertion that the resulting JSON has expected fields and fail loudly.
- [ ] **Client-side error tracking** — Add Sentry (or Highlight, or a self-hosted GlitchTip) with a low-volume free tier. Capture uncaught errors, unhandled promise rejections, and CSP violations.
- [ ] **CSP violation reporting** — Add `report-to` / `report-uri` to the CSP header so blocked requests get logged rather than silently failing.
- [x] **Web Vitals → GA4** — Send LCP, INP, CLS, TTFB, FCP to GA4 via native PerformanceObserver APIs (`web-vitals.js` → `web-vitals.min.js`); no external library needed.
- [ ] **Deploy notifications** — Post a Discord/Slack webhook on every successful deploy with the commit message, so the team knows when content is live.

---

## 5. UX Polish

User-visible quality-of-life improvements that compound.

- [x] **Dark mode toggle** — Three-state (system / light / dark) `◐` button saved in `localStorage`.
- [x] **Language/theme control visibility tuning** — Controls moved to a fixed floating pill (bottom-left), mirroring the back-to-top button.
- [x] **Footer address presentation polish** — Mailing address/contact/footer utility layout improved for readability on small screens.
- [x] **Search box** — Evaluated and intentionally not added; site owner preference is to keep search off the site.
- [x] **Breadcrumbs** — Implemented via `initBreadcrumbs()` on all inner pages.
- [x] **Smooth scroll for in-page anchors** — `scroll-behavior: smooth` with `prefers-reduced-motion` guard in CSS.
- [x] **Back-to-top button** — Fixed bottom-right button appears after scrolling; reduced-motion safe.
- [x] **Page transitions** — `@view-transition` CSS + `initViewTransitions()` JS wired on all page navigations.
- [x] **Newsletter link in nav** — Added `newsletter.html` link to main header navigation.
- [x] **Fix light-mode mobile app icon contrast** — Update app icon assets so the light-mode icon is distinct (not white-on-white) when saved to Home Screen.
- [x] **Fix mobile footer wrapping/crowding** — Resolve cramped copyright/privacy/footer-link layout on mobile widths.

---

## 6. SEO — Round 2

Foundations are in; these are growth levers.

- [ ] **Submit sitemap to Google Search Console + Bing Webmaster Tools** — Track coverage, click-through rate, and indexing errors. Five-minute task with huge ongoing payoff.
- [ ] **Local business schema** — Add `PostalAddress`, `geo`, `telephone`, `openingHoursSpecification` so Google Maps and Search pull the church card directly.
- [ ] **Per-page JSON-LD** — Index has `Church` schema, but events (Pathfinder dates, special services, baptisms) should emit `Event` schema, and sermons should emit `VideoObject`.
- [ ] **FAQ schema on a `/faq.html`** — Generates rich result snippets in Google for common questions ("What time is service?", "Is there childcare?").
- [ ] **`BreadcrumbList` schema + visible breadcrumbs** — Helps both UX and search snippets.
- [ ] **Internal link audit** — Many ministry pages don't link to related pages. Add a "Related ministries" block at the bottom of each.
- [ ] **Image SEO** — Add descriptive filenames (replace `pic01.jpg` style with `sabbath-school-children.jpg`) and ensure `alt` text contains target keywords naturally.
- [ ] **Open Graph image generator** — Per-page OG images (currently one shared image) via an HTML-to-PNG build step in CI.

---

## 7. Accessibility — Beyond the Basics

You've cleared WCAG AA basics; these go further.

- [ ] **`prefers-reduced-motion` audit** — Wrap any CSS transitions/animations and the YouTube autoplay behavior in `@media (prefers-reduced-motion: reduce)`.
- [ ] **Live region for verse-of-day updates** — When the verse loads asynchronously, announce it via `aria-live="polite"` so screen-reader users know content arrived.
- [ ] **Language switcher keyboard support** — Verify the language dropdown is operable by keyboard and screen reader, with `aria-label` and `aria-current`.
- [ ] **Alt text for decorative vs informative** — Audit every image: decorative should be `alt=""` + `role="presentation"`; informative needs descriptive alt. Document the convention in `README.md`.
- [ ] **Accessibility statement page** — `/accessibility.html` describing the conformance target (WCAG 2.2 AA), known limitations, and a contact for accessibility issues.
- [ ] **Automated a11y audit in CI** — Add `@axe-core/playwright` to the Playwright suite; fail the build on new serious/critical violations.
- [ ] **Keyboard navigation regression test** — Add a Playwright test that tabs through index/newsletter/pathfinders and asserts focus is always visible and order is logical.
- [x] **`prefers-contrast: more`** — Provide a higher-contrast color palette for users who request it at the OS level.

---

## 8. Internationalization — Depth

Translation strings exist; the architecture around them can mature.

- [ ] **Translation drift CI check** — A Node script run in CI that diffs key sets between `en.json`, `es.json`, `ko.json` and fails on missing/extra keys.
- [x] **Language preference persistence** — Save the chosen language in `localStorage` and honor it on next visit before falling back to browser language.
- [x] **`<html lang>` reflects active language across the SPA-style swap** — Verify it changes when the user clicks Korean, not just on initial load.
- [ ] **Localized URLs** — `/es/` and `/ko/` path prefixes so search engines index translated content separately and users can share language-specific links. Use `hreflang` to link them.
- [ ] **Pluralization & ICU MessageFormat** — Adopt `@formatjs/intl-messageformat` (small) so strings like "1 service" / "3 services" work correctly across languages.
- [ ] **Number / currency formatting** — Use `Intl.NumberFormat` for any monetary amounts (giving, scholarship totals).
- [ ] **Right-to-left readiness** — Even if no RTL language is planned, switch to logical properties (`margin-inline-start`, etc.) so future Arabic/Hebrew is one config flag away.

---

## 9. Security — Round 2

- [ ] **Permissions-Policy header** — Lock down APIs you never use (`camera`, `microphone`, `geolocation`, `payment`, `usb`, `interest-cohort`). Today they're all implicitly allowed.
- [ ] **`Referrer-Policy: strict-origin-when-cross-origin`** — Limit referrer leakage when users click outbound links.
- [ ] **Subresource Integrity (SRI)** — Any remaining third-party `<script src>` or `<link rel="stylesheet">` from a CDN should include `integrity` and `crossorigin` attributes.
- [ ] **Trusted Types policy** — Add `Content-Security-Policy: require-trusted-types-for 'script'` to defang any future `innerHTML` mistakes.
- [ ] **`Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`** — Even without SharedArrayBuffer needs, setting these tightens the security posture.
- [ ] **Audit `target="_blank"` rels periodically** — Add an ESLint rule (or `eslint-plugin-html`) so future regressions can't ship.

---

## 10. Performance — Round 2

Foundational wins are done; these are the next 10–20%.

- [ ] **`fetchpriority="high"` on the LCP image** — Cheap one-attribute hint that meaningfully improves LCP on Chromium.
- [x] **Service-worker cache versioning** — Confirm `sw.js` uses a versioned cache name and `skipWaiting` + `clients.claim` so deploys don't strand users on stale assets.
- [ ] **Preload the hero font and LCP image** — `<link rel="preload" as="font" crossorigin>` and `<link rel="preload" as="image">` for the largest contentful paint asset on each page.
- [ ] **Resource hints audit** — `dns-prefetch` and `preconnect` for googletagmanager, clarity, youtube.com domains before the scripts load.
- [ ] **Self-host Google Fonts** — Even with preconnect, third-party fonts add a DNS hop and a request. Subset the actual glyphs used and serve as WOFF2 from `/assets/webfonts/`.
- [ ] **Subset Font Awesome** — You almost certainly use <30 icons; build a custom kit or switch to inline SVG sprites. Current full FA is ~80KB of CSS + font files.
- [ ] **Stale-while-revalidate for JSON** — `verse-today.json` and language files should use SWR so users see instant content but get freshness on the next visit.
- [ ] **Image CDN or `srcset` widths** — Today images are served at one resolution. Generate 480/768/1280 variants via the existing `sharp` build step and emit `srcset`.
- [ ] **Eliminate unused CSS per page** — Run PurgeCSS as a build step keyed by each HTML file; ministry pages don't need newsletter.css rules and vice versa.

---

## 11. Analytics — Depth

GA4 is wired; richer events unlock real insight.
 - [x] **Outbound link tracking** — Auto-tag every `target="_blank"` click with `link_domain` and `link_url`. A 10-line listener does it for all of them.
 - [x] **Scroll-depth events** — Fire at 25/50/75/100% for long pages (newsletter, ministry pages) to measure engagement.
 - [x] **YouTube embed engagement** — Use the YouTube IFrame API to track play / pause / 25%-50%-75%-100% watched as GA4 events.
 - [ ] **YouTube embed engagement** — Use the YouTube IFrame API to track play / pause / 25%-50%-75%-100% watched as GA4 events.
 - [x] **Custom dimensions** — Send `language`, `theme` (light/dark), and `is_pwa_installed` as GA4 user properties.
 - [x] **Outbound link tracking** — Auto-tag every `target="_blank"` click with `link_domain` and `link_url`.
 - [x] **Scroll-depth events** — Fire at 25/50/75/100% for long pages (newsletter, ministry pages).
 - [x] **YouTube embed engagement** — Use the YouTube IFrame API to track play / pause / 25%-50%-75%-100% watched as GA4 events.
 - [x] **Custom dimensions** — Send `language`, `theme` (light/dark), and `is_pwa_installed` as GA4 user properties.
 - [x] **Conversion funnels** — Mark practical pathways such as "view contact page", "open AdventistGiving", and "start prayer hotline text" as GA4 funnels.
 - [x] **Heatmap sampling note** — Verify Clarity isn't recording sensitive content (form inputs) — mask any future PII fields with `data-clarity-mask`.

---

## 12. Testing & CI

- [ ] **Lighthouse CI** — Run `lhci autorun` against staged URLs on every PR; fail on regressions below thresholds (Performance ≥90, A11y ≥95, SEO ≥95, Best Practices ≥95).
- [ ] **HTML validation in CI** — `html-validate` or `vnu-jar` to catch malformed markup before deploy.
- [ ] **Dependabot / Renovate** — Keep npm and Actions dependencies patched automatically.
- [ ] **PR preview deploys** — Use GitHub Actions + a preview host to publish a preview URL on every PR, with a comment-bot posting the link.
- [ ] **Desktop + tablet viewports in Playwright** — Today only 3 mobile devices are tested; add 1280×800 and iPad Mini.
- [ ] **Visual regression snapshots** — Playwright `toHaveScreenshot()` on key pages; review diffs in PRs.
- [ ] **CSP regression test** — Playwright test that loads each page and asserts zero CSP violations in the console.

---

## 13. Resilience & Operations

- [ ] **Disaster-recovery doc** — Short runbook in `docs/`: who to contact, where the domain is registered, how DNS is configured, how to roll back a deploy.
- [ ] **Domain expiry monitoring** — Calendar reminder or automated check for the `cksda.church` domain renewal.
- [ ] **Secrets rotation policy** — Document when/how to rotate the YouTube/SharePoint API keys injected at build time.
- [ ] **Backup strategy** — Even though Git is the source of truth, snapshot the generated `verse-today.json` history and any future user-submitted data (forms).
- [ ] **Status page** — `status.cksda.church` (hosted free on UptimeRobot/BetterStack) for incidents like livestream outages.

---

## 14. Modern CSS Architecture

The CSS is solid but uses few modern features. These are quality-of-code improvements rather than user-visible wins.

- [x] **CSS custom properties for theme** — Move colors, spacing scale, radii, and shadows to `--tokens` in `:root` and reference everywhere. Makes the eventual dark-mode toggle trivial.
- [x] **Print stylesheet** — `@media print` rules so the newsletter, calendar, and sermon pages print cleanly (hide nav, expand collapsed sections, black text on white).
- [x] **Logical properties** — Replace `margin-left/right/top/bottom` with `margin-block`/`margin-inline`.
- [x] **Adopt `@layer`** — Define explicit cascade layers (`reset`, `base`, `layout`, `components`, `utilities`, `overrides`) so specificity battles disappear.
- [x] **Container queries on cards/embeds** — Newsletter cards, ministry tiles, and YouTube embeds should respond to their container width, not the viewport.
- [x] **`:has()` selectors** — Cleaner conditional styling (e.g., "style a `nav` that contains a `.current` item differently") without JS.
- [x] **`color-mix()` and `oklch()`** — Modern color manipulation gives you hover/active states from a single source color.
- [x] **`view-transitions` API** — Smooth cross-page navigation between ministry pages with a few lines of CSS once the rest is in place.

---

## 15. Modern JS Architecture

- [x] **Replace `breakpoints.min.js` / `browser.min.js`** — Audited: `breakpoints` was initialized in `main.js` but never queried (no `.active()` or `.on()` calls); `browser` was never referenced at all. Both removed from all 9 HTML pages, `main.js`, `main.min.js`, and the service-worker cache list.
- [x] **AbortController for fetches** — `langFetchController` added to `main.js`; aborts any in-flight fetch before starting a new one when language changes.
- [x] **Migrate to ES modules** — IIFE wrappers removed from all source files; `import`/`export` throughout; all HTML pages updated to `<script type="module">`.
- [x] **Tree-shake the build** — esbuild `bundle: true` enabled on `main.js`, `newsletter.js`, `youtube.js`, and `calendar-events.js`; unused exports dropped automatically.
- [x] **Code-split per page** — `newsletter.min.js` bundles `youtube.js` and `verse-utils.js`; `main.min.js` bundles `page-config.js` and `lang-utils.js`; `youtube.min.js` standalone for `index.html` only; `page-config.min.js` removed.
- [x] **Typed JSDoc + `// @ts-check`** — `// @ts-check` added to all source JS files (`main.js`, `page-config.js`, `analytics.js`, `consent.js`, `youtube.js`, `newsletter.js`, `verse-utils.js`, `lang-utils.js`).
- [x] **Add a tiny test framework** — `node --test` unit tests added in `tests/unit/` covering `detectLanguage` (lang-utils), `buildPageConfig` (page-config), and `parseVerseAndReference` / `BIBLE_BOOK_PATTERN` (verse-utils); `npm run test:unit` script added to `package.json`.

---

## 16. Build & Developer Experience

- [ ] **`README.md` quickstart** — `npm install && npm start` instructions with screenshot of expected output.
- [ ] **Document the build pipeline** — Diagram in `docs/` showing the data flow (lang JSON → main.js → DOM, verse-cron → JSON → newsletter, esbuild → minified outputs).
- [ ] **Pre-commit hooks** — `lint-staged` + `husky` (or `simple-git-hooks`) running Prettier, ESLint, Stylelint on touched files only.
- [ ] **Conventional commits + auto-changelog** — Generate `CHANGELOG.md` from commit messages; helpful when multiple contributors arrive.
- [ ] **TypeScript project references for JSON** — `langStrings/*.json` could be typed with a generated `.d.ts` so missing keys break the build, not the user's screen.
- [ ] **Migrate away from `.html` everywhere** — Adopt a tiny static-site generator (Eleventy is the lowest-friction match) so headers/footers/analytics are partials, not duplicated markup. Build outputs the same flat `.html` files GitHub Pages serves.
- [ ] **Storybook-lite for components** — Even with vanilla HTML, a `/dev/components.html` that showcases every reusable block (card, hero, button, banner) speeds iteration.

<!-- End of round-2 improvements checklist -->
