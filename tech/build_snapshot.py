#!/usr/bin/env python3
"""Build-time snapshot for /tech/ so search engines see real HTML.

Fetches the newest tech posts from the public REST API and rewrites
  - tech/index.html  (between the SNAPSHOT markers)
  - tech/feed.xml    (RSS 2.0)
Cards stay short (headline + ~140 char summary) and link out; full articles are
never republished. Output is deterministic (no build timestamps), so an
unchanged feed leaves the files byte-identical. Stdlib only.

    python3 tech/build_snapshot.py
"""
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from email.utils import format_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

API_BASE = "https://abcnews.com.np/wp-json/wp/v2/posts"
API_HOST = urlparse(API_BASE).netloc
CATEGORY = 55
COUNT = 12
SUMMARY_MAX = 140
SITE = "https://jhapendrakandel.com.np"
HERE = Path(__file__).resolve().parent
START, END = "<!--SNAPSHOT:START-->", "<!--SNAPSHOT:END-->"


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain(markup):
    p = _Text()
    p.feed(markup or "")
    p.close()
    return re.sub(r"\s+", " ", "".join(p.parts)).strip()


def trim(text, limit=SUMMARY_MAX):
    if len(text) <= limit:
        return text
    cut = text[:limit]
    sp = cut.rfind(" ")
    if sp > limit * 0.6:
        cut = cut[:sp]
    return re.sub(r"[\s,;:.–—-]+$", "", cut) + "…"


def fetch():
    url = f"{API_BASE}?categories={CATEGORY}&per_page={COUNT}&page=1&_fields=title,link,date_gmt,excerpt"
    req = urllib.request.Request(url, headers={"User-Agent": "tech-briefing-snapshot/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if not isinstance(data, list):
        raise SystemExit("unexpected API response")
    items = []
    for p in data:
        title = plain((p.get("title") or {}).get("rendered"))
        link = p.get("link") or ""
        u = urlparse(link)
        if not title or u.scheme != "https" or u.netloc != API_HOST:
            continue
        try:
            when = datetime.strptime(p["date_gmt"], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            continue
        items.append({"title": title, "link": link, "when": when,
                      "summary": trim(plain((p.get("excerpt") or {}).get("rendered")))})
    return items


def cards_html(items):
    out = []
    for it in items:
        e = html.escape
        out.append(
            '                <li class="tcard">\n'
            f'                    <h3>{e(it["title"])}</h3>\n'
            + (f'                    <p class="tcard-sum">{e(it["summary"])}</p>\n' if it["summary"] else "")
            + '                    <div class="tcard-foot">\n'
            f'                        <time datetime="{it["when"].strftime("%Y-%m-%dT%H:%M:%SZ")}">{it["when"].strftime("%-d %b %Y")}</time>\n'
            f'                        <a href="{e(it["link"], quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="Read full story: {e(it["title"], quote=True)}">Read full story</a>\n'
            '                    </div>\n'
            '                </li>'
        )
    return "\n".join(out)


def feed_xml(items):
    e = html.escape
    newest = max(it["when"] for it in items)
    rows = []
    for it in items:
        rows.append(
            "    <item>\n"
            f"      <title>{e(it['title'], quote=False)}</title>\n"
            f"      <link>{e(it['link'], quote=False)}</link>\n"
            f"      <guid isPermaLink=\"true\">{e(it['link'], quote=False)}</guid>\n"
            f"      <pubDate>{format_datetime(it['when'])}</pubDate>\n"
            f"      <description>{e(it['summary'], quote=False)}</description>\n"
            "    </item>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        "  <channel>\n"
        "    <title>Tech Briefing</title>\n"
        f"    <link>{SITE}/tech/</link>\n"
        f'    <atom:link href="{SITE}/tech/feed.xml" rel="self" type="application/rss+xml"/>\n'
        "    <description>Short summaries of the latest technology news, each linking to the full story.</description>\n"
        "    <language>en</language>\n"
        f"    <lastBuildDate>{format_datetime(newest)}</lastBuildDate>\n"
        + "\n".join(rows) + "\n  </channel>\n</rss>\n"
    )


def write_if_changed(path, text):
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def main():
    items = fetch()
    if not items:
        print("no items returned; leaving files untouched", file=sys.stderr)
        return 1
    page = HERE / "index.html"
    src = page.read_text(encoding="utf-8")
    if START not in src or END not in src:
        raise SystemExit("snapshot markers missing in tech/index.html")
    head, rest = src.split(START, 1)
    _, tail = rest.split(END, 1)
    new = f"{head}{START}\n{cards_html(items)}\n                {END}{tail}"
    changed = [write_if_changed(page, new), write_if_changed(HERE / "feed.xml", feed_xml(items))]
    print(f"{len(items)} items; {'updated' if any(changed) else 'unchanged'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
