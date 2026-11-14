(function () {
'use strict';
/* Shared helpers (copied into each tool; no cross-tool dependency). */
var GH_USER = 'jhapendra-kandel';
var TL = {
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
    if (!msg && TL.stale) { msg = 'Showing the last saved copy; it may be out of date.'; kind = 'warn'; }
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
  /* GitHub data: read from the site's data service (github.json), never from the browser to GitHub.
     The file mimics the GitHub REST objects these tools already use, so the paths below map straight onto it. */
  stale: false, _gh: null,
  ghData: function () {
    if (!TL._gh) TL._gh = window.Hub.get('github.json').then(function (d) {
      if (!d || !Array.isArray(d.repos) || !d.details || typeof d.details !== 'object') throw new Error('shape');
      TL.stale = window.Hub.isStale(d.generated_at, 6); return d;
    }).catch(function (e) { TL._gh = null; throw e; });
    return TL._gh;
  },
  gh: function (path) {
    return TL.ghData().then(function (d) {
      if (/^\/users\/[A-Za-z0-9_-]+\/repos(\?|$)/.test(path)) return d.repos;
      var m = /^\/repos\/[A-Za-z0-9_-]+\/([A-Za-z0-9_.-]+)\/(commits|releases\/latest|releases|actions\/runs)(\?.*)?$/.exec(path);
      if (!m) throw new Error('bad path');
      var x = Object.prototype.hasOwnProperty.call(d.details, m[1]) ? d.details[m[1]] : null, n = /per_page=(\d+)/.exec(m[3] || '');
      n = n ? parseInt(n[1], 10) : 30;
      if (m[2] === 'commits') return x && Array.isArray(x.commits) ? x.commits.slice(0, n) : [];
      if (m[2] === 'releases') return x && Array.isArray(x.releases) ? x.releases.slice(0, n) : [];
      if (m[2] === 'releases/latest') { if (x && x.latest_release) return x.latest_release; throw new Error('http 404'); }
      return { workflow_runs: x && x.ci ? [x.ci] : [] };
    });
  },
  repos: function () {
    return TL.gh('/users/' + GH_USER + '/repos?per_page=100&sort=pushed').then(function (a) {
      if (!Array.isArray(a)) throw new Error('shape');
      return a.filter(function (r) { return r && typeof r.name === 'string' && /^[A-Za-z0-9_.-]+$/.test(r.name) && !r.fork && !r.archived && TL.ok(r.name); });
    });
  },
  failMsg: function () { return 'The data could not be loaded just now (network error or timeout). Try again later.'; }
};
var GH_HOSTS = ['github.com'];

var TAGS = ['security', 'python', 'linux'], HOSTS = ['dev.to'], cur = 'security';
var tabs = document.getElementById('tabs'), cards = document.getElementById('cards');
function render(list) {
  cards.textContent = '';
  list.forEach(function (a) {
    if (!a || typeof a.title !== 'string' || !TL.ok([a.title, a.description])) return;
    var c = TL.el('article', 'dw-card'); var h = TL.el('h3'); h.appendChild(TL.link(a.title.slice(0, 160), a.url, HOSTS)); c.appendChild(h);
    if (typeof a.description === 'string') c.appendChild(TL.el('p', '', a.description.slice(0, 220)));
    var m = TL.el('div', 'dw-meta'); m.appendChild(TL.el('span', '', (a.user && typeof a.user.name === 'string' ? a.user.name.slice(0, 60) : 'unknown')));
    m.appendChild(TL.el('span', '', TL.day(a.published_at))); if (typeof a.reading_time_minutes === 'number') m.appendChild(TL.el('span', '', a.reading_time_minutes + ' min read'));
    c.appendChild(m); cards.appendChild(c);
  });
  if (!cards.children.length) TL.status('No articles returned for this tag.', 'warn');
}
function load(tag) {
  cur = tag; TL.status('Loading…', ''); cards.textContent = '';
  Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-pressed', String(b.textContent === tag)); });
  if (TAGS.indexOf(tag) < 0) return;
  window.Hub.get('devto.json').then(function (d) {
    if (tag !== cur) return;
    var list = d && d.tags && Object.prototype.hasOwnProperty.call(d.tags, tag) ? d.tags[tag] : null;
    if (!Array.isArray(list)) throw new Error('shape');
    TL.status('', ''); render(list);
    if (window.Hub.isStale(d.generated_at, 6)) TL.status('Showing the last saved copy; it may be out of date.', 'warn');
  }).catch(function (e) { if (tag === cur) TL.status(TL.failMsg(e).replace('The data', 'The articles'), 'err'); });
}
TAGS.forEach(function (t) { var b = TL.el('button', '', t); b.type = 'button'; b.addEventListener('click', function () { load(t); }); tabs.appendChild(b); });
load(cur);

})();
