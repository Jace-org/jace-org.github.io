# jace-org.github.io — jhapendrakandel.com.np

Personal site of Jhapendra Kandel. **Public repo**, served by GitHub Pages at the apex
`jhapendrakandel.com.np` (CNAME, `.nojekyll`, so every file here is publicly reachable —
never commit secrets, notes with passwords, or private infra details).

Remote: `https://github.com/Jace-org/jace-org.github.io.git`, branch `main`. A push to `main`
is a deploy (Pages rebuilds in ~1 minute). Verify with `curl -s https://jhapendrakandel.com.np/ | grep wire-list`.

## Rules

- **Static only: HTML, CSS, vanilla JS.** No build step, no npm, no framework. The one
  exception is `blog/build.py` (local generator, see below).
- External scripts only from cdnjs with an exact version (currently GSAP 3.12.5 + ScrollTrigger).
- The page must read fully without JavaScript and under `prefers-reduced-motion`.
  Motion only animates *from* a state GSAP itself sets.
- Bump the `?v=` cache-bust query on `styles.css` / `main.js` in `index.html` when you change them.
- Do not drop content from the homepage without asking — the user explicitly wants every
  piece of the old site's info kept (see "Homepage content inventory").

## Layout

| Path | What |
|---|---|
| `index.html`, `styles.css`, `main.js` | Homepage (v4 "front page" design, 2026-11-11) |
| `mainimg.webp`, `assets/img/`, `assets/shots/` | Hero photo, Wikimedia Commons pictures (`assets/img/credits.json`), project screenshots |
| `blog/` | Blog: markdown in `blog/posts/` → `python3 blog/build.py` → static HTML. Post-page paths are depth-sensitive in `POST_TEMPLATE`. |
| `toolbox/` | "Resources" page (`toolbox.json` driven) |
| `lab/` | Honeypot Lab interactive demo |
| `tools/` | 20 public browser tools (was `/test/`, promoted 2026-11-12); `tools/index.html` lists them. `test/index.html` is only a redirect stub |
| `project/` | Lab concept page |
| `hack-me/` | Hack Me locked-door page |
| `thanks.html` | FormSubmit redirect target |
| `404.html`, `robots.txt`, `sitemap.xml`, `seo/` | SEO |
| `.taste-skill/` | gitignored inspector output |

Subpages: as of 2026-11-13 the blog, `/tools/`, tech/pulse/security, 404/thanks and (via `assets/base.css`) toolbox/lab/project all follow the v4 look; `hack-me/` keeps its terminal-green identity. Shared polish layers: `tools/lab.css` + `tools/polish.js` (tools), `widgets/widgets.css` + `widgets/motion.js` (pulse/security), `tech/tech.css`.

## Homepage (v4) design

- Language: newsroom / The Verge-inspired (from awesome-design-md), own palette.
  Tokens in `:root` of `styles.css`: `--bg #111`, `--yellow #ffd60a` (primary accent),
  `--orange #ff7a1a`, `--red #d81f26`, `--mint #6ff2c8`, `--blue #2457e6`, `--paper #e7e5e0`.
  One typeface: **Archivo** (variable wdth 62–125; display = `font-stretch: 62%; weight 900; uppercase`).
  Monospace only for code in the method terminal.
- Sections in order: wire (live ticker) → nav → masthead → facts → about → work (stream +
  also built) → skills board → method slider → journey → manuscript strip → Hack Me →
  credentials → contact → footer.
- Live data: `main.js` fetches `https://abcnews.com.np/wp-json/wp/v2/posts?per_page=8&_fields=title,link,date_gmt`
  (CORS allows the apex origin). If it fails, the static link stays. Kathmandu clock via `Intl` `Asia/Kathmandu`.
- Motion (`main.js`, GSAP): masthead rise, `[data-rise]` batch entrances, fact tilt + count-up,
  pinned horizontal story stream ≥900px (`.is-h` class added by script; vertical grid otherwise),
  board bars, journey rail scrub, manuscript drift, Hack Me tilt, footer wordmark, magnetic buttons.
- Contact form: FormSubmit `https://formsubmit.co/5cd9e20c92fe46aa65897efcf33b2446`, `_next` → `thanks.html`.

### Homepage content inventory (must stay)

J.K alias · "Available for work" · motto "Build with precision, secure by design, automate with purpose." ·
facts (BIT, 3 certs, 80th/450 Hack Astra, self-hosted Orange Pi) · about text · focus areas (4) ·
currently learning (4) · featured projects (ABC News Nepal, Nepali TTS, Nepali LLM at home, Honeypot Lab,
NetGuard DNS Monitor, ONSS) · also built (Video Reel Generator, Voice to Text, Kandel Holdings,
Restaurant Management System, Notes Sharing Platform, Techkart) · 11 skills with self-rated % ·
method slider (Build/Secure/Automate/Run) · journey chapters 1–6 · Hack Me · education (BIT) ·
certifications (GitHub Foundations, Google Cloud Computing Foundations, Cloudflare Fundamentals, 2025) ·
competitions (Hack Astra 80th/450, Nutanix CTF, Digital Forensics Hackathon) · email
jhapendrakandel.mac@gmail.com · GitHub/LinkedIn/YouTube/Instagram · picture credits.

