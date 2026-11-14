#!/usr/bin/env python3
"""Offline test: story links only ever point at abcnews.com.np. Run: PYTHONDONTWRITEBYTECODE=1 python3 tech/test_links.py"""
import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_snapshot as b

class T(unittest.TestCase):
    def test_links_stay_on_own_site(self):
        link = "https://abcnews.com.np/s/"
        items = [{"title": "T", "summary": "s", "link": link, "date_gmt": "2026-11-12T10:00:00", "source_url": "https://theverge.com/a"},
                 {"title": "bad", "link": "https://evil.example/", "date_gmt": "2026-11-12T10:00:00"}]
        out = b.parse(json.dumps({"schema": 1, "items": items}).encode())
        self.assertEqual([i["link"] for i in out], [link])
    def test_schema(self):
        with self.assertRaises(SystemExit): b.parse(b'{"schema":2,"items":[]}')

if __name__ == "__main__":
    unittest.main()
