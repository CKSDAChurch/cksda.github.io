# Mobile Testing Checklist

Manual checklist for verifying the most-visited pages across common phone viewports.
Recommended viewports: **375 × 812** (iPhone SE/12), **390 × 844** (iPhone 14), **412 × 915** (Pixel 7).

---

## Shared (all pages)

- [ ] Header logo and site title are readable
- [ ] Nav links (`Home`, `Calendar`, `Ministries`, `Give Online`) are visible and tappable (≥44 px hit area)
- [ ] "Ministries" dropdown opens on tap and all links are tappable
- [ ] Skip-to-content link appears when focused (keyboard / VoiceOver)
- [ ] Footer worship service times, address, and social icons render correctly
- [ ] Social icon touch targets are ≥44 × 44 px
- [ ] Copyright links are readable and reachable
- [ ] No horizontal scroll at any width ≥ 320 px
- [ ] Cookie consent banner is readable and dismissable
- [ ] Dark-mode toggle (if present) is tappable

---

## index.html

- [ ] Hero header text does not overflow or get clipped
- [ ] Service times section is clearly visible above or near the fold
- [ ] Feature/section cards stack vertically and are readable
- [ ] "Join us" / CTA buttons are full-width on narrow screens (≤480 px)
- [ ] Language switcher is reachable

---

## calendar.html

- [ ] Google Calendar iframe fills the viewport width with no horizontal scroll
- [ ] Calendar aspect-ratio wrapper maintains 4:3 proportion on all widths
- [ ] "View Calendar Full Screen" link is visible and tappable below the embed
- [ ] Minimum calendar height (400 px) is met so monthly grid is usable

---

## epoch.html

- [ ] 2022 and 2020 SharePoint embeds scale to full viewport width
- [ ] 16:9 aspect ratio is preserved on narrow screens
- [ ] "View on SharePoint" fallback links are visible and tappable
- [ ] No overflow or clipped content inside `.video-wrapper`

---

## music.html

- [ ] YouTube embeds fill width with 16:9 aspect ratio (`.yt-embed`)
- [ ] Section headings (Collegiate Choir, CKSDA Choir, Combined Choir) are readable
- [ ] "View All Music Files" CTA button is full-width on narrow screens
- [ ] Instagram icon link is tappable (≥44 × 44 px)

---

## pathfinders.html

- [ ] Pathfinders logo renders as WebP (or PNG fallback) and is not oversized
- [ ] Registration CTA is visible and tappable
- [ ] Social icon links are ≥44 × 44 px

---

## young-adults.html / children.html / personal-ministries.html

- [ ] Ministry description text is readable (no overflow)
- [ ] Schedule / meeting time info is visible
- [ ] Contact info / email links are tappable

---

## How to test

### Browser DevTools
1. Open the page in Chrome or Firefox
2. Open DevTools → Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select a preset device (iPhone SE, iPhone 14, Pixel 7) or enter custom dimensions
4. Cycle through portrait and landscape orientations
5. Check each item above

### Real device
- Test on at least one iOS (Safari) and one Android (Chrome) device
- Use VoiceOver (iOS) or TalkBack (Android) to verify skip link and focus order