## Checking a change

```bash
node ~/.claude/skills/taste-skill/scripts/lint.mjs index.html styles.css main.js
node ~/.claude/skills/taste-skill/scripts/inspect.mjs index.html   # screenshots in .taste-skill/inspect/
```
Accepted leftovers: ticker flagged as "eyebrow" (it is the live element), no video (none found in
open collections), size-count/card-rows WARNs, long-pin WARN for the horizontal stream.

## Releases

Tags/releases follow semver: v2.x old navy/gold design (v2.5.0 = last), v3.0.0 dark-room redesign,
v4.0.0 front-page redesign. The previous design can be restored from any release zip.

## UI polish pass (2026-11-13)

Footer: the picture-credits paragraph and the "Static build, hosted on GitHub Pages" tail were removed on purpose
(do not re-add without asking; CC attributions remain in `assets/img/credits.json`). Polish added motion only
(transform/opacity, reduced-motion off-switch, pages read without JS), kept every meta CSP intact (no inline
style/script on CSP pages), and left taste-skill lint at its 9 pre-existing findings. Not yet verified in a real
browser: true 390px layout and clip-path reveals.

## "Ask my portfolio" (`tools/webllm/`, 2026-11-13)

- Knowledge = `tools/webllm/context.md` (edit + push; `## Title` entries with optional `id:`/`url:`/`keywords:` lines) merged over
  `tools/webllm/index.json` (same `id` -> context.md wins). Input unlocks as soon as `index.json` loads; `context.md` merges in the
  background (never block the input on it). Bump the `?v=` on `webllm.js`/`webllm.css` in `index.html` after JS/CSS changes.
- A keyword gate runs BEFORE the model: no matching passage -> orange refusal (topic filter, not the AI). Greetings and
  "who is jk / jhapendra / kandel" are special-cased to the `about` entry; query typos within one edit are corrected.
- The model (Llama-3.2-1B, WebGPU, opt-in ~0.7-0.9 GB download) only sees matched passages. Page and every AI answer carry a
  "small model, can make mistakes, please verify" note. Do not remove it. Blog URLs in entries must be `/blog/posts/<slug>/`.
- Offline retrieval check: load `webllm.js` in node with a stub DOM and call `window.JKRetrieval.search(q)`.

## Speed work + loader (2026-11-13)

- Images: homepage images are WebP with `srcset` (640 / 1280 widths; manuscript strip 1600w), ~4.2 MB -> ~1.1 MB (37c840f). Convention for
  new images: add `name-640.webp` + `name.webp`, keep the `sizes` attr. First 2 story cards are eager, the rest (and abcnews/shinybox images) lazy.
  An unused thamel jpg is left in the repo on purpose.
- Fonts: Google Fonts CSS loads non-blocking (`media=print` swap + `<noscript>` fallback). Idea not done: self-host a subset of the ~90 KB Archivo font.
- Loader (66a0bd1, 969af24): yellow shutter screen, homepage only, first visit per session. A head inline script adds the `preload` class to
  `<html>` only if `sessionStorage 'jk-loaded'` is unset, no reduced-motion, and navigation type is `navigate`; 3 s hard fallback. Markup is
  `#loader` right after `<body>`; CSS `.loader` / `.preload .loader`; `main.js` runs a GSAP timeline + `endLoader()` (~0.6 s counter, waits for
  `window.load` and `document.fonts.ready` capped at 1.2 s, then 0.6 s wipe; min ~1.2 s). Masthead intro / mast-photo tweens wait for the loader exit.
  To disable: remove the head `preload` script, the `#loader` markup, the loader CSS and the loader/`endLoader` code in `main.js`.
- Throttled test (4x CPU, ~1.6 Mbps): first paint 7.4 s -> 1.5 s. Not yet verified: real phone/Safari, font-swap flash, lazy images in the pinned
  horizontal stream, loader look.
- Cache-bust is now `main.js?v=20261113r`; bump it after any `main.js` change.
- "Self-rated out of 100." note removed from the board (c7e01db); `tools/webllm/index.json` still has "Self-rated skills out of 100" wording (data, left on purpose).
- Another session also commits `tools/webllm` work in this repo; stage only your own hunks.

## History / handoffs

- `docs/HANDOFF-2026-11-11.md` — v3 → v4 redesign session.
- `docs/HANDOFF-2026-11-13.md` — tools verification, blog links, "Ask my portfolio" fixes.
