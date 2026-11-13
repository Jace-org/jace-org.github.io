#!/usr/bin/env python3
"""Offline tests for the original-article link allowlist and the hub parser. Run: PYTHONDONTWRITEBYTECODE=1 python3 tech/test_source_links.py"""
import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_snapshot as b

OK = ["https://theverge.com/a", "https://www.theverge.com/a/b?x=1", "https://ARSTECHNICA.com/x", "https://www.wired.com/x",
      "https://nepalitelecom.com/p", "https://theverge.com:443/a"]
BAD = ["javascript:alert(1)", "http://theverge.com/a", "https://theverge.com.evil.example/a", "https://evil.example/theverge.com",
       "https://theverge.com@evil.example/", "https://user:pw@theverge.com/", "data:text/html,x", "https://evil.example\\@theverge.com/",
       "https://notwired.com/a", "https://evilwired.com/a", "https://theverge.com/\x00", "https://theverge.com/" + "a" * 600,
       "", None, 5, "//theverge.com/a", "https://theverge.com:bad/",
       "https://feeds.theverge.com/a", "https://feeds.wired.com/x", "https://evil%2f.theverge.com/x", "https://theverge.com:8443/a",
       "https://theverge.com./a", "https://@theverge.com/a", "https://theverge.com/a b", "https://m.wired.com/x", "https://www.www.theverge.com/a"]

class T(unittest.TestCase):
    def test_ok(self):
        for u in OK: self.assertEqual(b.safe_source(u), u)
    def test_bad(self):
        for u in BAD: self.assertEqual(b.safe_source(u), "", u)
    def test_parse_fallback(self):
        link = "https://abcnews.com.np/s/"
        items = [{"title": "T%d" % i, "summary": "s", "link": link, "date_gmt": "2026-11-12T10:00:00", "source_url": u}
                 for i, u in enumerate([OK[0], BAD[0], BAD[2], None])]
        items.append({"title": "bad link", "link": "https://evil.example/", "date_gmt": "2026-11-12T10:00:00"})
        out = b.parse(json.dumps({"schema": 1, "items": items}).encode())
        self.assertEqual([i["link"] for i in out], [OK[0], link, link, link])
    def test_guid_stable(self):
        link = "https://abcnews.com.np/s/"
        items = b.parse(json.dumps({"schema": 1, "items": [{"title": "T", "link": link, "date_gmt": "2026-11-12T10:00:00", "source_url": OK[0]}]}).encode())
        x = b.feed_xml(items)
        self.assertIn('<guid isPermaLink="false">' + link + '</guid>', x)
        self.assertIn('<link>' + OK[0] + '</link>', x)
    def test_schema(self):
        with self.assertRaises(SystemExit): b.parse(b'{"schema":2,"items":[]}')
        with self.assertRaises(SystemExit): b.parse(b"x" * (b.MAX_BYTES + 1))

if __name__ == "__main__":
    unittest.main()
