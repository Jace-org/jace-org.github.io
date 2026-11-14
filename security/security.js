(function () {
  var H = window.Hub, status = document.getElementById('status'), list = document.getElementById('list');
  var intro = document.getElementById('intro'), detail = document.getElementById('detail');
  var ID_RE = /^CVE-\d{4}-\d{4,10}$/;
  var baseTitle = document.title;
  var descMeta = document.querySelector('meta[name="description"]');
  var baseDesc = descMeta ? descMeta.getAttribute('content') : '';
  var items = [], byId = {}, cardLinks = {}, lastId = '', loaded = false, listBuilt = false, staleMsg = '';

  function say(msg, cls) { status.hidden = false; status.className = 'dw-status ' + (cls || ''); status.textContent = msg; }
  function hideStatus() { status.hidden = true; }
  function sev(score) { return score >= 9 ? '' : ' is-high'; }
  function timeEl(it) {
    var ago = H.ago(it.published);
    if (!ago) return null;
    var t = H.el('time', '', 'Published ' + ago);
    var dt = H.date(it.published);
    if (dt) t.setAttribute('datetime', dt.toISOString());
    return t;
  }
  function hrefFor(id) { return '?cve=' + encodeURIComponent(id); }

  function currentId() {
    var m = /[?&]cve=([^&#]*)/.exec(location.search);
    if (!m) return null;
    var v = '';
    try { v = decodeURIComponent(m[1]); } catch (e) { return ''; }
    return ID_RE.test(v) ? v : '';
  }

  function setMeta(title, desc) {
    document.title = title;
    if (descMeta) descMeta.setAttribute('content', desc);
  }

  function go(id, e) {
    if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    if (e) e.preventDefault();
    history.pushState(null, '', id ? hrefFor(id) : location.pathname);
    route(true);
  }

  function navLink(it, label, cls) {
    var a = H.el('a', 'dw-nav-link ' + cls);
    a.href = hrefFor(it.id);
    a.appendChild(H.el('span', 'dw-nav-dir', label));
    a.appendChild(H.el('span', 'dw-nav-id', it.id));
    a.addEventListener('click', function (e) { go(it.id, e); });
    return a;
  }

  function backLink() {
    var a = H.el('a', 'dw-back', '← Back to Security Wire');
    a.href = location.pathname;
    a.addEventListener('click', function (e) { go(null, e); });
    return a;
  }

  function showList() {
    detail.hidden = true; H.clear(detail);
    intro.hidden = false;
    setMeta(baseTitle, baseDesc);
    if (staleMsg) say(staleMsg, 'is-warn'); else hideStatus();
    list.hidden = !listBuilt;
  }

  function showDetail(id, moveFocus) {
    var it = byId[id];
    intro.hidden = true; list.hidden = true; hideStatus();
    H.clear(detail);
    detail.hidden = false;
    var h;
    if (!it) {
      h = H.el('h1', 'dw-detail-h', 'Entry not found');
      h.tabIndex = -1;
      detail.appendChild(backLink());
      detail.appendChild(h);
      detail.appendChild(H.el('p', 'dw-detail-sum', id
        ? 'We could not find ' + id + ' in the current list. The wire only keeps recent critical entries, so older ones drop off.'
        : 'That link does not look like a valid CVE identifier.'));
      setMeta('Entry not found — Security Wire', 'This entry is not in the current Security Wire list.');
    } else {
      detail.appendChild(backLink());
      detail.appendChild(H.el('p', 'dw-detail-kicker', 'Critical vulnerability'));
      h = H.el('h1', 'dw-detail-h', it.id);
      h.tabIndex = -1;
      detail.appendChild(h);
      var meta = H.el('div', 'dw-meta dw-detail-meta');
      meta.appendChild(H.el('span', 'dw-badge' + sev(it.score), 'CVSS ' + it.score.toFixed(1)));
      var t = timeEl(it); if (t) meta.appendChild(t);
      detail.appendChild(meta);
      detail.appendChild(H.el('p', 'dw-detail-sum', it.full));
      detail.appendChild(H.el('p', 'dw-note dw-detail-note', 'A CVSS score measures technical severity, not whether a flaw is being exploited. Treat it as one signal, not a verdict.'));
      var i = items.indexOf(it), nav = H.el('nav', 'dw-detail-nav');
      nav.setAttribute('aria-label', 'Other entries');
      if (i > 0) nav.appendChild(navLink(items[i - 1], '← Newer', 'is-prev'));
      if (i < items.length - 1) nav.appendChild(navLink(items[i + 1], 'Older →', 'is-next'));
      if (nav.firstChild) detail.appendChild(nav);
      setMeta(it.id + ' — Security Wire', 'CVSS ' + it.score.toFixed(1) + ' critical vulnerability ' + it.id + '. ' + it.full.slice(0, 140));
      lastId = it.id;
    }
    // restart the entrance animation
    detail.classList.remove('is-in'); void detail.offsetWidth; detail.classList.add('is-in');
    if (moveFocus) { window.scrollTo(0, 0); h.focus({ preventScroll: true }); }
  }

  function route(moveFocus) {
    if (!loaded) return;
    var id = currentId();
    if (id === null) {
      showList();
      if (moveFocus) {
        var c = cardLinks[lastId];
        if (c) c.focus({ preventScroll: false }); else window.scrollTo(0, 0);
      }
    } else {
      showDetail(id, moveFocus);
    }
  }

  function buildList() {
    items.slice(0, 15).forEach(function (it) {
      var li = H.el('li', 'dw-card dw-cve' + (it.score >= 9 ? ' is-crit' : ''));
      var head = H.el('div', 'dw-meta');
      var idEl = H.el('span', 'id');
      var a = H.el('a', 'dw-cardlink', it.id);
      a.href = hrefFor(it.id);
      a.addEventListener('click', function (e) { go(it.id, e); });
      idEl.appendChild(a);
      cardLinks[it.id] = a;
      head.appendChild(idEl);
      head.appendChild(H.el('span', 'dw-badge' + sev(it.score), 'CVSS ' + it.score.toFixed(1)));
      li.appendChild(head);
      li.appendChild(H.el('p', '', it.short));
      var meta = H.el('div', 'dw-meta');
      var t = timeEl(it); if (t) meta.appendChild(t);
      meta.appendChild(H.el('span', 'dw-more', 'Read more →'));
      li.appendChild(meta);
      list.appendChild(li);
    });
    listBuilt = items.length > 0;
  }

  window.addEventListener('popstate', function () { route(true); });

  H.get('cves.json').then(function (d) {
    if (!Array.isArray(d.items)) throw new Error('bad items');
    d.items.forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      var id = H.str(it.id, 32);
      if (!ID_RE.test(id) || byId[id]) return;
      var score = H.num(it.cvss);
      var full = H.str(it.summary, 1200);
      if (score === null || !full) return;
      var rec = { id: id, score: score, full: full, short: H.str(it.summary, 280), published: it.published };
      byId[id] = rec; items.push(rec);
    });
    if (H.isStale(d.generated_at, 3)) {
      var g = H.ago(d.generated_at);
      staleMsg = 'This list may be out of date' + (g ? ' (last updated ' + g + ')' : '') + '. Please check back soon.';
    }
    loaded = true;
    var sk = document.querySelector('.dw-skel'); if (sk && sk.parentNode) sk.parentNode.removeChild(sk);
    buildList();
    if (!items.length && currentId() === null) { say('No critical CVEs to show right now.', 'is-warn'); return; }
    route(false);
  }).catch(function () {
    say('The security feed is unavailable right now. Please try again later.', 'is-err');
  });
})();
