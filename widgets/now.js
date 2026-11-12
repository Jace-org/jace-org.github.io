/* renderNow(container): one-line "Now" strip. Hidden when empty or on any error. */
(function () {
  function renderNow(container) {
    var H = window.Hub; if (!container || !H) return Promise.resolve();
    container.hidden = true;
    return H.get('now.json').then(function (d) {
      var text = H.str(d.text, 140);
      if (!text) return;
      H.clear(container);
      container.classList.add('dw-now');
      container.appendChild(H.el('span', 'tag', 'Now'));
      container.appendChild(H.el('span', 'txt', text));
      var u = H.ago(d.updated); if (u) container.appendChild(H.el('span', 'when', 'updated ' + u));
      container.hidden = false;
    }).catch(function () { container.hidden = true; });
  }
  window.renderNow = renderNow;
})();
