# Website Improvements — Round 2

> **Created:** All items created by Claude Opus 4.7 on **May 30, 2026**.  
> **Archived:** All items completed and this document moved to `docs/` on **TBD**.

A fresh batch of suggestions building on the work captured in [2026-05-29-ImprovementSuggestions.md](2026-05-30-ImprovementSuggestions.md). These focus on **engagement, observability, content depth, and modernization** now that foundational accessibility, SEO, security, performance, and PWA work is in place.

> **Tip:** Sections are ordered from most to least impactful for a church website. Within each section, quick wins are listed before larger structural work.

---

## Cost Assessment — GitHub Pages + Nonprofit Tools

> **Assessed:** May 30, 2026. Constraints: GitHub Pages (static hosting), nonprofit Google Workspace, nonprofit Microsoft 365, free Cloudflare tier.

**~90% of all items are fully free.** Summary:

| Category | Count | Notes |
|---|---|---|
| Free, no new dependencies | ~85 items | Pure HTML/CSS/JS/build changes, GitHub Actions, GA4, Playwright |
| Free via Cloudflare free tier | ~10 items | HTTP security headers (`Permissions-Policy`, `COEP/COOP`, `Trusted-Types`, CSP reporting) — Cloudflare Transform Rules + free Worker (100K req/day) |
| Free via form backends | ~5 items | Mailchimp free (500 contacts), Buttondown free, or Google Forms (unlimited with nonprofit plan) for prayer/contact/RSVP forms |
| Free but requires architectural decision | ~3 items | PR preview deploys → Cloudflare Pages free tier (also solves headers); podcast audio → archive.org or Google Drive; localized `/es/` `/ko/` paths → static build restructure |
| **Requires paid service** | **0** | — |

### Key free-tool mappings

- **Forms (§1):** Google Forms (nonprofit, unlimited) for RSVPs; Formspree free (50/mo) or Mailchimp free for newsletter signup
- **Security headers (§9):** Cloudflare free tier proxy replaces GitHub Pages header limitation
- **Observability (§4):** UptimeRobot free, Sentry free (5K events/mo), GA4 + `web-vitals`, Discord webhook from Actions
- **Search (§5):** Pagefind — zero-config, fully static, free
- **Podcast audio (§2):** archive.org (free, unlimited) or nonprofit OneDrive/Google Drive as CDN
- **PR previews (§12):** Cloudflare Pages free tier (500 builds/mo, unlimited preview URLs)
- **Member directory gating (§3):** Cloudflare Access free tier (up to 50 seats)
- **SEO tools (§6):** Google Search Console (free), Bing Webmaster Tools (free)
- **Static OG images (§6):** `sharp` + `node-canvas` in existing Actions build — free

---

---

## 1. Engagement & Forms

The site currently has zero `<form>` elements — every interaction is a `mailto:`, phone link, or external Google Form. Native forms unlock measurable conversion and remove friction. This is the single biggest gap.

- [] **Newsletter email signup form** — Replace the "subscribe via email" mailto with a native form (Mailchimp / Buttondown / Beehiiv embed, or a Cloudflare Worker → SendGrid pipeline). Track signups as a GA4 conversion.
- [] **Prayer request form** — A simple `<form>` posting to a serverless endpoint (or Formspree/Basin) routed to pastoral staff. Honor an "anonymous" checkbox.
- [] **Contact form** — General inquiries form on a new `/contact.html` (or section on index) with topic dropdown (worship, ministry, technical, other) and spam honeypot.
- [] **First-time visitor card** — Lightweight form (name, family size, what brought you) on `/visiting.html` that emails the greeting team.
- [] **Event RSVP forms** — For Pathfinder registrations and special services, replace the external Google Form links with native forms.
- [] **Form validation UX** — Use HTML5 constraints + `:user-invalid` and inline error text rather than browser-default messages.
- [] **Add `<dialog>` for confirmations** — Native modal for "thank you" confirmations after form submission; no JS modal libraries needed.

---

## 2. Content Features

The site is currently a brochure. Adding evergreen, repeatable content is what keeps people returning and what visitors actually search for.

