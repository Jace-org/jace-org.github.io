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

var groups = document.getElementById('groups'); TL.status('Loading…', '');
TL.repos().then(function (repos) {
  var list = repos.slice(0, 5), done = 0, any = 0;
  if (!list.length) throw new Error('empty');
  list.forEach(function (r) {
    var g = TL.el('section', 'tl-group'), h = TL.el('h3'); h.appendChild(TL.link(r.name, r.html_url, GH_HOSTS));
    var rows = TL.el('div', 'tl-list'); g.appendChild(h); g.appendChild(rows); groups.appendChild(g);
    var base = '/repos/' + GH_USER + '/' + r.name;
    Promise.all([TL.gh(base + '/releases?per_page=3').catch(function () { return []; }), TL.gh(base + '/commits?per_page=4').catch(function (e) { if (e && e.rate) throw e; return []; })])
      .then(function (res) {
        (Array.isArray(res[0]) ? res[0] : []).forEach(function (x) {
          if (!x || x.draft || !TL.ok([x.name, x.tag_name])) return; any++;
          var row = TL.el('div', 'tl-row'); row.appendChild(TL.el('span', 'tl-tag', String(x.tag_name || 'release').slice(0, 30)));
          row.appendChild(TL.link(String(x.name || x.tag_name || 'Release').slice(0, 80), x.html_url, GH_HOSTS)); row.appendChild(TL.el('time', '', TL.day(x.published_at))); rows.appendChild(row);
        });
        (Array.isArray(res[1]) ? res[1] : []).forEach(function (c) {
          if (!c || !c.commit || !TL.ok(c.commit.message)) return; any++;
          var row = TL.el('div', 'tl-row'); row.appendChild(TL.link(String(c.commit.message || '').split('\n')[0].slice(0, 110) || 'commit', c.html_url, GH_HOSTS));
          row.appendChild(TL.el('time', '', TL.day(c.commit.author && c.commit.author.date))); rows.appendChild(row);
        });
        if (!rows.children.length) rows.appendChild(TL.el('p', 'dw-note', 'Nothing to show.'));
      }).catch(function (e) { rows.appendChild(TL.el('p', 'dw-note', e && e.rate ? 'Rate limit reached for this project.' : 'Could not load this project.')); })
      .then(function () { if (++done === list.length) TL.status(any ? '' : 'No recent activity could be loaded.', any ? '' : 'warn'); });
  });
  TL.status('', '');
}).catch(function (e) { TL.status(TL.failMsg(e), e && e.rate ? 'warn' : 'err'); });

})();
