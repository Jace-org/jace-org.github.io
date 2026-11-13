import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402


class SanitizeTests(unittest.TestCase):
    def test_link_attribute_injection(self):
        out = build.render_markdown('[y](http://a"onmouseover="alert(1))')
        self.assertNotIn('"onmouseover', out)
        self.assertNotIn(' onmouseover=', out)
        self.assertIn("&quot;", out)

    def test_image_attribute_injection(self):
        out = build.render_markdown('![i](x"onerror="alert(1))')
        self.assertNotIn('"onerror', out)
        self.assertNotIn(' onerror=', out)

    def test_javascript_scheme_blocked(self):
        for payload in ("[x](javascript:alert(1))", "[x](JaVaScRiPt:alert(1))",
                        "![x](javascript:alert(1))", "[x](data:text/html,hi)"):
            out = build.render_markdown(payload)
            self.assertNotIn("javascript:", out.lower())
            self.assertNotIn("data:", out.lower())
            self.assertNotIn("href=", out)
            self.assertNotIn("src=", out)

    def test_safe_links_kept(self):
        out = build.render_markdown("[a](https://e.com/x?a=1&b=2) [m](mailto:a@b.c) [r](../x/)")
        self.assertIn('href="https://e.com/x?a=1&amp;b=2" target="_blank" rel="noopener"', out)
        self.assertIn('href="mailto:a@b.c"', out)
        self.assertIn('href="../x/"', out)

    def test_jsonld_script_breakout(self):
        s = build.json_for_script({"t": "</script><script>alert(1)</script>"})
        self.assertNotIn("</", s)
        self.assertEqual(json.loads(s)["t"], "</script><script>alert(1)</script>")

    def test_title_excerpt_attrs(self):
        self.assertNotIn('"', build.esc_attr('a"b'))


class BuildPostTests(unittest.TestCase):
    def test_full_page_with_hostile_metadata(self):
        import tempfile
        old_blog = build.BLOG
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            (d / "posts").mkdir()
            (d / "posts" / "p.md").write_text("# T\n\nbody\n", encoding="utf-8")
            build.BLOG = d
            try:
                posts = [{"slug": "p", "file": "p.md", "date": "2026-01-01",
                          "title": 'Q"uote </script><script>alert(1)</script>',
                          "excerpt": 'e"x </script><script>alert(2)</script>',
                          "tags": ['t"ag']}]
                build.build_posts(posts)
            finally:
                build.BLOG = old_blog
            page = (d / "posts" / "p" / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("</script><script>", page)
        self.assertEqual(page.count("</script>"), 2 + 1)  # 2 ld+json + blog.js
        self.assertNotIn('content="Q"', page)
        self.assertIn("https://jhapendrakandel.com.np/blog/posts/p/", page)


if __name__ == "__main__":
    unittest.main()
