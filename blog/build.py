#!/usr/bin/env python3
"""
Generates a real, static, crawlable HTML page for every blog post
(blog/posts/<slug>/index.html), refreshes the pre-rendered post list
inside blog/index.html, and regenerates the top-level sitemap.xml.

Why this exists: the blog used to be a single-page app that rendered
posts client-side behind a `#read/<slug>` hash. Hash fragments are
never sent to the server and are not treated as separate pages by
search engines, so none of the actual post content was indexable and
every post shared one generic <title>/<meta description>. This script
produces one real URL per post with its own title, description, OG/
Twitter tags and JSON-LD, so each post can be indexed and shared on
its own.

Run this after adding or editing a post:

    python3 blog/build.py

Then commit the generated posts/<slug>/index.html files, the updated
blog/index.html, and the updated sitemap.xml along with your new post.
There is still no server-side build step for GitHub Pages itself --
this only needs to be run locally, once per content change.
"""
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT / "blog"
SITE = "https://www.jhapendrakandel.com.np"
LOGO = "https://raw.githubusercontent.com/jhapendrakandel/Jace.github.io/refs/heads/main/logo.png"

# ---------------------------------------------------------------- markdown
# Mirrors blog.js's render()/inline() so static pages match the client
# renderer exactly.

def esc(s):
    return html.escape(s, quote=False)


def inline(s):
    s = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)",
                lambda m: f'<img src="{m.group(2)}" alt="{m.group(1)}" loading="lazy">', s)

    def link(m):
        href, txt = m.group(2), m.group(1)
        ext = re.match(r"^https?:", href)
        attrs = ' target="_blank" rel="noopener"' if ext else ""
        return f'<a href="{href}"{attrs}>{txt}</a>'
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, s)
    s = re.sub(r"`([^`]+)`", lambda m: f"<code>{m.group(1)}</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(^|[^*])\*([^*\n]+)\*", r"\1<em>\2</em>", s)
    return s


def render_markdown(md):
    lines = re.sub(r"\r\n?", "\n", md).split("\n")
    out = []
    i = 0
    n = len(lines)

    def flush_para(buf):
        if buf:
            out.append(f"<p>{inline(' '.join(buf))}</p>")

    while i < n:
        line = lines[i]
        if re.match(r"^```", line):
            code = []
            i += 1
            while i < n and not re.match(r"^```", lines[i]):
                code.append(lines[i])
                i += 1
            i += 1
            out.append(f"<pre><code>{esc(chr(10).join(code))}</code></pre>")
            continue
        h = re.match(r"^(#{1,4})\s+(.*)$", line)
        if h:
            lvl = len(h.group(1))
            out.append(f"<h{lvl}>{inline(esc(h.group(2)))}</h{lvl}>")
            i += 1
            continue
        if re.match(r"^\s*([*_-])(\s*\1){2,}\s*$", line):
            out.append("<hr>")
            i += 1
            continue
        if re.match(r"^>\s?", line):
            q = []
            while i < n and re.match(r"^>\s?", lines[i]):
                q.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            out.append(f"<blockquote>{inline(esc(' '.join(q)))}</blockquote>")
            continue
        if re.match(r"^\s*[-*]\s+", line):
            ul = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                item_text = re.sub(r"^\s*[-*]\s+", "", lines[i])
                ul.append(f"<li>{inline(esc(item_text))}</li>")
                i += 1
            out.append(f"<ul>{''.join(ul)}</ul>")
            continue
        if re.match(r"^\s*\d+\.\s+", line):
            ol = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                item_text = re.sub(r"^\s*\d+\.\s+", "", lines[i])
                ol.append(f"<li>{inline(esc(item_text))}</li>")
                i += 1
            out.append(f"<ol>{''.join(ol)}</ol>")
            continue
        if re.match(r"^\s*$", line):
            i += 1
            continue
        para = []
        block_start = re.compile(r"^(#{1,4}\s|>\s?|```|\s*[-*]\s+|\s*\d+\.\s+)")
        hr_re = re.compile(r"^\s*([*_-])(\s*\1){2,}\s*$")
        while i < n and not re.match(r"^\s*$", lines[i]) and not block_start.match(lines[i]) and not hr_re.match(lines[i]):
            para.append(esc(lines[i]))
            i += 1
        flush_para(para)
    return "\n".join(out)


def fmt_date(iso):
    d = datetime.strptime(iso, "%Y-%m-%d")
    return f"{d.strftime('%B')} {d.day}, {d.year}"


