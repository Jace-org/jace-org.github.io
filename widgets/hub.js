/* Shared helpers for the data widgets. Vanilla, DOM text nodes only. */
(function () {
  var TIMEOUT_MS = 8000;

  function get(name) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    return fetch(window.DATA_BASE + name, {
      signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'default'
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!d || typeof d !== 'object' || Array.isArray(d) || d.schema !== 1) throw new Error('bad schema');
      return d;
    }).finally(function () { clearTimeout(timer); });
  }

  /* Returns a normalised URL string, or '' if not allowed. hosts: optional exact-host allowlist. */
  function safeUrl(u, hosts) {
    if (typeof u !== 'string' || u.length > 2048) return '';
    var p;
    try { p = new URL(u); } catch (e) { return ''; }
    if (p.protocol !== 'https:' && p.protocol !== 'http:') return '';
    if (p.username || p.password) return '';
    if (hosts && hosts.indexOf(p.hostname) === -1) return '';
    return p.href;
  }

  function str(v, max) {
    if (typeof v !== 'string') return '';
    return v.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max || 300).trim();
  }
  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }

  function date(v) {
    if (typeof v === 'number') { var t = new Date(v * (v < 1e12 ? 1000 : 1)); return isNaN(t) ? null : t; }
    if (typeof v !== 'string') return null;
    var d = new Date(v);
    return isNaN(d) ? null : d;
  }

  function ago(v) {
    var d = date(v);
    if (!d) return '';
    var s = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (s < 90) return 'just now';
    if (s < 5400) return Math.round(s / 60) + ' min ago';
    if (s < 129600) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' days ago';
  }

  function isStale(generatedAt, hours) {
    var d = date(generatedAt);
    return !d || (Date.now() - d.getTime()) > hours * 3600 * 1000;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function link(href, text, cls) {
    var a = el('a', cls, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow';
    return a;
  }

  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  window.Hub = { get: get, safeUrl: safeUrl, str: str, num: num, date: date, ago: ago, isStale: isStale, el: el, link: link, clear: clear };
})();
