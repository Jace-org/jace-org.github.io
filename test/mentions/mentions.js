/* Webmentions wall: untrusted data from webmention.io, rendered with textContent only. */
(function () {
  'use strict';
  var SITE = 'https://jhapendrakandel.com.np';
  var API = 'https://webmention.io/api/mentions.jf2';
  var params = new URLSearchParams(location.search);
  var fixture = params.get('fixtures');
  var $ = function (id) { return document.getElementById(id); };
  var status = $('status'), live = $('live');

  var SNIPPET = '<link rel="webmention" href="https://webmention.io/jhapendrakandel.com.np/webmention" />\n<link rel="pingback" href="https://webmention.io/jhapendrakandel.com.np/xmlrpc" />';
  $('snippet').textContent = SNIPPET;
  $('copy').addEventListener('click', function () {
    var b = $('copy');
    function done(t) { b.textContent = t; setTimeout(function () { b.textContent = 'Copy snippet'; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(SNIPPET).then(function () { done('Copied'); }, function () { done('Select and copy by hand'); });
    else done('Select and copy by hand');
  });

  function getJSON(url) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
    return fetch(url, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }
  function cap(s, n) { s = typeof s === 'string' ? s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '') : ''; return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function httpsUrl(u) { if (typeof u !== 'string' || u.length > 500) return null; try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } }
  function say(msg, cls) { status.hidden = false; status.className = 'dw-status ' + (cls || ''); status.textContent = msg; }

  var KIND = { 'like-of': ['Like', 'like'], 'repost-of': ['Repost', 'repost'], 'in-reply-to': ['Reply', 'reply'], 'mention-of': ['Mention', ''], 'bookmark-of': ['Bookmark', ''] };

  function cleanTitle(t) { return cap(t, 120).replace(/the ABC News site/gi, 'a news site').replace(/ABC News/gi, 'a news site'); }

  function targetsFor(posts) {
    var t = [], titles = {};
    posts.forEach(function (p) {
      if (!p || typeof p.slug !== 'string' || !/^[a-z0-9-]{1,80}$/.test(p.slug)) return;
      var a = SITE + '/blog/' + p.slug, b = SITE + '/blog/posts/' + p.slug + '/';
      t.push(a, b); titles[a] = titles[b] = cleanTitle(p.title);
    });
    return { list: t, titles: titles };
  }

  function normalize(j) {
    if (!j || !Array.isArray(j.children)) throw new Error('shape');
    return j.children.slice(0, 200).map(function (c) {
      if (!c || typeof c !== 'object') return null;
      var k = KIND[c['wm-property']] || ['Mention', ''];
      var au = c.author && typeof c.author === 'object' ? c.author : {};
      return {
        kind: k, name: cap(au.name, 60) || 'Someone', author: httpsUrl(au.url), url: httpsUrl(c.url),
        text: cap(c.content && c.content.text, 280), target: typeof c['wm-target'] === 'string' ? c['wm-target'].slice(0, 300) : '',
        when: typeof c['wm-received'] === 'string' ? cap(c['wm-received'].slice(0, 10), 10) : ''
      };
    }).filter(Boolean);
  }

  function card(m, titles) {
    var li = document.createElement('li'); li.className = 'dw-card';
    var who = document.createElement('div'); who.className = 'm-who';
    var av = document.createElement('span'); av.className = 'm-av'; av.setAttribute('aria-hidden', 'true'); av.textContent = (Array.from(m.name)[0] || '?').toUpperCase();
    var nm = document.createElement('h3'); nm.textContent = m.name;
    who.appendChild(av); who.appendChild(nm); li.appendChild(who);
    var tag = document.createElement('span'); tag.className = 'm-type ' + m.kind[1]; tag.textContent = m.kind[0]; li.appendChild(tag);
    if (m.text) { var p = document.createElement('p'); p.textContent = m.text; li.appendChild(p); }
    var post = document.createElement('p'); post.className = 'm-post';
    post.textContent = 'On: ' + (titles[m.target] || 'a post on this site') + (m.when ? ' · ' + m.when : '');
    li.appendChild(post);
    if (m.url) { var a = document.createElement('a'); a.href = m.url; a.rel = 'noopener nofollow ugc'; a.target = '_blank'; a.textContent = 'See it at the source'; li.appendChild(a); }
    return li;
  }

  function stat(num, say_, cls) {
    var li = document.createElement('div'); li.className = 'fact ' + cls;
    var n = document.createElement('span'); n.className = 'fact-num'; n.textContent = String(num);
    var s = document.createElement('span'); s.className = 'fact-say'; s.textContent = say_;
    li.appendChild(n); li.appendChild(s); return li;
  }
  function render(items, titles) {
    live.hidden = false;
    var by = { 'Like': 0, 'Reply': 0, 'Repost': 0 };
    items.forEach(function (m) { if (by[m.kind[0]] !== undefined) by[m.kind[0]]++; });
    var st = $('stats'); st.textContent = '';
    st.appendChild(stat(items.length, 'Mentions in total', 'fact-yellow'));
    st.appendChild(stat(by.Reply, 'Replies', 'fact-orange'));
    st.appendChild(stat(by.Like + by.Repost, 'Likes and reposts', 'fact-mint'));
    var wall = $('wall'); wall.textContent = '';
    $('empty').hidden = items.length > 0;
    items.forEach(function (m) { wall.appendChild(card(m, titles)); });
  }

  var postsUrl = fixture ? 'fixtures/posts.json' : '../../blog/posts.json';
  getJSON(postsUrl).then(function (posts) {
    if (!Array.isArray(posts)) throw new Error('posts');
    var t = targetsFor(posts);
    if (!t.list.length) throw new Error('none');
    $('watching').textContent = (t.list.length / 2) + ' blog posts (each under two address forms).';
    var url = fixture ? 'fixtures/mentions-' + (/^[a-z]{1,12}$/.test(fixture) ? fixture : 'ok') + '.json'
      : API + '?per-page=100&sort-dir=down&' + t.list.map(function (u) { return 'target[]=' + encodeURIComponent(u); }).join('&');
    return getJSON(url).then(function (j) { render(normalize(j), t.titles); });
  }).catch(function () {
    live.hidden = true;
    $('watching').textContent = 'could not load the post list.';
    say('The mentions service did not answer in time, or returned something unexpected. Nothing is wrong with this site; try again later.', 'is-warn');
  });

  (function () {
    var b = $('menu-btn'), n = $('nav-links'); if (!b || !n) return;
    function set(o) { n.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Close' : 'Menu'; }
    b.addEventListener('click', function () { set(!n.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('open')) { set(false); b.focus(); } });
  })();
})();
