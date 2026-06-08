# Website Improvements — Round 3

> **Created:** All items created by Claude Opus 4.8 on **June 7, 2026**.  
> **Archived:** All items completed and this document moved to its final resting place on **TBD**.

A focused, small-church-sized batch building on [2026-05-29-ImprovementSuggestions.md](2026-05-29-ImprovementSuggestions.md) and [2026-05-30-ImprovementSuggestions.md](2026-05-30-ImprovementSuggestions.md). Everything below is intentionally **lightweight, static-friendly, and free** — no heavy frameworks, no new paid services, nothing that needs a server.

> **Guiding idea:** The site already produces genuinely *daily* value (auto-updating devotional, sunset times, current-day Sabbath School lesson links). Today that value is buried inside a *weekly* newsletter that most people only open on Friday from the automated email. With members now installing the PWA to their devices, the goal of this round is to **surface daily content first** and **separate "use every day" content from "read once a week" content** — so opening the app feels like a useful daily companion, not a Friday flyer.

> **Scope guardrails (carried from Round 2):** No Cloudflare-dependent items. Newsletter automation stays reliable; we are *re-organizing* what it shows, not adding signup/share/archive features. Keep prayer requests pointed at the existing text hotline. Service times already live in the footer.

---

## Cost Assessment

**100% of all items below are free.** They are pure HTML/CSS/JS/manifest/service-worker/build changes plus existing GitHub Actions. No new dependencies or paid tiers are required. Anything that *could* grow into a paid or server-backed feature (e.g. push notifications) is explicitly marked **"evaluate only"** and is not recommended for adoption in this round.

---

## 1. A Daily "Today" Experience (highest impact)

This is the heart of this round. The pieces already exist — they just need to be promoted out of the weekly newsletter and onto the surfaces people actually open.

- [x] **Extract the devotional to a JSON file (single source of truth)** — [scripts/fetch-daily-data.js](../scripts/fetch-daily-data.js) now writes `assets/data/devotional-today.json` (verse, reference, devotional URL, date, fridaySunset, saturdaySunset, sabbathStartUtc, sabbathEndUtc). Both [today.html](../today.html) and other surfaces read from it; the sunset UTC timestamps enable exact Sabbath-hours detection.
- [x] **Dedicated `/today.html` daily dashboard** — Standalone page with newsletter-style design (teal header, warm-linen devotional card, lesson tile grid, no site nav shell) combining devotional, Friday/Saturday sunset times, and all eight Sabbath School lesson tiles (EM, KM, Collegiate, High School, Earliteen, Juniors, Primary, Cradle Roll). Powered by [assets/js/daily.js](../assets/js/daily.js) reading from the JSON. Has its own [assets/css/today.css](../assets/css/today.css) scoped tightly by the purger.
- [x] **Surface the daily devotional + lesson links** — Via the persistent top banner (below) rather than cluttering the homepage.
- [x] **Sunset / Sabbath times mini-widget** — Replaced by a live countdown chip in the [today.html](../today.html) header (combining this item with V2 §3 "Sabbath countdown only"). The chip counts down to the next Sabbath using server-computed `sabbathStartUtc`/`sabbathEndUtc` from `devotional-today.json`; shows "Happy Sabbath • ends in …" during active Sabbath hours; "Good Sabbath! See you next week ♥" after Saturday sunset. Friday/Saturday sunset times remain stored in the JSON for potential future use.
- [x] **Persistent "Today" top banner** — Fixed strip across all main-shell pages showing today's date with a direct link to [today.html](../today.html). During Sabbath hours it says "Happy Sabbath"; when a live YouTube stream is detected it swaps the CTA to "Watch livestream →".
- [x] **Calendar events on Today page** — If there are calendar events scheduled for today, show them on [today.html](../today.html) below the devotional so members opening the app always know what's happening at church today.

---

## 2. Restructure the Newsletter: Daily vs. Weekly

The newsletter currently interleaves content with very different lifespans. Splitting it makes both halves clearer and lets the daily half be reused elsewhere.

- [ ] **Group "Every day" content at the top** — Daily devotional, verse of the day, sunset times, and the current Sabbath School lessons. This block is identical to what the homepage/`today.html` shows (shared JSON from §1).
- [ ] **Group "This week" content below** — This week's sermon/speaker, dishwashing rotation, free rides, and giving. These are genuinely weekly and belong together.
- [ ] **Add light in-page anchors / a tiny table of contents** — e.g. `#devotional`, `#lessons`, `#this-week` so the homepage and PWA shortcuts can deep-link straight to a section.
- [ ] **Date-stamp the "This week" block clearly** — Reinforce that the operational items (rotation, sermon) are for the current Sabbath, while the daily block is always current. Reduces confusion when someone opens it mid-week.

---

## 3. PWA Depth — Make the Installed App Feel Native

The PWA basics are in place ([manifest.json](../manifest.json), [sw.js](../sw.js)), but several near-zero-effort touches make the installed experience markedly better.

