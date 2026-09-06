# Future ideas — jhapendrakandel.com.np

A backlog of features / missing things for the personal site. Not
prioritised. Pick from here when there's time. Created 2026-09-06.

Current site (for reference): static, no build. Single-page `index.html`
(hero / about / skills / projects / journey / credentials / contact /
footer) + `/blog` (markdown → static pages via `blog/build.py`) +
`/toolbox` + `dashboard.html` (a 461-byte stub) + `404.html` /
`thanks.html`. Contact form posts to FormSubmit and redirects to
`thanks.html`.

---

## Content / credibility

### 1. Project detail pages
Each project gets its own `/projects/<slug>/` page: the problem, the
stack, architecture notes, screenshots, and measurable results. Today
every project is a 3-line card with no depth — a hiring manager can't
tell a weekend script from ABC News. Could reuse the `blog/build.py`
markdown→HTML pattern so pages stay easy to write.

### 2. Link projects to their write-ups
Blog posts already exist for some projects (`building-abc-news-solo`,
`nepali-llm-at-home`). Wire the matching Projects cards to them so the
card is a doorway, not a dead end. Pairs naturally with the
Public/Private tag work already done.

### 3. Live status badges per project
A small "● live" / "repo" / "private" indicator on each card, driven by
a static `projects.json` you control (uptime, last-deployed date,
version). Extends the Public/Private overlay-link work.

### 4. `/uses` page
The homelab box (AMD Radeon AI PRO R9700, 32 GB), OS, editor, terminal,
CLI tools, self-hosted services. "/uses" pages are a well-known dev
genre, rank well, and cost nothing to keep.

### 5. `/now` page
What you're working on this month — a few bullets, dated. Low
maintenance, signals you're active.

### 6. Résumé / CV
A downloadable PDF plus an HTML `/resume` version (print stylesheet so
Cmd-P gives a clean PDF). There's `/toolbox` infra but nothing for a CV.

---

## Blog / SEO

### 7. RSS / Atom feed
The blog has no feed at all. `blog/build.py` already walks `posts.json`
— have it emit `blog/feed.xml` in the same pass. Needed for feed
readers, planet aggregators, and some newsletter tools.

### 8. Tags + tag pages
Add a `tags` array to each post in `posts.json`, generate
`/blog/tag/<tag>/` index pages, show tag chips on posts and the blog
index.

### 9. Post niceties
Reading-time estimate, "next / previous post" links, and a small table
of contents for long posts — all derivable at build time.

### 10. Structured data
`Person` + `WebSite` JSON-LD on the homepage; `BlogPosting` +
`BreadcrumbList` on blog pages. Improves Google rich results. (The
abcnews theme already does this — can lift the shape.)

### 11. Per-page Open Graph images
Share cards are currently bare. Either hand-make a few (`/assets/og/`)
or generate them at build time. Big difference when a link is posted to
LinkedIn / X / WhatsApp.

---

## Interaction / polish

### 12. Inline contact-form result
Replace the FormSubmit → `thanks.html` redirect with a `fetch()` POST +
inline success / error toast, so the user never leaves the page. Keep
`thanks.html` as the no-JS fallback.

### 13. Command palette (Cmd/Ctrl-K)
Fuzzy-jump to any section, project, or blog post. Fits the
"cybersecurity + automation" identity and is a memorable touch.

### 14. Contact extras
Copy-email button, a link to a PGP public key, and a `/security.txt`
(`.well-known/security.txt`) — consistent with the responsible-
disclosure stance already taken on abcnews.

### 15. Projects filter
Turn the tech tags into a live filter on the Projects grid (WordPress /
Python / Security / AI / Web). Pure client-side, no build change.

### 16. Testimonials / references
2–4 short quotes from clients / colleagues / lecturers. Journey and
Credentials cover facts; there's no third-party voice on the site.

---

## Technical / infra

### 17. Service worker
Offline support + instant repeat loads for a static site — near-free.
Precache the shell, cache-first for assets, network-first for HTML.

### 18. Self-owned analytics
A privacy-friendly counter — Cloudflare Web Analytics (no cookie, one
snippet) or a tiny beacon to the GPU box. Currently no visibility into
traffic at all.

### 19. Decide what `dashboard.html` is
It's a 461-byte stub right now. Either make it a real (private) homelab
status page that pulls from `status.abcnews.com.np`, or delete it and
its references.

### 20. Better 404
Add a search box and a few "popular pages" links to `404.html` instead
of static text.

### 21. Build / link-check CI
A GitHub Action that runs `blog/build.py`, checks every internal link
resolves, and verifies `sitemap.xml` covers all pages — fail the deploy
on a broken link or a stale sitemap.

### 22. Sitemap / robots upkeep
Have `blog/build.py` regenerate `sitemap.xml` (with `lastmod`) so it
can't drift from the actual set of pages.

---

## If instead this is about abcnews.com.np

That site is already feature-heavy; the real gaps are different:

- Real NEPSE index data (no free keyless source found yet — revisit)
- Reader comment system (none today)
- Email newsletter / digest signup
- PWA install prompt (service worker already exists for push + offline)
- Author / journalist profile pages
- Dedicated election / live-results template
- Speed pass (Core Web Vitals, image `srcset`, critical CSS)
- Full-text on-site search (currently category/title only)