- [] **"What to expect on your first visit" page** — Dress, parking, kids' programs, language services. Highest-converting page a church website can have.
- [] **Service-times card on every page** — Small persistent component (footer or slide-out) showing the next service time computed in the visitor's timezone.
- [] **Sermon archive page** — `/sermons.html` listing past sermons (title, speaker, date, scripture, YouTube embed, audio). Source from a JSON file the team can append to.
- [] **Calendar ICS export** — Publish `/cksda.ics` that mirrors the Google/Outlook calendar so visitors can subscribe without needing a Google account.
- [] **Ministry leader bios** — Photo + short bio + contact for each ministry page. Builds trust and gives visitors a real person to reach out to.
- [] **Newsletter archive index** — Listing past newsletters with date + headline; today the page only shows the current one.
- [] **Podcast / audio feed** — Generate a podcast RSS (`/podcast.xml`) from the sermon JSON so members can subscribe in Apple Podcasts, Spotify, Pocket Casts.
- [] **RSS / Atom feed for newsletters** — `/newsletter.xml` so members can follow in any feed reader; also useful for syndication to social tools.
- [] **Photo gallery / past events** — Lazy-loaded grid (CSS `aspect-ratio` + `loading="lazy"`) for Pathfinders, Epoch, special services. Static, no CMS required.
- [] **Testimonials / member stories** — 3–5 short stories on the homepage to humanize the church.

---

## 3. Community & Outreach Features

Conversion-oriented features that turn casual visitors into engaged members.

- [] **Online giving page** — Replace external AdventistGiving link with an embedded iframe (with `sandbox`) so visitors don't leave the site.
- [] **"Watch live" status indicator** — Small dot in the header that turns green during Sabbath service hours.
- [] **Recurring event countdowns** — JS counts down to next Sabbath, next Pathfinders meeting, next Epoch on relevant pages.
- [] **Volunteer signup** — `/serve.html` listing ministries with open volunteer roles; clicking opens a contact form.
- [] **Social share buttons on newsletters** — Native Web Share API on mobile, fallback links on desktop. No third-party widgets needed.
- [] **Member directory (gated)** — Behind a simple password or email-link auth (e.g., Cloudflare Access). Lower priority given privacy considerations.

---

## 4. Observability & Health

You have GA4 + Clarity for behavior, but no signal when the site itself misbehaves.

- [ ] **Uptime monitoring** — Free tier of UptimeRobot / BetterStack pinging `cksda.church/` and `cksda.church/newsletter.html` every 5 minutes; alert to email or Discord.
- [] **404 page with analytics** — Custom `/404.html` that logs a GA4 event with the requested path, so broken inbound links surface in reports.
- [] **Synthetic check for verse-of-day API** — The `update-verse.yml` cron silently no-ops if the upstream API changes shape. Add a workflow assertion that the resulting JSON has expected fields and fail loudly.
- [] **Client-side error tracking** — Add Sentry (or Highlight, or a self-hosted GlitchTip) with a low-volume free tier. Capture uncaught errors, unhandled promise rejections, and CSP violations.
- [ ] **CSP violation reporting** — Add `report-to` / `report-uri` to the CSP header so blocked requests get logged rather than silently failing.
- [] **Web Vitals → GA4** — Send LCP, INP, CLS, TTFB to GA4 via the `web-vitals` library so you can monitor real-user performance per page.
- [] **Deploy notifications** — Post a Discord/Slack webhook on every successful deploy with the commit message, so the team knows when content is live.

---

## 5. UX Polish

User-visible quality-of-life improvements that compound.

- [] **Dark mode toggle** — Three-state (system / light / dark) saved in `localStorage`, with a sun/moon icon in the header.
- [] **"Copy address" / "Get directions" buttons** — One-tap maps link and clipboard copy on every page footer.
- [ ] **Search box** — Pagefind (zero-config, static) gives full-text search across the site with no backend.
- [] **Sticky service-times mini-banner** — Dismissible banner ("This Sabbath: Sabbath School 9:45, Worship 11:00") on the index page.
- [] **Breadcrumbs** — Below the header on inner pages so users know where they are and can navigate up.
- [] **Smooth scroll for in-page anchors** — `scroll-behavior: smooth` with the reduced-motion guard.
- [] **Back-to-top button** — Appears after scrolling past the viewport on long pages.
- [] **Reading time estimates** — For the newsletter and any long content.
- [] **Page transitions** — Pair with the view-transitions API for smooth navigation.

