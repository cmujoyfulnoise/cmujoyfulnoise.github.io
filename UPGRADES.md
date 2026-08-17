# Joyful Noise Site — Upgrade Audit

Review of the MVP as of Aug 2026. Ordered by impact-to-effort.

**Tier 1 is done and shipped, plus the gallery rework (item 6).** The rest of Tier 2 and 3 is the remaining roadmap.

Adding photos later? Drop them in the right folder and run `python3 tools/optimize-photos.py`. That's the whole workflow.

---

## What shipped (Tier 1, completed Aug 2026)

| | Before | After |
|---|---|---|
| Total asset folder | 116 MB | **5.3 MB** |
| Homepage, first load on mobile | ~51 MB | **166 KB** |
| About page, first load | ~63 MB | **503 KB** |
| Members page, first load | ~2.9 MB | **360 KB** |
| Pages with social link previews | 0 of 4 | **4 of 4** |
| Gold text passing WCAG AA | 0 of 6 spots | **6 of 6** |

Specifically:

- **Every photo resized and re-encoded** to roughly 2x its largest display size, progressive JPEG at q82, EXIF rotation baked in and metadata stripped. Filenames are unchanged, so the "drop a numbered .jpg in the folder" workflow in the HTML comments still works exactly as written. Full-resolution originals are preserved in `assets/_originals/`, which is gitignored so it never bloats the repo.
- **`loading="lazy"`, `decoding="async"` and explicit `width`/`height`** on all 60 photos across the four pages. The homepage now downloads 14 requests before first paint instead of the whole gallery.
- **Fonts moved out of the CSS `@import`** into `<link rel="preconnect">` + `<link rel="stylesheet">` in each `<head>`, so the browser starts fetching them immediately instead of waiting to parse styles.css first.
- **Full metadata on all four pages**: description, canonical URL, Open Graph, Twitter card, `theme-color`, plus `MusicGroup` JSON-LD on the homepage. A purpose-built 1200x630 `assets/og-card.jpg` was generated from the group photo.
- **The three bugs fixed**: the `.member-photo-secondary` / `.member-photo-2` class mismatch (mobile tap-to-flip now verified working), the missing favicon links on `members.html`, and the missing `<h1>` on `index.html` (the hero lockup is now the heading, with a visually-hidden descriptor).
- **Contrast**: added `--gold-text` (#8A6B1F, 4.6:1 on cream) for gold text on light backgrounds and `--gold-pale` (#FBF3DF, 7.4:1) for the hero gradients, keeping the original bright `--gold` for borders, dots, badges and underlines. Verified by sampling actual rendered pixels, not by eyeballing.
- **Accessibility**: skip-to-content link, `<main id="main">` landmark on every page, visible `:focus-visible` rings (there were none), `aria-controls` and a toggling `aria-label` on the mobile menu button, and the reveal-on-scroll animation scoped to `.js` so content stays visible if JavaScript fails.
- **`404.html`** (branded, "This note isn't in our range"), `robots.txt`, and `sitemap.xml`.

One regression was caught and fixed during verification: adding `height` attributes to images broke the About page history strip, because the HTML `height` attribute overrides a CSS `aspect-ratio` when no CSS height is set. `.history-item img` and `.polaroid img` now carry `height: auto`. Worth remembering if you add more aspect-ratio'd images later.

All four pages were re-rendered at 1440px and 390px with zero console errors, valid tag nesting, exactly one `<h1>` each, and every local asset reference resolving.

---

## Tier 1 — Done (details kept for reference)

### 1. The site ships ~51 MB of images on the homepage alone

This is the single biggest problem. Nothing else on this list matters as much.

| Page | Image payload | Worst offender |
|---|---|---|
| index.html | **~51 MB** | `gallery/7.jpg` at 16 MB, 6000×4000 |
| about.html | **~63 MB** | `history/25-26.jpg` at 14.5 MB |

The photos are straight-off-the-camera 6000×4000 JPEGs. They are displayed at roughly 400×500 CSS pixels. On CMU wifi the homepage takes several seconds; on a phone on cell data at the club fair it will look broken.

**Fix (three parts):**

- **Resize + convert.** Cap the long edge at 1600 px, export WebP at ~80 quality. A 16 MB photo becomes roughly 150 KB. Total site drops from 117 MB to well under 5 MB. One-time script:
  ```bash
  # requires imagemagick + cwebp
  for f in assets/images/**/*.jpg; do
    magick "$f" -resize 1600x1600\> -quality 82 "${f%.jpg}.webp"
  done
  ```
  Keep a `<picture>` fallback if you want to be safe, though WebP is supported everywhere that matters now.
- **Lazy-load everything below the fold.** Not a single `loading="lazy"` exists in the codebase. Add it to all gallery, history, polaroid, and member images. Leave the group photo eager.
- **Add explicit `width`/`height` to every `<img>`.** Right now the browser cannot reserve space, so the page shifts as photos land. This is the CLS metric and it is currently bad.

### 2. Zero social / SEO metadata

No page has a `<meta name="description">`, no Open Graph tags, no Twitter card. When someone drops `cmujoyfulnoise.org` in a GroupMe, an Instagram bio, or a Discord, the preview is a blank box. For a club whose main funnel is "link in bio," this is a real conversion loss.

Add to each page's `<head>`:
```html
<meta name="description" content="Carnegie Mellon's Christian a cappella group since 1993. Concerts, auditions, and community in Pittsburgh.">
<meta property="og:title" content="Joyful Noise — Christian A Cappella at Carnegie Mellon">
<meta property="og:description" content="...">
<meta property="og:image" content="https://cmujoyfulnoise.org/assets/og-card.jpg">
<meta property="og:url" content="https://cmujoyfulnoise.org/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```
You'll want a purpose-made 1200×630 `og-card.jpg` (group photo with the logo over it).

Also missing: `robots.txt`, `sitemap.xml`, `404.html` (GitHub Pages currently serves its generic one), and JSON-LD `MusicGroup` / `Event` structured data so concerts can surface in Google.

### 3. Bugs

- **`members.html` has no favicon links and no `<link rel="apple-touch-icon">`.** The other three pages do. Copy-paste omission.
- **The mobile photo flip does nothing.** `styles.css:839` targets `.member-card.is-flipped .member-photo-secondary`, but the HTML class is `.member-photo-2`. The class name never matches, so the `setInterval` cycle and tap handler in `script.js:141-151` both fire with no visible effect. Every phone visitor sees only the first photo. One-word fix.
- **`index.html` has no `<h1>`.** The hero is a kicker paragraph, a logo image, and two more paragraphs. Screen readers and Google both see a homepage with no heading. Wrap the logo in an `<h1>` with the alt text carrying "Joyful Noise."

### 4. Gold text fails contrast

`--gold: #C9A661` on white is **2.3:1**; on cream it's **2.1:1**. WCAG AA needs 4.5:1 for body text. This affects `.eyebrow` (used on every page) and `.member-verse`.

Keep the gold for borders, dots, underlines, and the badge (large/bold text and non-text UI have looser requirements), but darken the text token:
```css
--gold-text: #8A6B1F;  /* ~5.2:1 on cream, still reads as gold */
```

---

## Tier 2 — Meaningful UX wins

### 5. The hero layout is held together with hardcoded pixels

```css
.hero-kicker { top: 130px;  left: 16%; }
.hero-sub    { top: 310px;  left: 54%; }
.hero-verse  { top: 340px;  left: 73.5%; }
```

Three absolutely positioned elements with magic-number offsets, plus a second set of magic numbers at the 720px breakpoint. Between roughly 721px and 900px wide (iPad portrait, small laptops, split-screen), the text will not sit where you designed it, because the logo scales with `min(800px, 78vw)` but the offsets don't scale with it.

**Better approach:** make the whole hero lockup one inline-block that scales as a unit. Position the kicker and subtitle relative to the logo's container rather than the viewport, using `%` or `em` offsets tied to the logo width. Or use a single SVG for the whole lockup so it scales perfectly at every size.

### 6. ~~Gallery carousel has no swipe~~ — **done**

The JS transform carousel was replaced with native CSS scroll-snap, so swipe, momentum, trackpad scrolling and keyboard arrows all work natively rather than being emulated. The arrows now just call `scrollBy`, the dots are one-per-photo and follow the scroll position, and the whole strip still scrolls if JavaScript fails.

A **lightbox** was added on top of that. Tapping or clicking any photo opens it full screen with:

- swipe left/right on touch, arrow keys on desktop, Esc or backdrop-click to close
- a proper focus trap, and focus returns to the thumbnail you came from
- the cached thumbnail shown instantly (blurred) while the large file loads, and neighbours preloaded so arrowing through is instant
- controls that move to a bottom bar on phones so they don't cover the photo

Because the gallery photos were compressed to 900px for the strip, a separate 1800px set now lives in `assets/images/gallery/large/` (2.1 MB total) which is **only** downloaded when someone actually opens a photo. The strip itself still costs the same as before.

Verified with 26 automated interaction tests covering arrows, wrap-around, dots, keyboard, focus management, scroll locking and the no-JS fallback.

**`tools/optimize-photos.py`** was added to support this. Run it after dropping new photos in and it resizes them, backs the originals up to the gitignored `assets/_originals/`, and generates the matching lightbox copy. It's idempotent, so re-running it does nothing rather than degrading photos.

### 7. The YouTube iframe loads on every homepage visit

The embed pulls in roughly 500 KB of player JS and sets tracking cookies before anyone clicks play. Swap for a click-to-load facade: show the thumbnail plus your existing `.play-ring` markup (already styled in CSS but unused), and only inject the iframe on click. Saves the weight and the cookie-consent question.

### 8. Events don't know what day it is

Events are hardcoded text with no machine-readable date, so:

- Past events sit at the top of the list looking current until someone edits the file.
- There is no "add to calendar."

Add `<time datetime="2026-09-02T16:00">` to each row plus a `data-date` attribute, then a few lines of JS to sort, and move anything in the past into a collapsed "Past events" section automatically. An "Add to Calendar" link per event (a generated `.ics` blob or a Google Calendar template URL) is maybe 15 lines and genuinely useful for concerts.

### 9. Members page needs filtering

17 cards in a flat grid. Add filter chips for voice part (Soprano / Alto / Tenor / Bari / Bass) and a "Leadership" toggle. You already have the data in the `.voice-pill` classes, so it's a `data-voice` attribute plus a click handler. Sorting leadership first by default would also help visitors who want to know who to email.

### 10. Accessibility gaps

- **No `:focus-visible` styles on `.btn`, `.nav-links a`, `.gallery-arrow`, or `.connect-link`.** Keyboard users cannot see where they are.
- **No skip-to-content link.** Every page starts with the same 4-item nav.
- **`.reveal { opacity: 0 }` with no `<noscript>` fallback.** If JS fails or is blocked, most of the page content is invisible. Guard it: add a `js` class to `<html>` from an inline script and scope the rule to `.js .reveal`.
- **Mobile nav has no focus trap and no `aria-controls`.** Tabbing while the menu is open walks through the page behind it.
- **Mobile menu is `35dvh` tall** with 4 items at `1.3rem` and 16px padding. That's tight; on a short phone in landscape the last link may be cut off. Use `auto` height with a max.
- Gallery alt text is `"Joyful Noise gallery photo 1"`, which tells a screen reader user nothing. Either describe the photo or mark decorative images `alt=""`.

---

## Tier 3 — Structural, for the next LT

### 11. Nav and footer are copy-pasted four times

Changing a nav item means editing four files, and whoever inherits this will miss one (the missing favicon on `members.html` is exactly this failure mode already happening).

GitHub Pages runs Jekyll natively with no build setup. Converting is mostly mechanical:

```
_layouts/default.html      ← nav + footer + head, once
_includes/member-card.html
_data/members.yml          ← 17 members as data, not markup
_data/events.yml
index.html                 ← front matter + content only
```

Then adding a member next fall is four lines of YAML instead of copy-pasting a 17-line HTML block and hoping the class names are right. This is the highest-leverage change for long-term maintenance, and it does not change a single pixel of the design.

If Jekyll feels like too much, the lighter version is: keep plain HTML but move `members` and `events` into a `data.json` file rendered by JS, and inject the nav/footer with a small script.

### 12. Nothing measures whether any of this works

No analytics. You have no idea whether the events page gets visited, whether the audition CTA is clicked, or whether people bounce off the 51 MB homepage. Add something lightweight and privacy-respecting (GoatCounter is free for non-commercial use and is a single script tag; Plausible and Umami are similar). Worth it before auditions so next year's LT knows what actually drove signups.

### 13. Hardcoded years

`© 2026` appears in four footers, "Fall 2026 Season" in two page heroes. Add these to the handoff checklist, or better, kill them with the Jekyll conversion (`{{ site.time | date: '%Y' }}`).

### 14. Small CSS cleanups

- `@media (max-width:480px) { .wrap { padding: 30px 20px } }` overrides the horizontal-only padding of `.wrap` and adds 30px of vertical padding to every wrapper on the site. Almost certainly unintentional. Use `padding-left/right`.
- `.mission { padding: 200px 15px }` at 480px and `.leadership-badge { margin: 120px 0 }` at 720px are magic-number hacks that will break when content changes. The badge one especially, since it's positioning an absolutely positioned element with margin.
- `.members-empty-note { margin-top: -80px }` is fighting the section padding rather than setting it.
- Dead rules: `.video-placeholder`, `.play-ring`, `.img-placeholder-label`, `.nav-logo-word`, `.footer-wave`, `.connect-link svg` (you use `<img>`, not `<svg>`). Harmless but confusing to inherit.

---

## Feature ideas worth considering

These go beyond fixing and into "what would make this site do more work for the group."

- **A dedicated auditions page.** Right now auditions are one row on the events page and the interest form link is commented out. This is your highest-value conversion. A page answering "do I need experience," "what should I prepare," "how long does it take," "what's the time commitment," plus a prominent form link, would meaningfully reduce the friction for a nervous first-year.
- **A "Listen" section.** You have a YouTube channel. Embed a playlist, or list the current semester's repertoire with links. Prospective members want to hear what you sound like, and right now there's exactly one video on the site.
- **"Book us" / performance request form.** You perform at nursing homes and campus events. A one-click way for an organization to invite you is more effective than a mailto.
- **Alumni / history depth.** The year-strip on the About page is charming and is already the most distinctive thing on the site. Making each year clickable, with the roster and setlist for that year, would give a 30-year-old group a real archive and give alumni a reason to visit and donate.
- **Setlist / repertoire archive per concert**, tied to the YouTube timestamps.
- **A subtle audio touch.** The equalizer bars in the hero animate randomly. Driving them from an actual short a cappella clip (opt-in, muted by default, with a clear unmute affordance) would be a memorable flourish for a music group. Do this carefully; autoplaying audio is a fast way to annoy people.

---

## Suggested order of work

1. ~~Compress images, add `loading="lazy"` and dimensions~~ **done**
2. ~~Meta/OG tags, favicon on members page, `404.html`, the `.member-photo-2` bug, the missing `<h1>`~~ **done**
3. ~~Contrast tokens, focus styles, skip link, JS guard for `.reveal`~~ **done**
4. ~~Scroll-snap gallery with swipe + lightbox~~ **done**
5. Rebuild the hero lockup so it scales as one unit  ← next
6. Auditions page + interest form
7. Jekyll conversion before the 27-28 handoff

---

## Before you push

- The OG tags use absolute `https://cmujoyfulnoise.org/` URLs, which is required — they won't preview correctly from a local file. Once live, test with [Facebook's debugger](https://developers.facebook.com/tools/debug/) and paste the link into a GroupMe to confirm.
- Submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) so concerts start getting indexed.
- `assets/_originals/` is gitignored. It stays on whoever's laptop ran the compression, so if you want the group to keep the full-resolution photos long-term, put them in the shared Drive rather than relying on that folder.
