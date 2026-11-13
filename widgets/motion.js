/* Presentational motion for /pulse/, /security/ and /project/. No data, no network.
   Adds: count-ups on stat numerals, SVG chart draw-in, loading skeletons while a data block is hidden.
   Everything is optional; with JS off or reduced motion the page is already complete. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  root.classList.add('js');

  function bump(el) {
    if (reduce || el.getAttribute('data-counted')) return;
    var txt = el.textContent || '';
    if (!/^\d[\d,]*$/.test(txt)) return;
    el.setAttribute('data-counted', '1');
    var end = parseInt(txt.replace(/,/g, ''), 10);
    if (!(end > 0)) return;
    var fmt = txt.indexOf(',') >= 0;
    var dur = Math.min(1100, 500 + String(end).length * 120), t0 = null;
    function str(n) { return fmt ? n.toLocaleString('en-US') : String(n); }
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = str(Math.round(end * e));
      if (p < 1) requestAnimationFrame(tick); else el.textContent = txt;
    }
    el.textContent = str(0);
    requestAnimationFrame(tick);
  }

  function watchCounts(el) {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); bump(e.target); } });
    }, { threshold: 0.4 });
    io.observe(el);
  }

  document.querySelectorAll('.proj-stats b').forEach(watchCounts);

  var stats = document.getElementById('stats');
  if (stats) {
    new MutationObserver(function () {
      stats.querySelectorAll('.fact-num:not([data-watched])').forEach(function (n) { n.setAttribute('data-watched', '1'); watchCounts(n); });
    }).observe(stats, { childList: true });
  }

  var chart = document.getElementById('chart');
  if (chart && !reduce) {
    new MutationObserver(function () {
      var line = chart.querySelector('path.line');
      if (!line || chart.classList.contains('is-drawn')) return;
      line.setAttribute('pathLength', '1');
      chart.classList.add('is-drawn');
    }).observe(chart, { childList: true });
  }

  /* Skeletons: shown while the real block is still hidden and no status message is up. */
  function div(c) { var d = document.createElement('div'); d.className = c; return d; }
  function skeleton(target, kind) {
    if (!target || !target.hidden) return;
    var status = document.getElementById('status');
    var sk = div('dw-skel'); sk.setAttribute('aria-hidden', 'true');
    var i;
    if (kind === 'cards') { sk.classList.add('dw-skel-cards'); for (i = 0; i < 6; i++) sk.appendChild(div('dw-skel-block')); }
    else { for (i = 0; i < 3; i++) sk.appendChild(div('dw-skel-block dw-skel-tile')); sk.appendChild(div('dw-skel-block dw-skel-wide')); }
    target.parentNode.insertBefore(sk, target);
    function check() {
      if (!target.hidden || (status && !status.hidden)) { if (sk.parentNode) sk.parentNode.removeChild(sk); obs.disconnect(); }
    }
    var obs = new MutationObserver(check);
    obs.observe(target, { attributes: true, attributeFilter: ['hidden'] });
    if (status) obs.observe(status, { attributes: true, attributeFilter: ['hidden'] });
  }
  skeleton(document.getElementById('list'), 'cards');
  skeleton(document.getElementById('live'), 'live');
})();