---

## 6. SEO — Round 2

Foundations are in; these are growth levers.

- [ ] **Submit sitemap to Google Search Console + Bing Webmaster Tools** — Track coverage, click-through rate, and indexing errors. Five-minute task with huge ongoing payoff.
- [] **Local business schema** — Add `PostalAddress`, `geo`, `telephone`, `openingHoursSpecification` so Google Maps and Search pull the church card directly.
- [] **Per-page JSON-LD** — Index has `Church` schema, but events (Pathfinder dates, special services, baptisms) should emit `Event` schema, and sermons should emit `VideoObject`.
- [] **FAQ schema on a `/faq.html`** — Generates rich result snippets in Google for common questions ("What time is service?", "Is there childcare?").
- [] **`BreadcrumbList` schema + visible breadcrumbs** — Helps both UX and search snippets.
- [] **Internal link audit** — Many ministry pages don't link to related pages. Add a "Related ministries" block at the bottom of each.
- [ ] **Image SEO** — Add descriptive filenames (replace `pic01.jpg` style with `sabbath-school-children.jpg`) and ensure `alt` text contains target keywords naturally.
- [ ] **Open Graph image generator** — Per-page OG images (currently one shared image) via an HTML-to-PNG build step or a simple Cloudflare Worker.

---

## 7. Accessibility — Beyond the Basics

You've cleared WCAG AA basics; these go further.

- [] **`prefers-reduced-motion` audit** — Wrap any CSS transitions/animations and the YouTube autoplay behavior in `@media (prefers-reduced-motion: reduce)`.
- [] **Live region for verse-of-day updates** — When the verse loads asynchronously, announce it via `aria-live="polite"` so screen-reader users know content arrived.
- [] **Language switcher keyboard support** — Verify the language dropdown is operable by keyboard and screen reader, with `aria-label` and `aria-current`.
- [] **Alt text for decorative vs informative** — Audit every image: decorative should be `alt=""` + `role="presentation"`; informative needs descriptive alt. Document the convention in `README.md`.
- [] **Accessibility statement page** — `/accessibility.html` describing the conformance target (WCAG 2.2 AA), known limitations, and a contact for accessibility issues.
- [ ] **Automated a11y audit in CI** — Add `@axe-core/playwright` to the Playwright suite; fail the build on new serious/critical violations.
- [] **Keyboard navigation regression test** — Add a Playwright test that tabs through index/newsletter/pathfinders and asserts focus is always visible and order is logical.
- [] **`prefers-contrast: more`** — Provide a higher-contrast color palette for users who request it at the OS level.

---

## 8. Internationalization — Depth

Translation strings exist; the architecture around them can mature.

- [] **Translation drift CI check** — A Node script run in CI that diffs key sets between `en.json`, `es.json`, `ko.json` and fails on missing/extra keys.
- [] **Language preference persistence** — Save the chosen language in `localStorage` and honor it on next visit before falling back to browser language.
- [] **`<html lang>` reflects active language across the SPA-style swap** — Verify it changes when the user clicks Korean, not just on initial load.
- [ ] **Localized URLs** — `/es/` and `/ko/` path prefixes so search engines index translated content separately and users can share language-specific links. Use `hreflang` to link them.
- [ ] **Pluralization & ICU MessageFormat** — Adopt `@formatjs/intl-messageformat` (small) so strings like "1 service" / "3 services" work correctly across languages.
- [ ] **Number / currency formatting** — Use `Intl.NumberFormat` for any monetary amounts (giving, scholarship totals).
- [ ] **Right-to-left readiness** — Even if no RTL language is planned, switch to logical properties (`margin-inline-start`, etc.) so future Arabic/Hebrew is one config flag away.

---

## 9. Security — Round 2

