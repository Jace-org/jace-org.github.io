/* Presentational polish for /tools: scroll reveal, loading state, number tick. Same-origin, no data access. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('js');

  /* scroll reveal for static blocks (tools index) */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  var groups = document.querySelectorAll('.lab-cards, .dw-page > .dw-h2, .dw-page > .dw-note, .lab-privacy, .tl-source');
  Array.prototype.forEach.call(groups, function (g) {
    var items = g.classList.contains('lab-cards') ? g.children : [g];
    Array.prototype.forEach.call(items, function (it, i) {
      it.classList.add('rv');
      it.style.setProperty('--rv-d', Math.min(i, 5) * 0.06 + 's');
      io.observe(it);
    });
  });
  /* safety net: never leave content hidden */
  setTimeout(function () { Array.prototype.forEach.call(document.querySelectorAll('.rv:not(.in)'), function (n) { n.classList.add('in'); }); }, 4000);

  /* loading shimmer on "Loading..." status lines */
  function markLoading(n) {
    if (!n || !n.classList || !n.classList.contains('dw-status')) return;
    n.classList.toggle('is-loading', /^Loading/i.test(n.textContent || ''));
  }
  /* number tick: once per element, integers and percentages only */
  var TICK = '.pct, .tl-big, .fact-num, .r-types .n';
  function tick(el) {
    if (el.dataset.tk) return;
    var t = (el.textContent || '').trim(), m = /^(\d{1,3}(?:,\d{3})*|\d+)(%?)$/.exec(t);
    if (!m) return;
    var end = parseInt(m[1].replace(/,/g, ''), 10);
    if (!(end > 9) || end > 1e9) return;
    el.dataset.tk = '1';
    var start = performance.now(), dur = 700, big = m[1].indexOf(',') > -1;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = (big ? v.toLocaleString('en-US') : String(v)) + m[2];
      if (p < 1) requestAnimationFrame(step); else el.textContent = t;
    })(start);
  }
  function scan(n) {
    if (n.nodeType !== 1) { if (n.parentNode && n.parentNode.nodeType === 1) scan(n.parentNode); return; }
    markLoading(n.closest && n.closest('.dw-status'));
    if (n.matches && n.matches(TICK)) tick(n);
    if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll(TICK), tick);
  }
  var main = document.getElementById('main') || document.body;
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'attributes') { markLoading(m.target); return; }
      scan(m.type === 'characterData' ? m.target : m.target);
      Array.prototype.forEach.call(m.addedNodes, scan);
    });
  }).observe(main, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  Array.prototype.forEach.call(main.querySelectorAll('.dw-status'), markLoading);
})();
