#!/usr/bin/env python3
"""Offline test: cards/feed link to our own /tech/?story=slug; the abcnews link survives only as the feed guid.
Run: PYTHONDONTWRITEBYTECODE=1 python3 tech/test_links.py"""
import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_snapshot as b

def raw(items):
    return json.dumps({"schema": 1, "items": items}).encode()

class T(unittest.TestCase):
    def test_links_stay_on_own_site(self):
        link = "https://abcnews.com.np/some-story-slug/"
        items = [{"title": "T", "summary": "s", "link": link, "date_gmt": "2026-11-12T10:00:00", "source_url": "https://theverge.com/a"},
                 {"title": "bad", "link": "https://evil.example/x-y-z/", "date_gmt": "2026-11-12T10:00:00"}]
        out = b.parse(raw(items))
        self.assertEqual([i["link"] for i in out], ["https://jhapendrakandel.com.np/tech/?story=some-story-slug"])
        self.assertEqual([i["guid"] for i in out], [link])
        self.assertEqual([i["slug"] for i in out], ["some-story-slug"])
    def test_slug_validation(self):
        for bad in ["https://abcnews.com.np/", "https://abcnews.com.np/AB-cd/", "https://abcnews.com.np/ab/", "https://abcnews.com.np/a_b_c/"]:
            self.assertEqual(b.slug_of(bad), "", bad)
        self.assertEqual(b.slug_of("https://abcnews.com.np/cat/good-slug-1/?x=1"), "good-slug-1")
        out = b.parse(raw([{"title": "T", "link": "https://abcnews.com.np/AB-cd/", "date_gmt": "2026-11-12T10:00:00"}]))
        self.assertEqual(out, [])
    def test_rendered_output_has_no_third_party_links(self):
        out = b.parse(raw([{"title": "T", "summary": "s", "link": "https://abcnews.com.np/some-story-slug/", "date_gmt": "2026-11-12T10:00:00"}]))
        cards = b.cards_html(out)
        self.assertIn('href="?story=some-story-slug"', cards)
        self.assertNotIn("target=", cards)
        self.assertNotIn("abcnews.com.np", cards)
        feed = b.feed_xml(out)
        self.assertIn("<link>https://jhapendrakandel.com.np/tech/?story=some-story-slug</link>", feed)
        self.assertIn('<guid isPermaLink="false">https://abcnews.com.np/some-story-slug/</guid>', feed)
    def test_schema(self):
        with self.assertRaises(SystemExit): b.parse(b'{"schema":2,"items":[]}')

if __name__ == "__main__":
    unittest.main()