- [] **Permissions-Policy header** — Lock down APIs you never use (`camera`, `microphone`, `geolocation`, `payment`, `usb`, `interest-cohort`). Today they're all implicitly allowed.
- [] **`Referrer-Policy: strict-origin-when-cross-origin`** — Limit referrer leakage when users click outbound links.
- [ ] **Subresource Integrity (SRI)** — Any remaining third-party `<script src>` or `<link rel="stylesheet">` from a CDN should include `integrity` and `crossorigin` attributes.
- [ ] **Trusted Types policy** — Add `Content-Security-Policy: require-trusted-types-for 'script'` to defang any future `innerHTML` mistakes.
- [ ] **`Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`** — Even without SharedArrayBuffer needs, setting these tightens the security posture.
- [] **Audit `target="_blank"` rels periodically** — Add an ESLint rule (or `eslint-plugin-html`) so future regressions can't ship.

---

## 10. Performance — Round 2

Foundational wins are done; these are the next 10–20%.

- [] **`fetchpriority="high"` on the LCP image** — Cheap one-attribute hint that meaningfully improves LCP on Chromium.
- [] **Service-worker cache versioning** — Confirm `sw.js` uses a versioned cache name and `skipWaiting` + `clients.claim` so deploys don't strand users on stale assets.
- [ ] **Preload the hero font and LCP image** — `<link rel="preload" as="font" crossorigin>` and `<link rel="preload" as="image">` for the largest contentful paint asset on each page.
- [] **Resource hints audit** — `dns-prefetch` and `preconnect` for googletagmanager, clarity, youtube.com domains before the scripts load.
- [ ] **Self-host Google Fonts** — Even with preconnect, third-party fonts add a DNS hop and a request. Subset the actual glyphs used and serve as WOFF2 from `/assets/webfonts/`.
- [ ] **Subset Font Awesome** — You almost certainly use <30 icons; build a custom kit or switch to inline SVG sprites. Current full FA is ~80KB of CSS + font files.
- [] **Stale-while-revalidate for JSON** — `verse-today.json` and language files should use SWR so users see instant content but get freshness on the next visit.
- [ ] **Image CDN or `srcset` widths** — Today images are served at one resolution. Generate 480/768/1280 variants via the existing `sharp` build step and emit `srcset`.
- [ ] **Eliminate unused CSS per page** — Run PurgeCSS as a build step keyed by each HTML file; ministry pages don't need newsletter.css rules and vice versa.

---

## 11. Analytics — Depth

GA4 is wired; richer events unlock real insight.

- [] **Outbound link tracking** — Auto-tag every `target="_blank"` click with `link_domain` and `link_url`. A 10-line listener does it for all of them.
- [] **Scroll-depth events** — Fire at 25/50/75/100% for long pages (newsletter, ministry pages) to measure engagement.
- [ ] **YouTube embed engagement** — Use the YouTube IFrame API to track play / pause / 25%-50%-75%-100% watched as GA4 events.
- [] **Custom dimensions** — Send `language`, `theme` (light/dark), and `is_pwa_installed` as GA4 user properties.
- [ ] **Conversion funnels** — Mark "view newsletter", "click subscribe", "submit signup" as a funnel in GA4 once the signup form exists.
- [] **Heatmap sampling note** — Verify Clarity isn't recording sensitive content (form inputs) — mask any future PII fields with `data-clarity-mask`.

---

## 12. Testing & CI

- [ ] **Lighthouse CI** — Run `lhci autorun` against staged URLs on every PR; fail on regressions below thresholds (Performance ≥90, A11y ≥95, SEO ≥95, Best Practices ≥95).
- [] **HTML validation in CI** — `html-validate` or `vnu-jar` to catch malformed markup before deploy.
- [] **Dependabot / Renovate** — Keep npm and Actions dependencies patched automatically.
- [ ] **PR preview deploys** — Use GitHub Actions + Cloudflare Pages (or Netlify Drop) to publish a preview URL on every PR, with a comment-bot posting the link.
- [] **Desktop + tablet viewports in Playwright** — Today only 3 mobile devices are tested; add 1280×800 and iPad Mini.
- [] **Visual regression snapshots** — Playwright `toHaveScreenshot()` on key pages; review diffs in PRs.
- [] **CSP regression test** — Playwright test that loads each page and asserts zero CSP violations in the console.

---

## 13. Resilience & Operations