POST_TEMPLATE = """<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0f172a">
    <meta name="color-scheme" content="dark light">
    <title>{title} — Jhapendra Kandel</title>
    <meta name="description" content="{excerpt}">
    <meta name="author" content="Jhapendra Kandel">
    <link rel="canonical" href="{url}">
    <link rel="icon" type="image/png" href="{logo}">

    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Jhapendra Kandel">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{excerpt}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{logo}">
    <meta property="article:published_time" content="{date}">
    <meta property="article:author" content="Jhapendra Kandel">
{tag_meta}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{excerpt}">
    <meta name="twitter:image" content="{logo}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Playfair+Display:ital,wght@0,400..900;1,400..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../../assets/base.css">
    <link rel="stylesheet" href="../blog.css">
    <script type="application/ld+json">
    {jsonld}
    </script>
    <script>
        try {{
            var t = localStorage.getItem("theme");
            if (t === "light") document.documentElement.classList.remove("dark");
        }} catch (e) {{ }}
    </script>
</head>

<body>
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="bg-layer" aria-hidden="true">
        <div class="aurora aurora-1"></div>
        <div class="aurora aurora-2"></div>
        <div class="bg-grid"></div>
    </div>

    <header class="subnav">
        <div class="subnav-inner">
            <a class="home" href="../../" aria-label="Back to home">J<span class="dot">.</span>K</a>
            <nav class="links" aria-label="Sections">
                <a href="../../">Home</a>
                <a href="../">Blog</a>
                <a href="../../toolbox/">Resources</a>
            </nav>
            <button class="theme-toggle" id="theme-toggle" aria-label="Switch colour theme">☾</button>
        </div>
    </header>

    <main id="main" class="page">
        <div class="wrap">
            <article>
                <a class="back-link" href="../">&larr; All posts</a>
                <div class="post-head">
                    <h1>{title}</h1>
                    <p class="post-meta"><span>{display_date}</span>{tag_html}</p>
                </div>
                <div class="prose">
{body}
                </div>
            </article>
        </div>
    </main>

    <footer class="subfooter">
        <p>© <span id="year"></span> Jhapendra Kandel · <a href="../../">home</a> · <a
                href="https://github.com/jhapendra-kandel" target="_blank" rel="noopener">GitHub</a></p>
    </footer>

    <script src="../../assets/subpage.js" defer></script>
</body>

</html>
"""


def build_posts(posts):
    for p in posts:
        md_path = BLOG / "posts" / p["file"]
        md = md_path.read_text(encoding="utf-8")
        md = re.sub(r"^\s*#\s+.*\n", "", md, count=1)  # drop duplicate H1
        body = render_markdown(md)

        url = f"{SITE}/blog/posts/{p['slug']}/"
        tags = p.get("tags", [])
        tag_html = "".join(f'<span class="tag">{esc(t)}</span>' for t in tags)
        tag_meta = "\n".join(f'    <meta property="article:tag" content="{esc(t)}">' for t in tags)
        date_iso = p["date"]
        display_date = fmt_date(date_iso)

        jsonld = json.dumps({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": p["title"],
            "description": p.get("excerpt", ""),
            "datePublished": date_iso,
            "dateModified": date_iso,
            "url": url,
            "image": LOGO,
            "author": {"@type": "Person", "name": "Jhapendra Kandel", "url": f"{SITE}/"},
            "publisher": {"@type": "Person", "name": "Jhapendra Kandel"},
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "keywords": ", ".join(tags),
        }, ensure_ascii=False, indent=4)

        html_out = POST_TEMPLATE.format(
            title=esc(p["title"]),
            excerpt=esc(p.get("excerpt", "")),
            url=url,
            logo=LOGO,
            date=date_iso,
            tag_meta=tag_meta,
            jsonld=jsonld,
            display_date=display_date,
            tag_html=tag_html,
            body=body,
        )
        out_dir = BLOG / "posts" / p["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(html_out, encoding="utf-8")
        print(f"wrote blog/posts/{p['slug']}/index.html")


def update_index_list(posts):
    index_path = BLOG / "index.html"
    src = index_path.read_text(encoding="utf-8")
    items = []
    for p in posts:
        tags_html = "".join(f'<span class="tag">{esc(t)}</span>' for t in p.get("tags", []))
        tag_attr = esc("|".join(p.get("tags", [])))
        items.append(
            f'                    <li class="reveal" data-tags="{tag_attr}">\n'
            f'                        <a class="post-card" href="posts/{p["slug"]}/">\n'
            f'                            <h2>{esc(p["title"])}</h2>\n'
            f'                            <p class="post-meta"><span>{fmt_date(p["date"])}</span>{tags_html}</p>\n'
            f'                            <p class="excerpt">{esc(p.get("excerpt", ""))}</p>\n'
            "                        </a>\n"
            "                    </li>"
        )
    block = "\n".join(items)
    new_src, count = re.subn(
        r"(<!-- POSTS:START -->)(.*?)(<!-- POSTS:END -->)",
        lambda m: f"{m.group(1)}\n{block}\n                    {m.group(3)}",
        src,
        flags=re.S,
    )
    if count == 0:
        raise SystemExit("blog/index.html is missing <!-- POSTS:START/END --> markers")
    index_path.write_text(new_src, encoding="utf-8")
    print("updated blog/index.html post list")


def update_sitemap(posts):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    static_urls = [
        (f"{SITE}/", "monthly", "1.0", today),
        (f"{SITE}/blog/", "weekly", "0.8", today),
        (f"{SITE}/toolbox/", "monthly", "0.6", today),
    ]
    post_urls = [
        (f"{SITE}/blog/posts/{p['slug']}/", "monthly", "0.7", p["date"])
        for p in posts
    ]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, freq, prio, lastmod in static_urls + post_urls:
        lines.append(
            f"  <url><loc>{loc}</loc><lastmod>{lastmod}</lastmod>"
            f"<changefreq>{freq}</changefreq><priority>{prio}</priority></url>"
        )
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("updated sitemap.xml")


def main():
    posts = json.loads((BLOG / "posts.json").read_text(encoding="utf-8"))
    posts = sorted(posts, key=lambda p: p["date"], reverse=True)
    build_posts(posts)
    update_index_list(posts)
    update_sitemap(posts)


if __name__ == "__main__":
    main()
