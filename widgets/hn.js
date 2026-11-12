/* renderHN(container): "Hacker News top tech" card list. Needs data-base.js + hub.js loaded first. */
(function () {
  function renderHN(container) {
    var H = window.Hub; if (!container || !H) return Promise.resolve();
    container.hidden = true;
    return H.get('hn.json').then(function (d) {
      if (!Array.isArray(d.items)) throw new Error('bad items');
      H.clear(container);
      container.classList.add('dw-hn');
      var h = H.el('h2', 'dw-h', 'Hacker News: top tech right now'); container.appendChild(h);
      var ul = H.el('ul', 'dw-cards'), n = 0;
      d.items.slice(0, 12).forEach(function (it) {
        if (!it || typeof it !== 'object') return;
        var title = H.str(it.title, 200), url = H.safeUrl(it.url);
        var hn = H.safeUrl(it.hn_url, ['news.ycombinator.com']);
        if (!title || !url) return;
        var li = H.el('li', 'dw-card');
        var h3 = H.el('h3'); h3.appendChild(H.link(url, title, '')); li.appendChild(h3);
        var m = H.el('div', 'dw-meta');
        var host = H.str(it.host, 80); if (host) m.appendChild(H.el('span', '', host));
        var sc = H.num(it.score); if (sc !== null) m.appendChild(H.el('span', 'score', sc + ' pts'));
        var ago = H.ago(it.time); if (ago) m.appendChild(H.el('span', '', ago));
        var c = H.num(it.comments);
        if (hn) m.appendChild(H.link(hn, (c === null ? 'Discuss' : c + ' comments'), ''));
        li.appendChild(m); ul.appendChild(li); n++;
      });
      if (!n) return;
      container.appendChild(ul);
      if (H.isStale(d.generated_at, 3)) container.appendChild(H.el('p', 'dw-note', 'This list may be out of date.'));
      container.hidden = false;
    }).catch(function () { container.hidden = true; });
  }
  window.renderHN = renderHN;
})();
