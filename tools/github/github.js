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
  /* GitHub API: path must start with / ; cached in sessionStorage for 10 minutes. */
  gh: function (path) {
    if (!/^\/[A-Za-z0-9_\/.?=&%-]+$/.test(path)) return Promise.reject(new Error('bad path'));
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

function stat(host, num, say) { var f = TL.el('div', 'fact'); f.appendChild(TL.el('p', 'fact-num', num)); f.appendChild(TL.el('p', 'fact-say', say)); host.appendChild(f); }
TL.status('Loading…', '');
TL.repos().then(function (repos) {
  if (!repos.length) throw new Error('empty');
  var top = repos[0], stats = document.getElementById('stats');
  stat(stats, repos.length, 'public repositories (own work)');
  stat(stats, TL.ago(top.pushed_at), 'since the last push, to ' + top.name);
  var langs = {}; repos.forEach(function (r) { var l = typeof r.language === 'string' ? r.language.slice(0, 24) : 'Other'; langs[l] = (langs[l] || 0) + 1; });
  var ks = Object.keys(langs).sort(function (a, b) { return langs[b] - langs[a]; });
  stat(stats, ks.length, 'languages across them');
  var bar = document.getElementById('bar'), lg = document.getElementById('legend');
  ks.forEach(function (k, i) {
    var s = TL.el('span', 'tl-c' + (i % 6)); s.style.width = (langs[k] / repos.length * 100) + '%'; s.title = k; bar.appendChild(s);
    var li = TL.el('span'); var dot = TL.el('i', 'tl-c' + (i % 6)); li.appendChild(dot); li.appendChild(document.createTextNode(k + ' ' + langs[k])); lg.appendChild(li);
  });
  var rc = document.getElementById('recent');
  repos.slice(0, 6).forEach(function (r) {
    var row = TL.el('div', 'tl-row'); row.appendChild(TL.link(r.name, r.html_url, GH_HOSTS));
    row.appendChild(TL.el('span', 'tl-m', (typeof r.language === 'string' ? r.language : 'n/a')));
    var t = TL.el('time', '', 'pushed ' + TL.ago(r.pushed_at)); row.appendChild(t); rc.appendChild(row);
  });
  document.getElementById('live').hidden = false; TL.status('', '');
  /* last commit message for the top repo + releases for the 3 newest (4 extra requests, cached). */
  TL.gh('/repos/' + GH_USER + '/' + top.name + '/commits?per_page=1').then(function (c) {
    if (!Array.isArray(c) || !c[0] || !c[0].commit || !TL.ok(c[0].commit.message)) return;
    var msg = String(c[0].commit.message || '').split('\n')[0].slice(0, 120);
    var date = c[0].commit.author && c[0].commit.author.date;
    var row = TL.el('div', 'tl-row'); row.appendChild(TL.el('span', 'tl-tag', 'Last commit'));
    row.appendChild(TL.link(msg || 'commit', c[0].html_url, GH_HOSTS)); row.appendChild(TL.el('time', '', top.name + ' · ' + TL.ago(date)));
    rc.insertBefore(row, rc.firstChild);
  }).catch(function () {});
  var rels = document.getElementById('rels'), pending = 0, got = 0;
  repos.slice(0, 3).forEach(function (r) {
    pending++;
    TL.gh('/repos/' + GH_USER + '/' + r.name + '/releases?per_page=2').then(function (a) {
      (Array.isArray(a) ? a : []).forEach(function (x) {
        if (!x || x.draft || !TL.ok([x.name, x.tag_name])) return; got++;
        var row = TL.el('div', 'tl-row'); row.appendChild(TL.el('span', 'tl-tag', String(x.tag_name || '').slice(0, 30)));
        row.appendChild(TL.link(r.name + ' ' + String(x.name || x.tag_name || '').slice(0, 60), x.html_url, GH_HOSTS));
        row.appendChild(TL.el('time', '', TL.day(x.published_at))); rels.appendChild(row);
      });
    }).catch(function () {}).then(function () { if (--pending === 0 && !got) document.getElementById('norel').hidden = false; });
  });
}).catch(function (e) { TL.status(TL.failMsg(e), e && e.rate ? 'warn' : 'err'); });

})();
