/* renderHN(container): "Tech news" card list. Needs data-base.js + hub.js loaded first. */
(function () {
  function renderHN(container) {
    var H = window.Hub; if (!container || !H) return Promise.resolve();
    container.hidden = true;
    return H.get('hn.json').then(function (d) {
      if (!Array.isArray(d.items)) throw new Error('bad items');
      H.clear(container);
      container.classList.add('dw-hn');
      var h = H.el('h2', 'dw-h', 'Tech news'); container.appendChild(h);
      var ul = H.el('ul', 'dw-cards'), n = 0;
      d.items.slice(0, 12).forEach(function (it) {
        if (!it || typeof it !== 'object') return;
        var title = H.str(it.title, 200);
        if (!title) return;
        var li = H.el('li', 'dw-card');
        li.appendChild(H.el('h3', '', title));
        var m = H.el('div', 'dw-meta');
        var ago = H.ago(it.time); if (ago) m.appendChild(H.el('span', '', ago));
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
