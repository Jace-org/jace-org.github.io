# Blog

Posts are plain Markdown files in `posts/`, listed in `posts.json`.

## Add a post

1. Create `posts/my-post.md` (no frontmatter needed, just write).
2. Add an entry to `posts.json`:

   ```json
   {
     "slug": "my-post",
     "title": "My post title",
     "date": "2026-09-10",
     "tags": ["Web"],
     "excerpt": "One line shown on the blog index.",
     "file": "my-post.md"
   }
   ```

3. Run `python3 blog/build.py` from the repo root. This generates a real,
   static `posts/<slug>/index.html` page for the post (with its own
   title, meta description, Open Graph/Twitter tags and JSON-LD), adds
   it to the pre-rendered list in `blog/index.html`, and refreshes the
   top-level `sitemap.xml`.
4. Commit and push (source `.md` file, `posts.json`, the generated
   `posts/<slug>/index.html`, updated `blog/index.html`, updated
   `sitemap.xml`).

Newest `date` shows first. `tags` become filter buttons.
The renderer supports headings, lists, links, images, quotes,
inline code and fenced code blocks.

Each post is a real static page at its own URL (not a `#hash` route) so
it can be indexed and shared individually — this is why step 3 above
is needed any time a post is added or its content/title/date changes.

## Notes

- `build.py` runs **locally only**. GitHub Pages is static hosting and
  never executes it. The committed `.html` files are what gets served.
- Generated post pages sit at `posts/<slug>/index.html` — three levels
  below the repo root. The `POST_TEMPLATE` links in `build.py` reflect
  that depth (`../../../assets/base.css`, `../../blog.css`, nav hrefs
  going up three). If the output location ever changes, re-check every
  relative `href`/`src` in that template, or a post will load with no
  CSS and broken nav.
- Shared assets: `assets/base.css` + `assets/subpage.js` at the repo
  root; `blog/blog.css` + `blog/blog.js` for blog-only styling.
