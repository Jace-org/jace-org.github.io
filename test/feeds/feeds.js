(function () {
'use strict';
/* Shared helpers (copied into each tool; no cross-tool dependency). */
var GH_USER = 'jhapendra-kandel';
var TL = {
  sim: (function () { try { return new URLSearchParams(location.search).get('sim') || ''; } catch (e) { return ''; } })(),
  /* third-party text is never shown if it mentions the excluded name */
  ok: function (v) { return !/abc/i.test(typeof v === 'string' ? v : JSON.stringify(v)); },
  el: function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = String(text); return n; },
  /* Only https links to hosts we expect are ever placed in href. */
  safeUrl: function (u, hosts) {
    try { var x = new URL(String(u)); if (x.protocol !== 'https:' || hosts.indexOf(x.hostname) < 0) return null; return x.href; } catch (e) { return null; }
  },
  link: function (text, url, hosts) {
    var h = TL.safeUrl(url, hosts), a;
    if (!h) return TL.el('span', '', text);
    a = TL.el('a', '', text); a.href = h; a.rel = 'noopener noreferrer'; a.target = '_blank'; return a;
  },
  status: function (msg, kind) {
    var s = document.getElementById('status'); if (!s) return;
    s.textContent = msg; s.className = 'dw-status' + (kind ? ' is-' + kind : ''); s.hidden = !msg;
  },
  ago: function (iso) {
    var t = Date.parse(iso); if (isNaN(t)) return 'unknown';
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 60) return m + ' min ago'; var h = Math.round(m / 60);
    if (h < 48) return h + ' h ago'; var d = Math.round(h / 24);
    if (d < 60) return d + ' days ago'; return Math.round(d / 30) + ' months ago';
  },
  day: function (iso) { var t = Date.parse(iso); return isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10); },
  /* fetch JSON with 8 s timeout. */
  getJSON: function (url, withHeaders) {
    var c = new AbortController(), timer = setTimeout(function () { c.abort(); }, 8000);
    return fetch(url, { signal: c.signal, headers: { 'Accept': 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (r) {
        clearTimeout(timer);
        if (r.status === 403 || r.status === 429) { var e = new Error('rate'); e.rate = true; throw e; }
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json().then(function (j) { return withHeaders ? { json: j, headers: r.headers } : j; });
      }, function (e) { clearTimeout(timer); throw e; });
  },
  /* GitHub API: path must start with / ; cached in sessionStorage for 10 minutes; ?sim=rate|fail for tests. */
  gh: function (path) {
    if (!/^\/[A-Za-z0-9_\/.?=&%-]+$/.test(path)) return Promise.reject(new Error('bad path'));
    if (TL.sim === 'rate') { var e = new Error('rate'); e.rate = true; return Promise.reject(e); }
    if (TL.sim === 'fail') return Promise.reject(new Error('fail'));
    var key = 'tl:gh:' + path, now = Date.now();
    try { var c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && now - c.t < 600000) return Promise.resolve(c.d); } catch (x) {}
    return TL.getJSON('https://api.github.com' + path).then(function (d) {
      try { sessionStorage.setItem(key, JSON.stringify({ t: now, d: d })); } catch (x) {}
      return d;
    });
  },
  repos: function () {
    return TL.gh('/users/' + GH_USER + '/repos?per_page=100&sort=pushed').then(function (a) {
      if (!Array.isArray(a)) throw new Error('shape');
      return a.filter(function (r) { return r && typeof r.name === 'string' && /^[A-Za-z0-9_.-]+$/.test(r.name) && !r.fork && !r.archived && TL.ok(r.name); });
    });
  },
  failMsg: function (e) {
    return e && e.rate ? 'The public code service is rate-limiting this browser (60 requests per hour without a key). Try again later; nothing is broken on this page.'
                       : 'The data could not be loaded just now (network error or timeout). Try again later.';
  }
};
var GH_HOSTS = ['github.com'];

var ORIGIN = 'https://jhapendrakandel.com.np';
function esc(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function build(posts) {
  var p = posts.filter(function (x) { return x && !/abc/i.test(JSON.stringify(x)) && /^[a-z0-9-]+$/.test(String(x.slug)) && !isNaN(Date.parse(x.date)); }).sort(function (a, b) { return Date.parse(b.date) - Date.parse(a.date); }).slice(0, 20);
  var out = ['<?xml version="1.0" encoding="utf-8"?>', '<feed xmlns="http://www.w3.org/2005/Atom">', '  <title>Jhapendra Kandel — Blog</title>',
    '  <link href="' + ORIGIN + '/blog/"/>', '  <link rel="self" href="' + ORIGIN + '/blog/feed.xml"/>', '  <id>' + ORIGIN + '/blog/</id>',
    '  <updated>' + (p.length ? new Date(Date.parse(p[0].date)).toISOString() : new Date(0).toISOString()) + '</updated>', '  <author><name>Jhapendra Kandel</name></author>'];
  p.forEach(function (x) {
    var u = ORIGIN + '/blog/posts/' + x.slug + '/';
    out.push('  <entry>', '    <title>' + esc(x.title) + '</title>', '    <link href="' + u + '"/>', '    <id>' + u + '</id>',
      '    <updated>' + new Date(Date.parse(x.date)).toISOString() + '</updated>');
    (Array.isArray(x.tags) ? x.tags : []).slice(0, 8).forEach(function (t) { out.push('    <category term="' + esc(t) + '"/>'); });
    out.push('    <summary>' + esc(x.excerpt) + '</summary>', '  </entry>');
  });
  out.push('</feed>'); return out.join('\n') + '\n';
}
var pre = document.getElementById('xml'); TL.status('Loading…', '');
(TL.sim === 'fail' ? Promise.reject(new Error('fail')) : TL.getJSON('../../blog/posts.json')).then(function (posts) {
  if (!Array.isArray(posts)) throw new Error('shape');
  var xml = build(posts); pre.textContent = xml; TL.status('', '');
  var b = document.getElementById('dl'); b.hidden = false;
  b.addEventListener('click', function () {
    var url = URL.createObjectURL(new Blob([xml], { type: 'application/atom+xml' })), a = document.createElement('a');
    a.href = url; a.download = 'feed.xml'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });
}).catch(function (e) { pre.textContent = '(feed unavailable)'; TL.status('The post index could not be loaded.', 'err'); });

})();