- [ ] **Add app `shortcuts` to [manifest.json](../manifest.json)** — Long-pressing the installed icon should offer quick jumps: **Today/Devotional**, **Sabbath School Lessons**, **Newsletter**, **Calendar**, **Give**. This is a few lines of JSON and directly serves the "I don't want to hunt for it" need.
- [ ] **Cache today's devotional + lesson links for offline use** — Precache (or stale-while-revalidate) `devotional-today.json` in [sw.js](../sw.js) so the installed app still shows the morning's devotional on a spotty connection (e.g. driving to church).
- [ ] **Decide the PWA `start_url` deliberately** — Once §1 lands, point `start_url` at the daily experience (enriched homepage or `/today.html`) and add a `?source=pwa` query so analytics can distinguish installed-app opens. (Ties into the Round 2 "is_pwa_installed" analytics item.)
- [ ] **Custom "Add to Home Screen" prompt** — Capture `beforeinstallprompt` and show a small, dismissible "Install the church app" banner at a sensible moment (e.g. second visit), instead of relying on the browser's hidden menu. Respect a `localStorage` dismissal so it never nags.
- [ ] **Per-platform splash/theme polish** — Verify the maskable icons and `theme_color` render well as a real home-screen icon and splash on both iOS and Android; tweak background/padding if the logo crops.
- [ ] **Push notifications — evaluate only (not recommended this round)** — A "new devotional / Sabbath reminder" push would need a push service to *send* messages, which a static GitHub Pages site can't do alone. Document the tradeoffs but defer; periodic background sync (below) is the lighter alternative.
- [ ] **Periodic Background Sync to refresh the devotional — evaluate only** — Limited browser support and Chrome-only, but free and could keep the cached devotional fresh for installed users. Worth a spike, not a commitment.

---

## 4. Lightweight, Editable Content (no rebuild gymnastics)

Small churches change announcements often; touching raw HTML for each one is friction. These keep edits to a single small data file.

- [ ] **JSON-driven announcements feed** — An `assets/data/announcements.json` (title, body, optional date/expiry, optional link) rendered into a homepage/newsletter "Announcements" block. Editing one JSON file — not page markup — updates the site, and expired items auto-hide by date.
- [ ] **"This week's order of service" / bulletin block** — Many members look for the order of service. A simple JSON or small section (hymn numbers, scripture reading, speaker, special music) gives a digital bulletin without a separate print process.
- [ ] **Hymn / "song of the week"** — Optional small card linking to the hymn (e.g. SDA Hymnal number + a lyrics/audio link). Cheap, recurring, devotional value.
- [ ] **Memory verse of the week (kids)** — A tiny card aimed at children/families, reusing the verse-rendering you already have.

---

## 5. On-Site Quality-of-Life

Genuinely new small wins not covered in Rounds 1–2.

- [ ] **QR codes for giving and the newsletter** — Pre-generate static QR PNGs (one-time, via the existing `sharp`/build step or even by hand) for AdventistGiving and the newsletter URL, so they can be shown on the projector or printed. Zero runtime cost.
- [ ] **"Add to calendar" on individual events** — You already publish [cksda.ics](../cksda.ics). Offer per-event "Add to calendar" links (Google + downloadable `.ics`) on the calendar page for one-off events, not just the full subscribe feed.
- [ ] **Copy-to-clipboard for the rides / prayer hotline number** — A tiny "tap to copy" affordance next to the SMS number reduces friction on mobile.
- [ ] **Last-updated stamp on dynamic content** — A subtle "Devotional updated 12:01 AM" / "Lessons for week of …" line builds trust that the daily content is live, not stale.

---

## 6. Reliability of the Daily Content Pipeline

Because we're now leaning on the daily devotional as *primary* content, its automation deserves the same guardrails the verse cron got in Round 2.

- [ ] **Assert the fetched devotional is well-formed** — In [scripts/fetch-daily-data.js](../scripts/fetch-daily-data.js), fail loudly (or keep the prior good value) if the White Estate HTML shape changes and parsing yields empty/garbage, rather than silently shipping a blank devotional.
- [ ] **Keep a "last known good" fallback** — If today's fetch fails, retain yesterday's committed devotional with a gentle "(showing the most recent devotional)" note instead of fallback placeholder text.
- [ ] **Lightweight smoke check after the daily build** — A tiny assertion in the workflow that `devotional-today.json` exists, has a verse + reference, and is dated today; alert (email/Discord webhook from the Action) if not.

---

## 7. Documentation (only what helps maintainers)

- [ ] **Document the daily-content data flow** — A short note in `docs/` showing: White Estate → `fetch-daily-data.js` → `devotional-today.json` + `calendar-today.json` → homepage + newsletter + service-worker cache. Helps whoever maintains this after the current setup.
- [ ] **Note the newsletter daily/weekly split convention** — So future edits keep daily content in the shared block and weekly operational content separate.

<!-- End of round-3 improvements checklist -->
