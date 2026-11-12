Data widgets (for the integrator). Nothing here is wired into the homepage yet.

Files
  widgets/data-base.js   the ONLY place the data endpoint (DATA_BASE) is defined
  widgets/hub.js         shared helpers (fetch with 8 s timeout, URL allowlist, text helpers)
  widgets/hn.js          window.renderHN(container)   - Hacker News top tech cards
  widgets/now.js         window.renderNow(container)  - one-line "Now" strip
  widgets/widgets.css    data-specific styles; loaded AFTER styles.css (reuses its tokens)
  widgets/nav.js         mobile menu toggle for /pulse/ and /security/ only
  widgets/fixtures/      sample JSON for local tests (make-fixtures.py regenerates, serve.py serves)

Wiring into index.html (keep the ?v= bump habit):
  <link rel="stylesheet" href="widgets/widgets.css?v=2">     (after styles.css)
  <div id="now-strip" hidden></div>       where the Now strip should appear
  <section id="hn-card" hidden></section> where the HN list should appear
  <script src="widgets/data-base.js?v=2"></script>
  <script src="widgets/hub.js?v=2"></script>
  <script src="widgets/hn.js?v=2"></script>
  <script src="widgets/now.js?v=2"></script>
  <script>
    renderNow(document.getElementById('now-strip'));
    renderHN(document.getElementById('hn-card'));
  </script>
(or call both from main.js after DOMContentLoaded). Containers must start with the
hidden attribute; the widgets reveal themselves only after valid data arrives and hide
again on any error.

Nav links to add: <a href="pulse/">Nepal Pulse</a>   <a href="security/">Security Wire</a>
Sitemap: add https://jhapendrakandel.com.np/pulse/ and /security/ (not done here).
The pages link ../styles.css?v=20261112a - update that ?v= if you bump styles.css.

Local testing: python3 widgets/fixtures/serve.py 8099, then open
  /pulse/?fixtures=1   /security/?fixtures=1   (also ?fixtures=stale  ?fixtures=bad)
The fixtures flag only reads same-origin sample files.
