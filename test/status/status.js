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

var NS = 'http://www.w3.org/2000/svg', COL = { ok: '#6ff2c8', bad: '#d81f26', warn: '#ff7a1a', none: '#a6a6a6', info: '#2457e6' };
function badge(label, value, kind) {
  label = String(label).slice(0, 24); value = String(value).slice(0, 28);
  var lw = label.length * 7 + 14, vw = value.length * 7 + 14, s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 ' + (lw + vw) + ' 22'); s.setAttribute('width', lw + vw); s.setAttribute('height', 22); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label + ': ' + value);
  function rect(x, w, f) { var r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('width', w); r.setAttribute('height', 22); r.setAttribute('fill', f); return r; }
  function txt(x, t, f) { var e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', 15); e.setAttribute('fill', f); e.setAttribute('font-family', 'Archivo, Verdana, sans-serif'); e.setAttribute('font-size', 11); e.setAttribute('font-weight', 700); e.setAttribute('text-anchor', 'middle'); e.textContent = t; return e; }
  var cp = document.createElementNS(NS, 'clipPath'), id = 'c' + Math.random().toString(36).slice(2, 8), cr = document.createElementNS(NS, 'rect');
  cp.setAttribute('id', id); cr.setAttribute('width', lw + vw); cr.setAttribute('height', 22); cr.setAttribute('rx', 4); cp.appendChild(cr); s.appendChild(cp);
  var g = document.createElementNS(NS, 'g'); g.setAttribute('clip-path', 'url(#' + id + ')');
  g.appendChild(rect(0, lw, '#333333')); g.appendChild(rect(lw, vw, COL[kind] || COL.none));
  g.appendChild(txt(lw / 2, label, '#ffffff')); g.appendChild(txt(lw + vw / 2, value, '#111111')); s.appendChild(g); return s;
}
var rowsEl = document.getElementById('rows'); TL.status('Loading…', '');
TL.repos().then(function (repos) {
  var list = repos.slice(0, 5); if (!list.length) throw new Error('empty'); TL.status('', '');
  list.forEach(function (r) {
    var row = TL.el('div', 'tl-bgrow'), nm = TL.el('b'); nm.appendChild(TL.link(r.name, r.html_url, GH_HOSTS)); row.appendChild(nm); rowsEl.appendChild(row);
    var base = '/repos/' + GH_USER + '/' + r.name, age = Date.now() - Date.parse(r.pushed_at);
    row.appendChild(badge('last push', TL.ago(r.pushed_at), age < 30 * 864e5 ? 'ok' : age < 180 * 864e5 ? 'warn' : 'none'));
    var rel = badge('release', '…', 'none'), ci = badge('build', '…', 'none'); row.appendChild(rel); row.appendChild(ci);
    TL.gh(base + '/releases/latest').then(function (x) { rel.replaceWith(badge('release', x && typeof x.tag_name === 'string' && TL.ok(x.tag_name) ? x.tag_name : 'none', x && x.tag_name ? 'info' : 'none')); })
      .catch(function (e) { rel.replaceWith(badge('release', e && e.rate ? 'rate-limited' : 'none', 'none')); });
    TL.gh(base + '/actions/runs?per_page=1&status=completed').then(function (x) {
      var run = x && Array.isArray(x.workflow_runs) && x.workflow_runs[0];
      if (!run) { ci.replaceWith(badge('build', 'no CI', 'none')); return; }
      var c = String(run.conclusion || ''); ci.replaceWith(badge('build', c === 'success' ? 'passing' : c === 'failure' ? 'failing' : (c || 'unknown'), c === 'success' ? 'ok' : c === 'failure' ? 'bad' : 'warn'));
    }).catch(function (e) { ci.replaceWith(badge('build', e && e.rate ? 'rate-limited' : 'unknown', 'none')); });
  });
}).catch(function (e) { TL.status(TL.failMsg(e), e && e.rate ? 'warn' : 'err'); });

})();
