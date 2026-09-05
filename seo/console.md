# Search Console check — started 2026-09-05

Context for tomorrow's follow-up session, so it doesn't have to be
re-derived. This file is just a status log, not documentation of how
the site works — see `blog/README.md` for that.

## What changed today (commit `520bfc0`, pushed to `main`)

The blog used to render posts client-side behind a `#read/<slug>` hash
route. Hash fragments never reach the server and Google does not index
them as separate pages, so all 3 posts shared one generic title/
description and were effectively invisible to search individually.

Fixed: each post now has a real static page at its own URL, generated
by `blog/build.py` from `blog/posts.json`:

- `https://www.jhapendrakandel.com.np/blog/posts/hello-from-the-new-blog/`
- `https://www.jhapendrakandel.com.np/blog/posts/building-abc-news-solo/`
- `https://www.jhapendrakandel.com.np/blog/posts/nepali-llm-at-home/`

Each has its own `<title>`, meta description, canonical URL, OG/Twitter
tags, and JSON-LD `BlogPosting` schema. `sitemap.xml` was regenerated
to list all 6 real URLs (those 3 + homepage + `/blog/` + `/toolbox/`)
with `lastmod` dates instead of just 3 static entries with no dates.

**Timeline gotcha, don't repeat it**: the Search Console property was
added and verified, `sitemap.xml` was submitted, and URL Inspection /
Request Indexing was run on all 6 URLs — **all before this commit was
pushed**. So that first round of submissions almost certainly saw the
*old* sitemap (3 URLs, no lastmod) and the *old* hash-routed blog pages,
not what's described above. The commit was pushed at the end of this
same session. Everything below assumes today's state (post-push) is
what Google actually sees from here on — check that assumption first.

## What to check tomorrow (2026-09-06 or later)

1. **Is the new content actually live?**
   ```
   curl -s https://www.jhapendrakandel.com.np/sitemap.xml
   curl -s https://www.jhapendrakandel.com.np/blog/posts/hello-from-the-new-blog/ | grep -o '<title>[^<]*</title>'
   ```
   Sitemap should show 6 `<url>` entries with `<lastmod>`. The post page
   should NOT return the generic "Blog — Jhapendra Kandel" title — it
   should be "Hello from the new blog — Jhapendra Kandel".

2. **Search Console → Sitemaps report**: does `sitemap.xml` show
   "Success" with 6 discovered URLs? If it still shows the old count/
   error, resubmit it now that the file is confirmably live (step 1).

3. **Search Console → Page indexing / Coverage report**: any of the
   3 post URLs or `/blog/`/`/toolbox/` showing as indexed yet, or still
   "Discovered — not indexed" / "Crawled — not indexed"? Normal for
   this to take days, not a bug on its own.

4. **Re-run URL Inspection → Request Indexing** on the 3 post URLs
   specifically, if step 1 confirms they're serving the new per-post
   HTML (the pre-push requests were likely wasted on stale content).

5. If a post still won't index after a few days, check:
   - `robots.txt` still allows everything (`Allow: /`) — shouldn't have
     changed, but verify.
   - The page's `<link rel="canonical">` matches the URL it's served at
     (should, since `blog/build.py` generates it from the same slug).
   - Whether GitHub Pages actually deployed (repo Settings → Pages, or
     the Actions tab if it uses one, for a green checkmark on the
     `520bfc0` commit).

## Adding a new post going forward

`blog/README.md` has the full steps. Short version: add the `.md` file
+ an entry in `posts.json`, then run `python3 blog/build.py` from repo
root before committing — it regenerates the post's static page, the
blog index list, and `sitemap.xml` in one go. Skipping that step means
a new post silently stays invisible to search the same way the old
hash-routed ones were.