- [] **Disaster-recovery doc** — Short runbook in `docs/`: who to contact, where the domain is registered, how DNS is configured, how to roll back a deploy.
- [ ] **Domain expiry monitoring** — Calendar reminder or automated check for the `cksda.church` domain renewal.
- [] **Secrets rotation policy** — Document when/how to rotate the YouTube/SharePoint API keys injected at build time.
- [] **Backup strategy** — Even though Git is the source of truth, snapshot the generated `verse-today.json` history and any future user-submitted data (forms).
- [ ] **Status page** — `status.cksda.church` (hosted free on UptimeRobot/BetterStack) for incidents like livestream outages.
- [] **Migration evaluation** — Cloudflare Pages gives you headers (`_headers` file), redirects (`_redirects`), edge functions, and per-page OG image generation that GitHub Pages can't. Worth a feasibility note.

---

## 14. Modern CSS Architecture

The CSS is solid but uses few modern features. These are quality-of-code improvements rather than user-visible wins.

- [ ] **CSS custom properties for theme** — Move colors, spacing scale, radii, and shadows to `--tokens` in `:root` and reference everywhere. Makes the eventual dark-mode toggle trivial.
- [] **Print stylesheet** — `@media print` rules so the newsletter, calendar, and sermon pages print cleanly (hide nav, expand collapsed sections, black text on white).
- [ ] **Logical properties** — Replace `margin-left/right/top/bottom` with `margin-block`/`margin-inline`.
- [ ] **Adopt `@layer`** — Define explicit cascade layers (`reset`, `base`, `layout`, `components`, `utilities`, `overrides`) so specificity battles disappear.
- [ ] **Container queries on cards/embeds** — Newsletter cards, ministry tiles, and YouTube embeds should respond to their container width, not the viewport.
- [ ] **`:has()` selectors** — Cleaner conditional styling (e.g., "style a `nav` that contains a `.current` item differently") without JS.
- [ ] **`color-mix()` and `oklch()`** — Modern color manipulation gives you hover/active states from a single source color.
- [] **`view-transitions` API** — Smooth cross-page navigation between ministry pages with a few lines of CSS once the rest is in place.

---

## 15. Modern JS Architecture

- [ ] **Replace `breakpoints.min.js` / `browser.min.js`** — These are legacy HTML5 UP utilities you likely don't need anymore. Audit references and delete what's unused.
- [] **AbortController for fetches** — When the user changes language quickly, cancel the in-flight previous fetch.
- [ ] **Migrate to ES modules** — `<script type="module" defer>` plus real `import`/`export` instead of IIFE-wrapped globals. The build already runs esbuild, so this is a small lift.
- [ ] **Tree-shake the build** — With ESM, esbuild can drop unused code from analytics/newsletter/youtube bundles per page.
- [ ] **Code-split per page** — Newsletter logic only loads on `newsletter.html`; YouTube only on pages that embed it.
- [ ] **Typed JSDoc + `// @ts-check`** — Get TypeScript-grade type checking without converting files; great for catching bugs in `main.js`.
- [ ] **Add a tiny test framework** — `node --test` is built in; write unit tests for `page-config.js`, language fallback, and the verse-fetch parser.

---

## 16. Build & Developer Experience

- [] **`README.md` quickstart** — `npm install && npm start` instructions with screenshot of expected output.
- [] **Document the build pipeline** — Diagram in `docs/` showing the data flow (lang JSON → main.js → DOM, verse-cron → JSON → newsletter, esbuild → minified outputs).
- [] **Pre-commit hooks** — `lint-staged` + `husky` (or `simple-git-hooks`) running Prettier, ESLint, Stylelint on touched files only.
- [ ] **Conventional commits + auto-changelog** — Generate `CHANGELOG.md` from commit messages; helpful when multiple contributors arrive.
- [ ] **TypeScript project references for JSON** — `langStrings/*.json` could be typed with a generated `.d.ts` so missing keys break the build, not the user's screen.
- [ ] **Migrate away from `.html` everywhere** — Adopt a tiny static-site generator (Eleventy is the lowest-friction match) so headers/footers/analytics are partials, not duplicated markup. Build outputs the same flat `.html` files GitHub Pages serves.
- [ ] **Storybook-lite for components** — Even with vanilla HTML, a `/dev/components.html` that showcases every reusable block (card, hero, button, banner) speeds iteration.

<!-- End of round-2 improvements checklist -->
