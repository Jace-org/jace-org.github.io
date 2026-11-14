#!/usr/bin/env python3
"""Build-time snapshot for /tech/ so search engines see real HTML.

Reads the newest tech stories from the data hub's tech.json (read-only) and rewrites
  - tech/index.html  (between the SNAPSHOT markers)
  - tech/feed.xml    (RSS 2.0)
Cards stay short (headline + ~140 char summary) and link to the story page; full articles are
never republished. Output is deterministic (no build timestamps), so an
unchanged feed leaves the files byte-identical. Stdlib only.

    python3 tech/build_snapshot.py
"""
import html
import json
import xml.etree.ElementTree as ET
import re
import sys
import urllib.request
from datetime import datetime, timezone
from email.utils import format_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

HUB_URL = "https://datastats.abcnews.com.np/v1/tech.json"
HUB_HOST = "datastats.abcnews.com.np"
LINK_HOST = "abcnews.com.np"
COUNT = 12
SUMMARY_MAX = 140
MAX_BYTES = 1_000_000
TIMEOUT = 15
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


_CTL = re.compile(r"[\x00-\x1f\x7f-\x9f]")


def safe_link(href):
    """Story link: https, exact host LINK_HOST, no userinfo. '' when invalid."""
    if not isinstance(href, str) or len(href) > 2048 or _CTL.search(href):
        return ""
    try:
        u = urlparse(href)
        if u.scheme == "https" and u.hostname == LINK_HOST and not u.username and not u.password:
            return href
    except ValueError:
        pass
    return ""





class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def fetch_raw():
    u = urlparse(HUB_URL)
    if u.scheme != "https" or u.hostname != HUB_HOST:
        raise SystemExit("refusing non-hub URL")
    req = urllib.request.Request(HUB_URL, headers={"User-Agent": "tech-briefing-snapshot/1.0", "Accept": "application/json"})
    with urllib.request.build_opener(_NoRedirect).open(req, timeout=TIMEOUT) as r:
        raw = r.read(MAX_BYTES + 1)
    return raw


def parse(raw):
    if len(raw) > MAX_BYTES:
        raise SystemExit("hub response too large")
    data = json.loads(raw)
    if not isinstance(data, dict) or data.get("schema") != 1 or not isinstance(data.get("items"), list):
        raise SystemExit("unexpected hub response")
    items = []
    for p in data["items"][:48]:
        if not isinstance(p, dict) or not isinstance(p.get("title"), str):
            continue
        title = plain(p["title"])[:300]
        link = safe_link(p.get("link"))
        if not title or not link:
            continue
        try:
            when = datetime.strptime(str(p["date_gmt"]).rstrip("Z"), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            continue
        summary = trim(plain(p["summary"])) if isinstance(p.get("summary"), str) else ""
        items.append({"title": title, "link": link, "guid": link, "when": when, "summary": summary})
        if len(items) >= COUNT:
            break
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


_BAD_XML = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\u202a-\u202e\u2066-\u2069\ufffe\uffff]')


def feed_xml(items):
    e = lambda v, quote=True: html.escape(_BAD_XML.sub('', str(v)), quote=quote)
    newest = max(it["when"] for it in items)
    rows = []
    for it in items:
        rows.append(
            "    <item>\n"
            f"      <title>{e(it['title'], quote=False)}</title>\n"
            f"      <link>{e(it['link'], quote=False)}</link>\n"
            f"      <guid isPermaLink=\"false\">{e(it['guid'], quote=False)}</guid>\n"
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
    # `--file PATH` parses a local tech.json instead of the network (offline tests)
    raw = Path(sys.argv[2]).read_bytes() if len(sys.argv) > 2 and sys.argv[1] == "--file" else fetch_raw()
    items = parse(raw)
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
    feed = feed_xml(items)
    try:
        ET.fromstring(feed.encode("utf-8"))
    except ET.ParseError as exc:
        print(f"generated feed is not well-formed XML ({exc}); keeping old files", file=sys.stderr)
        return 1
    changed = [write_if_changed(page, new), write_if_changed(HERE / "feed.xml", feed)]
    print(f"{len(items)} items; {'updated' if any(changed) else 'unchanged'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
