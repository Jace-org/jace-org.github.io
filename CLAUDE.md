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
| `project/` | Lab concept page |
| `hack-me/` | Hack Me locked-door page |
| `thanks.html` | FormSubmit redirect target |
| `404.html`, `robots.txt`, `sitemap.xml`, `seo/` | SEO |
| `.taste-skill/` | gitignored inspector output |

Subpages use their own CSS (`blog/blog.css`, `lab/lab.css`, …) and were **not** restyled in v4.

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

## History / handoffs

- `docs/HANDOFF-2026-11-11.md` — v3 → v4 redesign session.
