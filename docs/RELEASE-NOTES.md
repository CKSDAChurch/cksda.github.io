# Release Notes

These notes summarize notable website updates by release.
Version numbers follow [Semantic Versioning](https://semver.org/).

## v2.0.0 — June 15, 2026

### Added
- **Friday Korean vespers** — Weekly 7:30–8:30pm Korean vespers added to the footer service schedule (Korean column), `today.html` (shown on Fridays with the vespers playlist link), the `cksda.ics` calendar feed, and the homepage structured data.
- **Day-aware Sabbath section on `today.html`** — Fridays advertise Korean vespers; Saturdays list Sabbath School and worship times. Saturday copy switches from future to past tense after the 1pm ET sermon hour.
- **App shortcuts in `manifest.json`** — Long-pressing the installed icon now offers 5 quick-jump shortcuts: Today/Devotional, Sabbath School Lessons, Newsletter, Calendar, Give.
- **`<link rel="apple-touch-icon">` on all 11 PWA pages** — Adds the correct home-screen icon on iOS Safari for every page that declares the manifest.
- **Custom "Add to Home Screen" install prompt** — `initInstallPrompt()` in `main.js` captures `beforeinstallprompt`, shows a dismissible slide-up banner on the 2nd+ visit, and respects `localStorage` dismissal; no-op on iOS/Firefox where the event is unsupported.
- **FCM push notifications** — `assets/js/fcm-push.js`: dismissible opt-in banner on `today.html`; on approval obtains an FCM registration token and persists it to Firestore (`pushSubscriptions/{token}`); token refresh runs silently on subsequent visits.
- **`scripts/send-push.js`** — Firebase Admin SDK script that reads `devotional-today.json`, queries Firestore subscriber tokens, and dispatches a daily FCM multicast; exits `0` gracefully when the secret is absent or the subscriber list is empty.
- **Firebase Cloud Functions** (`functions/index.js`) — server-side push notification dispatch and subscriber management logic deployed to Firebase.
- **`docs/firestore.rules`** — Firestore security rules restricting `pushSubscriptions` write access to authenticated service accounts only.
- **`firebase.json`, `.firebaserc`** — Firebase project configuration files.
- **Push event handlers in `sw.js`** — `push` and `notificationclick` listeners handle FCM data-only messages and open `today.html` on tap.
- **Visibility-change refresh in `daily.js`** — re-runs `init()` when the user returns to the app after ≥ 5 minutes away; keeps the installed PWA fresh on iOS and all browsers that lack Periodic Background Sync.

### Changed
- **`manifest.json` `start_url`** — Changed to `/today.html?source=pwa`; the installed app now opens the daily dashboard instead of the homepage.
- **Manifest icon entries** — Split combined `"any maskable"` purpose into separate `"any"` and `"maskable"` entries; removed non-standard `media` property from icon objects.
- **`scripts/fetch-daily-data.js` renamed to `scripts/fetch-daily-data.js`** — Name reverted after calendar-event fetching was removed from the script.
- **`daily-devotional.yml` and `deploy.yml`** — Updated script reference to `scripts/fetch-daily-data.js`; added `functions/`, `firebase.json`, and `.firebaserc` to the deploy cleanup `rm` step so they are not published to Pages.
- **`scripts/build.js`** — Added bundled esbuild task for `fcm-push.js` (outputs `fcm-push.min.js`); `fcm-push.js` added as a PurgeCSS content source for `today.min.css`.
- **`sw.js` cache version** — Bumped to `cksda-v2.0.0`.

### Removed
- **Today's calendar events from `today.html` / `daily.js`** — `loadTodayEvents()`, the `calendar-today.json` read path, and the events section removed; `scripts/fetch-daily-data.js` reverted to devotional-only output.

### Fixed
- **Corrected Korean service times** — Korean Sabbath School fixed to 9:30–10:00 (was 9:30–10:30) and Korean Worship to 10:00–11:10 (was 10:30–11:10). Updated everywhere: footer schedule (`en/es/ko` language strings), `today.html`, homepage structured data, and the `cksda.ics` calendar feed. Visitors had been missing services due to the incorrect times.
- **Service worker cache bust** — Bumped `CACHE_NAME` to `cksda-v2.0.1` so returning visitors pick up the updated `fcm-push.min.js` and `daily.min.js` instead of stale cached versions.
- **FCM token registration never ran on `today.html`** — `daily.js` now registers `/sw.js` directly (previously only `main.js` did, which `today.html` doesn't load).
- **Push opt-in blocked by PWA gate in `?debug` mode** — `fcm-push.js` now bypasses the standalone PWA check when `?debug` is in the URL, allowing token registration testing in a regular browser tab.

## v1.11.0 — June 8, 2026

### Added
- **Newsletter "Today" pointer** — A `today-pointer` link at the top of `newsletter.html` directs readers to `today.html` for the daily devotional and today's lesson links, replacing the in-newsletter devotional card.
- **Newsletter in-page TOC** — Pill-style anchor links (`#devotional`, `#lessons`, `#this-week`) let visitors jump directly to any section; matching `id` attributes added to each section heading.
- **"This week" section header with date** — A teal `week-group-header` banner wraps all weekly operational content (sermon, rotation, rides, giving) and displays the current Sabbath date.

### Changed
- **Newsletter devotional section removed** — The verse-of-day card is no longer in `newsletter.html`; daily devotional content now lives exclusively on `today.html`. The "Today" pointer link replaces it.
- **Newsletter lesson links simplified to week-only** — URLs changed from `.../wk/day` to `.../wk` so tiles always open the current week rather than a specific day.
- **`newsletter.js` verse-of-day code removed** — `updateVerseOfDay`, `fetchWhiteEstateVerseOfDay`, `getHtmlFallbackVerseEntry`, and all related helpers deleted; `updateLessonLinks` simplified to replace only the week number.
- **`sw.js` cache version** — Bumped to `cksda-v1.11.0`.

## v1.10.0 — June 8, 2026

### Added
- **`today.html` daily dashboard** — New standalone page with a teal header, live Sabbath countdown chip, sunset time chip (Fri/Sat), current weather (Open-Meteo), daily devotional card, today's church calendar events, all 8 Sabbath School lesson tiles (EM, KM, Collegiate, High School, Earliteen, Juniors, Primary, Cradle Roll), and a Happy Sabbath section (EM/KM service links, auto-detected YouTube video) visible only during active Sabbath hours; powered by `assets/js/daily.js` and `assets/css/today.css`.
- **Today's calendar events on `today.html`** — `scripts/fetch-daily-data.js` fetches both EM and KM Google Calendars at build time, filters to today's events (Eastern time), deduplicates, and writes `assets/data/calendar-today.json`; `daily.js` reads this static file so no API key is needed at runtime.
- **Persistent "Today" top banner** — Fixed `#daily-bar` strip prepended to every main-shell page by `main.js`; shows today's date, says "Happy Sabbath" during Sabbath hours, and links to `today.html` (swaps to "Watch livestream →" when a live YouTube stream is detected on Sabbath).
- **`today.html`, `daily.min.js`, `devotional-today.json`, and `calendar-today.json` precached** — Added to `PRECACHE_URLS` in `sw.js` so the daily dashboard works offline on installed PWAs.
- **`today.html` added to `sitemap.xml`** — With `<changefreq>daily</changefreq>` and priority `0.95`.

### Changed
- **`scripts/fetch-daily-data.js` → `scripts/fetch-daily-data.js`** — Renamed to reflect its expanded scope: now also fetches today's church events from both calendars and writes `assets/data/calendar-today.json`. Both `daily-devotional.yml` and `deploy.yml` updated accordingly.
- **`sw.js` caching strategies** — Navigation handler now tries the cached page (`ignoreSearch: true`) before `/offline.html` so the installed PWA shows real content offline; `devotional-today.json` and `calendar-today.json` now use network-first with cached fallback instead of stale-while-revalidate. Cache version bumped to `cksda-v1.10.0`.
- **`scripts/build.js`** — Added `today` to `cssFiles`, added `daily.js` esbuild task with YouTube API key injection, and added a `today.min.css` PurgeCSS pass with `daily.js` as a content source.
- **`index.html` CSP** — Added `https://api.sunrise-sunset.org` to `connect-src`.
- **`eslint.config.js`** — Added `assets/js/daily.js` to lint content sources.
## v1.9.0 — June 7, 2026

### Added
- **Pastor bio dialog** — Footer pastor tiles are now tappable `<button>` elements with a "View bio ›" cue; clicking opens a native `<dialog>` showing a photo, name, role, biography text, and email link for each pastor.
- **Pastor photos in footer** — Circular `<img>` headshots (`pastor-yang.jpg`, `pastor-jeon.jpg`) added to both footer pastor tiles.
- **`PASTOR_BIOS` data object in `main.js`** — Centralised bio data (name, role, bio text, contact, image path) for Pastor Yang and Pastor Jeon; drives both the footer tiles and the bio dialog.
- **Multi-day event spanning in month grid** — Calendar month view now registers events on every day they cover within the month, so multi-day events appear in all relevant cells.
- **Day-of events popup** — Clicking a month-grid day with multiple events opens a new "day list" popup listing every event with its time; selecting one opens the full event detail popup.
- **Korean calendar support** — `calendar-events.js` now exposes two calendar IDs (`CALENDAR_ID_EM` / `CALENDAR_ID_KM`) and picks the correct one based on `window.lang`, so Korean-language visitors see the KM calendar.
- **Tappable day cells in month view** — Day cells with events are promoted to keyboard/touch-accessible targets using `role="button"` and `tabindex="0"`; single-event days open the detail popup directly.

### Changed
- **Service times layout (footer + homepage)** — Sabbath School and Worship Service times converted from `<p>` blocks to `<dl>`/`<dt>`/`<dd>` definition lists with CSS grid (`footer-service-schedule` / `service-times__schedule`) for accessible, responsive display.
- **Footer pastor tiles** — Changed from `<article>` to `<button>` with `aria-haspopup="dialog"` to semantically communicate interactivity.
- **Back-to-top button icon** — Replaced FontAwesome `fa-chevron-up` with an inline SVG arrow so the icon renders without a webfont dependency; CSS added to size it correctly.
- **Font Awesome family names** — Updated CSS references from `'Font Awesome 5 Free'` / `'Font Awesome 5 Brands'` to `'Font Awesome 6 Free'` / `'Font Awesome 6 Brands'`.
- **Calendar event filter** — Generic "Sabbath School" and "Church Service" recurring events are now filtered out so the calendar page only shows non-routine events.
- **Month-grid event pills** — Event pills changed from `<button>` to `<span>` elements (interactivity moved to the parent day cell); overflow "+N more" similarly demoted to `<span>`.
- **Logo image path** — Header logo `src` corrected from `./images/logo-light.png` to `./assets/images/logo-light.png`.
- **Service worker cache bumped** — `CACHE_NAME` updated to `cksda-v1.9.0`.

### Fixed
- **Multi-day event visibility** — Events spanning across day boundaries were previously only shown on their start day; they now appear on every day they occupy in the month grid.
- **`Intl.DateTimeFormat` TypeScript types** — `formatEvtTimeRange` in `calendar-events.js` now creates the formatter as a named `Intl.DateTimeFormat` instance to avoid TS widening literal option types to `string`.

## v1.8.0 — June 7, 2026

### Fixed

- **Background SVG images now appear on first paint** — Header and footer background images were gated behind `html.theme-light` / `html.theme-dark` CSS selectors but the theme class was only applied by the deferred `main.min.js` module, causing a visible flash of no background on every page load. A tiny inline script now sets the correct theme class in `<head>` before the stylesheet is parsed, so images are fetched from the very first render across all 9 affected pages.
- **Calendar colours now follow the chosen site theme** — Calendar grid, event cards, view toggle, and event popups were styled with OS-level `prefers-color-scheme` media queries while the rest of the site uses class-based theming. When a visitor's OS theme differed from their selected site theme, this produced unreadable combinations (most notably white text on a white event popup). These rules are now class-based (`html.theme-light` / `html.theme-dark`) in `main.css`, so they always match the active theme.
- **Month-view event readability** — Day numbers and event pills now use explicit theme-aware colours instead of inheriting page colours, fixing low-contrast/invisible text in the month grid.

### Added

- **Ministry leader bio cards** — Photo-ready bio cards (`leader-card` component) added to Children's, Music, Personal Ministries, Young Adults, and Pathfinders pages; pastoral team section (Pastor Kangwon Yang + Associate Pastor Daniel Jeon) added to the home page.
- **Tappable day cells in month view** — Each day with events is now a single keyboard- and touch-accessible target (replacing tiny, hard-to-tap event pills). Days with one event open the event detail directly; days with several open a new day popup listing every event for that date with its time.

### Changed

- **Mobile month-grid event indicators** — Event dots enlarged and given a visible, theme-aware colour for better legibility on small screens.

## v1.7.0 — June 3, 2026

### Added

- **Core Web Vitals reporting** — `web-vitals.js` measures LCP, CLS, INP, TTFB, and FCP via native `PerformanceObserver` APIs and sends each metric to GA4 as a non-interaction event; each report includes a `metric_rating` (`good` / `needs-improvement` / `poor`) benchmarked against Google's thresholds.
- **`404.html` page** — new branded 404 error page with dark/light theme using CSS design tokens, radial-gradient background, and a card layout consistent with the site aesthetic; includes CSP and `noindex` meta tag.
- **`offline.html` redesign** — full dark/light theme with CSS design tokens and brand palette, replacing the previous minimal unstyled fallback.

### Changed
- **Service worker cache bumped to `cksda-v4`** — `web-vitals.min.js` added to the pre-cache list to ensure it is available on repeat visits.

## v1.6.0 — June 3, 2026

### Added
- **GA4 custom user properties** — Send `language`, `theme` (light/dark), and `is_pwa_installed` as user-scoped GA4 dimensions to track user preferences and PWA adoption; properties sync when language or theme changes, and on PWA install event.
- **GA4 conversion-funnel events** — Track key user actions as conversion steps: `open_adventist_giving` (giving link), `open_contact_email` (email links), `start_call` (phone links), and `start_prayer_hotline` (prayer hotline specifically). Enables GA4 funnel analysis for visitor engagement.
- **Clarity PII masking for form inputs** — All `<input>`, `<textarea>`, and `[contenteditable]` elements automatically masked with `data-clarity-mask="true"` to prevent Microsoft Clarity from recording sensitive data; includes a DOM mutation observer to catch dynamically added form fields after page load.
- **Clarity masking Playwright test suite** — Added 4 comprehensive tests in `tests/mobile.spec.js` verifying that the masking function correctly identifies and masks text-input fields, ignores button/checkbox/radio types, and masks dynamically inserted inputs.

### Changed
- **Outbound link tracking improvements** — Separated concern: existing outbound link tracking for all `target="_blank"` links now excludes AdventistGiving, which emits its own distinct `open_adventist_giving` GA4 event for funnel analysis.

## v1.5.0 — June 2, 2026

### Added
- **CSS design token system** — Single source of truth for all brand and UI colours defined in `main.css` using `oklch()` for perceptual uniformity; dark/light themes defined via `:root`, `@media (prefers-color-scheme: dark)`, `html.theme-light`, and `html.theme-dark` selectors.
- **`color-mix()` for interactive states** — Button hover and active backgrounds derived from brand tokens using `color-mix(in oklch, ...)`, replacing hard-coded purple-grey fallbacks.
- **Container query for lessons grid** — `.lessons-section` in `newsletter.css` is now a named inline-size container; `@container lessons (max-width: 440px)` collapses the 4-column lessons grid to 2 columns when the section itself is narrow.
- **`:has()` — keyboard-accessible ministry dropdown** — `#ministries:has(:focus-within) .ministryPages` added to `menu.css` so the dropdown stays open during keyboard navigation.
- **`:has()` — dialog scroll-lock** — `html:has(dialog[open])` prevents body scroll while a `<dialog>` is open.
- **`:has()` — form validation highlight** — `.form-card:has(input:user-invalid, ...)` adds a red border tint to any form card containing an invalid field.
- **`@layer` cascade layers** — `@layer base, theme;` declared in `main.css`; FontAwesome and Google Fonts assigned to `layer(base)`, and `lightmode.css`/`darkmode.css`/`menu.css` assigned to `layer(theme)`. Unlayered component and override rules in `main.css` correctly win without specificity hacks.
- **CSS logical properties** — All inline-direction physical properties (`margin-left/right`, `padding-left/right`, `border-left/right`, `text-align: left/right`, `float: left/right`) converted to their logical equivalents across `main.css`, `lightmode.css`, `darkmode.css`, `menu.css`, `newsletter.css`, and `pathfinders.css`. RTL language support now requires only an `html[dir="rtl"]` attribute.

### Changed
- **`lightmode.css` and `darkmode.css`** — All hardcoded colour values replaced with `var(--color-*)` tokens; both files now respond automatically to any future token change.
- **Newsletter devotional fetch strategy** — `newsletter.js` now skips direct White Estate client fetches on production hosts and uses the pre-patched HTML verse (while keeping live fetch behavior for localhost), eliminating expected browser CORS failures for site visitors.
- **Deployment consistency for daily verse** — `deploy.yml` now runs `scripts/fetch-daily-data.js` before publishing, matching `daily-devotional.yml` so push-triggered deploys do not overwrite the same-day devotional update.
- **Playwright runtime compatibility** — migrated Playwright setup to `playwright.config.cjs`, updated ESLint target mapping, and converted `tests/mobile.spec.js` to ESM import syntax so lint and mobile tests run cleanly under `"type": "module"`.

### Fixed
- **Favicon 404 noise** — added explicit favicon links to redirect/offline pages that were missing them (`zeitgeist.html`, `offline.html`, `college.html`, `directory.html`, `collegiate.html`) to reduce browser fallback requests to `/favicon.ico`.
- **Back-to-top progressive enhancement** — documented and stabilized the CSS-first scroll visibility behavior with JS fallback for non-supporting browsers, reducing scroll-handler work where `animation-timeline` is available.
- **Cookie consent styling path** — moved consent banner styling out of runtime JS injection and into stylesheet-driven CSS so first render no longer depends on a dynamic `<style>` append.

## v1.4.0 — June 2, 2026

### Added
- **ES module architecture** — Core runtime JS migrated to `import`/`export`; HTML pages updated to `<script type="module">` where applicable.
- **`lang-utils.js`** — Extracted pure `detectLanguage` function for browser-independent use and unit testing.
- **`verse-utils.js`** — Extracted pure `parseVerseAndReference` and `BIBLE_BOOK_PATTERN` for browser-independent use and unit testing.
- **Unit tests** — `node --test` suite in `tests/unit/` covering `detectLanguage`, `buildPageConfig`, `parseVerseAndReference`, and `BIBLE_BOOK_PATTERN`; `npm run test:unit` script added to `package.json`.
- **`"type": "module"` in `package.json`** — Aligns Node.js module resolution with the ES module source base.

### Changed
- **Build** — `main.js`, `newsletter.js`, `youtube.js`, and `calendar-events.js` now use `bundle: true` + `format: 'esm'` in esbuild; `consent.js` uses `format: 'esm'`; `analytics.js` stays classic (synchronous consent-mode script).
- **`page-config.min.js` removed** — `page-config.js` is now bundled into `main.min.js`; standalone script tag removed from all 9 HTML pages.
- **`newsletter.min.js`** — Now bundles `youtube.js` and `verse-utils.js`; `youtube.min.js` tag removed from `newsletter.html`.
- **AbortController for language fetches** — `loadLanguageFile` in `main.js` aborts any in-flight fetch before starting a new one.
- **`// @ts-check`** — Added to all JS source files for TypeScript-grade type checking without a compilation step.
- **`scripts/build.js`** — Converted from CommonJS `require()` to ESM `import` statements.
- **`sw.js` caching strategy** — Added a dedicated network-first rule for `/assets/programs/verse-today.json` (with cached fallback when offline) so daily devotional updates no longer require manual cache clears.
- **Service worker cache version** — Bumped from `cksda-v1` to `cksda-v3` to roll out the verse JSON cache-strategy update immediately.
- **`calendar-events.js` module shape** — Removed top-level IIFE wrapper and aligned with the ESM source pattern.
- **`eslint.config.js`** — Migrated config file to ESM and split lint targets by actual module type (ESM vs classic script vs CommonJS test/config files).

### Fixed
- **YouTube iframe API callback in ESM** — `onYouTubeIframeAPIReady` is now attached to `window`, restoring player initialization after the ESM migration.
- **Lychee CI failures from stale local links** — Updated `docs/2026-05-29-ImprovementSuggestions.md` to remove markdown links pointing to deleted `assets/js/browser.min.js` and `assets/js/breakpoints.min.js`.

### Removed
- **Stale build artifact** — Deleted `assets/js/page-config.min.js` and removed its pre-cache reference from `sw.js`.

### Added
- **Devotional proxy support** — The client now supports an optional server-side proxy endpoint (build-time configured) that fetches and returns White Estate's Our Higher Calling devotional JSON with proper CORS headers. This allows the site to always display the exact devotional verse without requiring repository commits or PRs.
- **Workflow removal** — The previous `update-verse.yml` automated-commit workflow was removed to comply with repository rules.

---

## v1.3.5 — June 1, 2026

### Added
- **Footer content layout** — rebuilt into tile-style sections (Pastors, Worship Services, Contact & Location) with centered content and cleaner spacing.
- **Footer contact actions** — simplified to text-first links: address lines open Google Maps and phone uses `tel:`.
- **Home page footer content** — Worship Services section is conditionally hidden on the home page.
- **Calendar CTA** — removed the separate ICS download action and kept a single prominent "Open in Google Calendar" button.
- **Light theme transitions** — restored top and bottom triangular separators in light mode and aligned manual `theme-light` overrides with system-light styling.
- **Light header background** — increased gradient contrast so the header transition reads more clearly in light mode.
- **AdventistGiving header links** — changed `rel` from `noopener noreferrer` to `noopener` so AdventistGiving can receive referral traffic while still keeping `target="_blank"` protection.
- **Build parity** — updated both `assets/js/main.js` and `assets/js/main.min.js` for the same AdventistGiving link behavior in production.

### Fixed
- **Calendar** — private and confidential Google Calendar events are now filtered out before rendering, preventing them from appearing as "Untitled Event".
- **Theme mismatch** — fixed a light-mode inconsistency where the header was using light transition assets while the footer could still resolve to dark transition assets under manual theme toggles.
- **Calendar button contrast** — improved dark-mode readability for the "Open in Google Calendar" CTA.
- **Newsletter Lesson Section** — corrected the Korean lesson label from "EM / Young Adults" to "KM / Gaon" to match the linked Korean lesson.
- **`verse-today.json`** — manually restored to the correct June 1 verse after a force push wiped two workflow-authored commits.
- **`update-verse.yml`** — replaced hardcoded `UTC-5` offset with `ZoneInfo('America/New_York')` so the daily verse date is DST-aware (correct in both EST and EDT); replaced dual midnight EST/EDT cron entries with a single hourly schedule (`17 * * * *`) to avoid GitHub schedule jitter.
- **PWA icon** — corrected `manifest.json` icon order so the dark icon is the default and the light icon is served when `prefers-color-scheme: light` is active (was reversed).
- **Footer copyright links** — applied `display: flex; flex-wrap: wrap` to the copyright `<ul>` so links no longer crowd or wrap awkwardly on iPhone widths.

### Removed
- **Inner-page breadcrumbs** — removed auto-injected "Home / Page" breadcrumb navigation so only the top header menu is used.

---

## v1.3.4 — May 30, 2026

### Changed
- Deploy workflow now strips `docs/`, `scripts/`, `tests/`, `test-results/`, `playwright-report/`, `node_modules/`, and dev config files before uploading the Pages artifact, preventing operational/internal files from being publicly served.

---

## v1.3.3 — May 30, 2026

### Fixed
- **`main.js`** — Ministry pages no longer show the church mission subtitle; empty-string subtitles now correctly suppress the fallback to `_subtitle` (changed `||` to `??`).

---

## v1.3.2 — May 31, 2026

### Added
- **Month grid view** — a full 7-column calendar grid with prev/next month navigation, today highlight, and event pills per day cell; toggled from a new "List / Month" segmented control above the events.
- **Event popup** — clicking any event pill in the month grid opens a centered modal with full event details (date, time, location, description, "Add to Google Calendar" link); dismissed via close button, backdrop click, or Escape key.
- **Mobile dots** — on ≤480 px screens, event pills in the month grid collapse to small colored dots (still tappable for the popup) to keep the grid usable.
- **"+N more" overflow** — days with more than 3 events show a "+N more" button that switches to the list view.

### Changed
- **`calendar-events.js`** — rewritten with module state (`currentView`, `viewYear`, `viewMonth`), `renderListContent()`, `renderMonthContent()`, `refresh()`, `showEventPopup()`, and a `renderViewToggle()` helper; `timeMin` now starts from the beginning of the current month so the grid is fully populated; `MAX_EVENTS` increased to 60.
- **CSS** — added view toggle, month grid, popup, and mobile dot styles to `main.css`, `lightmode.css`, and `darkmode.css`.
- **`newsletter.js`** — `updateLessonLinks` now auto-computes the week number and day-within-lesson-week for all Sabbath School lesson tile links; only the HTML fallback values need updating when the quarterly lesson set changes.

---

## v1.3.1 — May 30, 2026

### Added
- **Events summary bar** — a "X upcoming events across N months" line appears above the event cards once loaded, powered by the existing Google Calendar API response.
- **"Open in Google Calendar" CTA button** — a teal pill button with a calendar icon now replaces the plain text link at the bottom of the calendar page; styled for both light and dark mode.

### Changed
- **`calendar.html`** — removed the `RSVP.major` / `calFSMsg` section; replaced with static `events-gcal-cta` button and new `events-summary` container.
- **`page-config.js`** — removed `calFSMsg` from the calendar page `init` (no longer needed).
- **CSS** — added `.events-summary`, `.events-gcal-cta`, `.events-gcal-btn` to `main.css`, `lightmode.css`, and `darkmode.css`.

---

## v1.3.0 — May 30, 2026

### Added
- **Calendar events page rework** — `calendar.html` now fetches upcoming events from the Google Calendar API and renders them as styled date-badge cards grouped by month, replacing the plain Google Calendar iframe.
- **`assets/js/calendar-events.js`** — new script that calls the Google Calendar API v3, groups events by month, and renders accessible event cards with date badge, time, optional location, description excerpt, and "Add to Google Calendar" link.
- **Event card CSS** — `.event-card`, `.events-month-group`, `.events-month-heading`, and related classes added to `assets/css/main.css` with responsive mobile stacking at ≤480 px.
- **Light/dark mode event card colors** — teal badge (`#3e8391` / `#2a6d79`) and card backgrounds added to `lightmode.css` and `darkmode.css`.
- **`CALENDAR_API_KEY` build injection** — `scripts/build.js` now injects the `CALENDAR_API_KEY` environment variable into `calendar-events.min.js` via esbuild `define`, matching the existing YouTube key pattern.

### Changed
- **`calendar.html` CSP** — removed `frame-src https://calendar.google.com` and `object-src https://calendar.google.com` directives, which are no longer needed without the embedded iframe.
- **`scripts/build.js`** — added `CALENDAR_API_KEY` env var handling and `calendar-events.js` esbuild task.
- **`assets/js/main.js`** — fixed a pre-existing premature template literal closing backtick in `buildFooter()` that was preventing successful builds.



### Added
- **CSS gradient header** — `header.jpg` replaced with a pure-CSS layered background: two off-screen radial sun glows sweeping in from the top corners, a dark bottom vignette, and a teal-to-navy `linear-gradient`; responsive across three breakpoints (3200 px / 1280 px / 736 px).
- **PWA support** — `manifest.json` with church name, short name, and adaptive theme colours (`#3e8391` light / `#042D2D` dark).
- **Adaptive PWA icons** — four icons (light + dark × 192 + 512 px) generated from `logo-light.png` by `scripts/build.js` using `sharp`, with solid brand-colour backgrounds.
- **Service worker** — `sw.js` at repo root: cache-first for static assets, network-first for navigation, `offline.html` fallback when offline.
- **Offline page** — `offline.html`: self-contained branded fallback, no external dependencies.
- **Service times section** — `index.html` now shows a prominent Korean and English Sabbath School and Worship Service times block, rendered from existing i18n keys with locale-aware `Intl.DateTimeFormat` formatting and a link to the calendar page.
- **`.service-times` CSS** — responsive two-column card grid added to `assets/css/main.css`.
- **Daily Devotional card** — `newsletter.html` verse-of-day section redesigned as a pull-quote card with a pill CTA ("Our High Calling →") linking to the day's devotional; responsive layout (pill left / reference right on ≥600 px, stacked on mobile).
- **Duty row highlight (dark mode)** — active dishwashing duty row now uses a coral/terracotta (`rgba(255,110,60,0.55)`) complement of the site teal for accessible contrast on dark backgrounds.
- **Link checker in CI** — `lycheeverse/lychee-action@v2` added to the `verify` job in `.github/workflows/deploy.yml`.
- **`docs/IMPROVEMENTS.md`** — improvement checklist archived from repo root.

### Changed
- **All 10 HTML pages** — added `<link rel="manifest" href="/manifest.json" />`, replaced single `theme-color` meta with adaptive light/dark pair, added `worker-src 'self'` to CSP.
- **`assets/js/main.js`** — added service worker registration block; logo `<img>` now has descriptive `alt` text; social icon links include `aria-label` with "(opens in new tab)" and `aria-hidden` span labels.
- **`assets/js/page-config.js`** — added service times HTML to `index` page config `init()`.
- **`scripts/build.js`** — added `generateIcon()` helper for adaptive PWA icon generation.
- **`eslint.config.js`** — added `sw.js` to linted files; added `__YOUTUBE_API_KEY__: 'readonly'` global.
- **CI Node version** — bumped from 20 to 24; added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` on both `verify` and `deploy` jobs.
- **`calendar.html`** — `<embed>` element now has a descriptive `title` attribute for screen readers.
- **`lightmode.css` / `darkmode.css`** — added `#header p` colour overrides to fix hero subtitle being rendered in low-contrast grey (inherited from generic `header p` rule).
- **`main.css`** — `#header p` top margin increased from `0.25em` to `0.75em` for breathing room between the site title and subtitle; footer `#footer .copyright li` set to `display: inline` at ≤480 px to keep all three items on one line.
- **`docs/IMPROVEMENTS.md`** — all relative links prefixed with `../`; archive date and creation date added to header.

### Fixed
- **CSP `frame-src`** — added `youtube.com` and `youtube-nocookie.com` to `index.html` and `newsletter.html` after YouTube iframe embeds were blocked.
- **CSP `connect-src`** — added `google.com` (GA4 fallback beacon endpoint) to all pages; added `googleapis.com` to `newsletter.html` (required for YouTube Data API calls in `youtube.js` to resolve sermon speaker and scheduled video).
- **Hero subtitle colour** — `header p { color: #888888 }` was overriding the white hero subtitle in both light and dark modes.
- **Newsletter divit/notch** — removed `border-top` from `.verse-of-day` that was showing a teal notch where the card met the page edge.
- **Footer copyright wrapping** — "Privacy Policy" no longer wraps to a new line on small screens.
- **Small-screen newsletter cards** — announcement, service-info, rides, church-notice, and lessons sections go edge-to-edge (no side margins/borders) at ≤400 px.
- **Duty schedule gap** — reduced `.duty-schedule` top margin from `8px` to `2px` to close the gap above the dishwashing table.
- **Skip link class** — unified to `.skip-to-content` across all pages and CSS.
- **Lychee `--exclude-mail` removed** — flag was dropped in lychee v0.23; removed from CI args.
- **Lychee scanning `node_modules`** — narrowed glob from `./**/*.html` to `./*.html ./sitemap.xml ./*.md docs/*.md`.
- **Lychee root-relative links** — added `--root-dir ${{ github.workspace }}` so `/manifest.json` and `/images/...` links resolve correctly.
- **Localhost link in README** — changed `<http://localhost:8000>` to a code span to prevent lychee from attempting to fetch it; added `--exclude 'localhost'` to lychee args.
- **Dead links in IMPROVEMENTS.md** — removed links to deleted `connection.html` and `assets/js/util.js`.

---

## v1.2.10 — May 30, 2026

### Added
- **`scripts/build.js`** — esbuild-based CSS/JS minification pipeline; `npm run build` script added to `package.json`.
- **Local dev server** — `npm start` via `http-server` added to `package.json`; README updated with `npm install` / `npm start` workflow.
- **`.github/workflows/deploy.yml`** — GitHub Actions CI/CD pipeline: lint → link-check → build → deploy to GitHub Pages.

### Changed
- **API key injection hardened** — replaced fragile Python regex patching with esbuild `define`; `__YOUTUBE_API_KEY__` is substituted at minification time in `scripts/build.js`.
- **`eslint.config.js`** — updated to support the build pipeline.
- **`README.md`** — expanded with full setup and development workflow documentation.

### Removed
- **Python regex deploy patch** — replaced entirely by esbuild `define`.

---

## v1.2.9 — May 30, 2026

### Added
- **`.editorconfig`** and **`.prettierrc.json`** — consistent formatting rules across editors.
- **`.prettierignore`** — prettier exclusion list.
- **`.stylelintrc.json`** — CSS linting rules; `npm run lint` script.
- **`eslint.config.js`** — JavaScript linting configuration.
- **`assets/js/page-config.js`** — centralised per-page configuration module.
- **`assets/js/analytics.js`** — shared analytics logic extracted from `main.js`.

### Changed
- **`assets/js/main.js`** — wired up the new `page-config.js` module; `PAGE_CONFIG` now delegates to `window.buildPageConfig` when available.
- **`assets/js/youtube.js`** — refactored for clarity and maintainability.
- **`.gitignore`** — expanded with IDE patterns (`.idea/`), lint caches (`.eslintcache`, `.stylelintcache`), OS noise (`.DS_Store`, `Thumbs.db`), and temp file extensions.
- **`docs/MOBILE_TESTING.md`** — manual mobile testing checklist moved from repo root to `docs/`.
- **`assets/css/main.css`** — additional CSS normalisation rules.
- **`.github/workflows/deploy.yml`** — API key injection fixed to also patch `youtube.min.js`; HTML pages load the minified file so the key was previously never being injected into the deployed build.
- **`package.json`** — added lint and test scripts.

---

## v1.2.8 — May 30, 2026

### Changed
- **`assets/langStrings/en.json`, `es.json`, `ko.json`** — removed all embedded HTML markup; aligned key names across all three files; split `footer.mailingAddress` into `mailingAddressLine1`/`Line2`; replaced `&copy;` HTML entity with literal `©`; added separate `*URL` keys for all link values; added missing page sections.
- **`assets/js/main.js`** — improved language loading; `document.documentElement.lang` set dynamically; added `formatTimeRange()` using `Intl.DateTimeFormat`.
- **`assets/langStrings/es.json`** — Spanish translations expanded and corrected.

---

## v1.2.7 — May 30, 2026

### Added
- **Playwright mobile test suite** — `tests/mobile.spec.js` and `playwright.config.js`; covers all main pages across three device viewports.
- **`MOBILE_TESTING.md`** — manual mobile testing checklist.
- **`.github/instructions/mobile-tests.instructions.md`** — agent instruction to run relevant Playwright tests after editing HTML or CSS/JS assets.

### Changed
- **`assets/css/main.css`** — responsive layout rules added for all page sections.
- **`calendar.html`** — iframe is now fully responsive via `.calendar-wrapper` with `aspect-ratio: 4/3` and `min-height: 400px`.
- **`epoch.html`** — inline iframe styles moved to CSS.
- **`music.html`** — inline iframe styles moved to CSS.
- **`package.json`** — added Playwright as dev dependency.

---

## v1.2.6 — May 30, 2026

### Added
- **`package.json`** — initial `package.json` with `build` script and `esbuild`/`sharp` as dev dependencies.
- **`.gitignore`** — excludes `node_modules/`, `package-lock.json`, `.vscode/`, and Playwright output.
- **Minified CSS/JS** — `*.min.css` / `*.min.js` output files generated alongside readable sources.
- **WebP images** — WebP versions of Pioneers logos generated via `sharp`; added to `images/pathfinders/`.
- **`.github/instructions/css-js-build.instructions.md`** — agent instruction to run `npm run build` after editing any CSS or JS source file.

### Changed
- **`assets/js/main.js`** — removed jQuery dependency; replaced all `$()` calls with vanilla JS.
- **All pages** — added `defer` to all non-critical `<script>` tags; updated all `<link>` and `<script>` references to point to `.min.css` / `.min.js` files.
- **`assets/css/main.css`** — replaced `@import` Google Fonts with `<link rel="preconnect">` + `<link rel="stylesheet">` in HTML; self-hosted fallback stack added.
- **`assets/langStrings/*.json`** — Pathfinders `getReadyTitle` year updated from 2022–2023 to 2026–2027.

### Removed
- **`jquery.min.js`** (87 KB) and **`assets/js/util.js`** — removed from all pages and deleted.
- **`assets/js/calendar.js`** (100% comments) — deleted.
- **Unused images** — `header.jpg`, `logo-dark.png`, `pic01.jpg`, `pic02.jpg`, `pic03.jpg` deleted.

---

## v1.2.5 — May 30, 2026

### Added
- **`sitemap.xml`** — lists 9 canonical content pages with `<priority>` and `<changefreq>`; epoch, zeitgeist, redirect pages, and privacy policy deliberately excluded.
- **Canonical URL tags** — `<link rel="canonical">` added to all 9 main content pages (`index`, `calendar`, `children`, `epoch`, `music`, `pathfinders`, `personal-ministries`, `young-adults`, `newsletter`; `privacy.html` already had one).
- **JSON-LD structured data** — `Church` schema on `index.html` with address, phone, opening hours, and social `sameAs` links; `WebPage` schema on all other content pages.
- **`robots.txt` Disallow rules** — `epoch.html`, `zeitgeist.html`, and `connection.html` explicitly blocked from all crawlers.
- **Privacy comments** — `robots.txt`, `epoch.html`, and `zeitgeist.html` each have a comment explaining that these pages are blocked because they contain videos featuring minors; notes say not to remove the restrictions without church leadership approval.

### Changed
- **Page `<title>` format standardized** — all HTML `<title>` elements and `en.json` `browserTitle` values updated to `Page Topic | Collegedale Korean SDA Church` format (previously mixed `CKSDA Church: Topic` and other variants).
- **`epoch.html`** — `noindex, nofollow` robots meta added (previously only `zeitgeist.html` had it); canonical tag removed as unnecessary on a non-indexed page.
- **Connection card fully removed** — `connectionCard`, `connectionCardURL`, and `connectionPage` keys deleted from `en.json`, `es.json`, and `ko.json`; `connection` entry removed from `PAGE_CONFIG` in `main.js`; `connectionLink` removed from the nav builder; `connection.html` deleted.
- **`zeitgeist.html`** — added `noindex, nofollow` with explanatory privacy note.
- **`IMPROVEMENTS.md`** — Section 5 all items marked complete; Section 12 reconciled to reflect work completed across Sections 1–5.

### Fixed
- **Nav link hover invisibility** — `#header a:hover` in `lightmode.css` was `#3E8391` (teal-on-teal, invisible); same issue in `darkmode.css` (`#48727A`); `#ministries:hover` in `menu.css` also affected. All three changed to `#ffffff` so hovered links are visible.

### Removed
- **`connection.html`** — deleted; internal links updated.

---

## v1.2.4 — May 30, 2026

### Changed
- **All pages** — converted `<div>` containers to semantic `<section>`/`<main>`/`<article>`; added visible skip link and focus indicators; standardised `<title>` format; added `<link rel="canonical">`.
- **`pathfinders.html`** — fixed empty alt text on logos; added registration CTA; substantial layout accessibility improvements.
- **`assets/css/newsletter.css`** — substantial accessibility improvements for newsletter card layout.
- **`assets/css/lightmode.css` / `darkmode.css`** — colour contrast adjustments.
- **`assets/css/main.css`** — focus ring styles and contrast improvements.
- **`epoch.html` iframes** — added `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"` to both SharePoint video embeds.
- **`assets/js/newsletter.js`** — devotional link block no longer overwrites `textContent`; only updates `href` to preserve the static pill label.
- **`assets/langStrings/*.json`** — `advWebsiteTitle` shortened to `"Adventist.org"` in `en.json`, `es.json`, and `ko.json` to prevent footer copyright wrapping.

---

## v1.2.3 — May 29, 2026

### Added
- **Content Security Policy** — `<meta http-equiv="Content-Security-Policy">` added to all 9 main-template pages and `newsletter.html`; sources scoped to `self`, `googletagmanager.com`, `clarity.ms`, `google-analytics.com`, `googleapis.com`, `sharepoint.com`, `calendar.google.com`, and `youtube.com`.
- **GA4 + Clarity on newsletter** — added Consent Mode v2 default-deny block, GA4 `gtag.js` script, and `consent.js` to `newsletter.html` (previously missing analytics coverage).

### Changed
- **`assets/js/main.js`** — anchor tags for tithe paragraph, collegiate links, events, and calendar fullscreen link are now constructed in JS from clean URL keys rather than reading raw HTML from translation strings.
- **`assets/langStrings/*.json`** — added separate `*URL` keys for all link values; HTML markup removed from string values.
- **`calendar.html`** — `calFSMsg` container changed from `<a>` to `<span>` to prevent nested anchor (JS was setting `innerHTML` of an `<a>` to another `<a>`).

---

## v1.2.2 — May 29, 2026

### Changed
- **`index.html`** — homepage substantially reworked: hero copy, tithe section, and collegiate links updated.
- **Ministry pages** (`young-adults.html`, `personal-ministries.html`, `children.html`) — expanded with descriptions, schedules, and leader contacts.
- **`young-adults.html`** — age range corrected to 25–35; description updated to reflect post-collegiate focus rather than college students.
- **`children.html`** — age range updated to "newborns to high schoolers"; added sentence noting the pipeline to Collegiate Ministry upon graduation.
- **`college.html`** / **`collegiate.html`** / **`directory.html`** — added `noindex, nofollow`; replaced silent meta-refresh with visible loading state (3-second delay, branded loading message, manual fallback link, viewport meta, `<body>` element).
- **`epoch.html`** — removed 2024, 2023, and 2021 sections that contained only "Video information is currently unavailable" placeholders; page now shows only years with real video content (2022 and 2020).
- **`music.html`** — Instagram social link label corrected from "Instagram (Collegiate)" to "Instagram (Music)"; renamed mislabeled `id="personalMinistries*"` attributes.

---

## v1.2.1 — May 29, 2026

### Added
- **Privacy policy page** (`privacy.html`) and footer link on all pages.
- **Cookie consent banner** (`assets/js/consent.js`) with Google Consent Mode v2.

### Changed
- **All pages** — GA4 and Microsoft Clarity analytics standardised; `consent.js` integrated via `main.js`.

---

## v1.2.0 — May 29, 2026

### Added
- **`IMPROVEMENTS.md`** — comprehensive 136-item improvement checklist covering 12 sections of the website, created with Claude Opus 4.7.

---

## v1.1.5 — May 29, 2026

### Changed
- Content and contact information updated across ministry and events pages for the 2026–27 church year.

---

## v1.1.4 — April 13, 2026

### Changed
- Content and contact information updated across ministry and events pages for the 2025–26 church year.

---

## v1.1.3 — May 01, 2025

### Changed
- Work-in-progress content updates for the 2024–25 church year.

---

## v1.1.2 — January 08, 2024

### Changed
- **Font Awesome** — upgraded to v6.5.1.

---

## v1.1.1 — June 12, 2023

### Added
- **Microsoft Clarity** — analytics and session-recording script added to all pages.

---

## v1.1.0 — May 03, 2023

### Added
- **Multi-language support** — basic internationalisation added; English, Spanish, and Korean language strings introduced.

---

## v1.0.14 — December 30, 2022

### Added
- **Epoch page** (`epoch.html`) — new page for archived church video content.

---

## v1.0.13 — December 17, 2022

### Added
- **Music Ministry page** (`music.html`) — new page for the church music ministry.

---

## v1.0.12 — October 07, 2022

### Added
- **Connection Card link** — link to the digital connection card added to the site.

---

## v1.0.11 — September 20, 2022

### Changed
- **Phone number** — updated to current church phone number.

---

## v1.0.10 — September 11, 2022

### Changed
- **College links** — updated collegiate ministry links.

---

## v1.0.9 — August 28, 2022

### Added
- **AdventistGiving** — link to the AdventistGiving online tithe portal added.

---

## v1.0.8 — June 21, 2022

### Changed
- Corrected "Pathfinder" references to "Pathfinders" (plural) site-wide.

---

## v1.0.7 — June 17, 2022

### Added
- **Pathfinders section** — initial Pathfinders ministry section added to the site.

---

## v1.0.6 — March 20, 2022

### Changed
- Repository index rebuilt.

---

## v1.0.5 — March 20, 2022

### Added
- **Bulletin links** — links to church bulletins added.

---

## v1.0.4 — January 02, 2022

### Added
- Additional ministry and information pages added to the site.

---

## v1.0.3 — January 01, 2022

### Changed
- **Pastor** — updated pastor information.

---

## v1.0.2 — September 24, 2021

### Added
- **CNAME** — custom domain configured for GitHub Pages.

---

## v1.0.1 — September 24, 2021

### Changed
- **Assistant Pastor** — updated assistant pastor information.

---

## v1.0.0 — September 24, 2021

Initial commit. Core site structure with homepage, navigation, and basic ministry pages.
