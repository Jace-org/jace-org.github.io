(function () {
  var H = window.Hub, status = document.getElementById('status'), list = document.getElementById('list');
  function say(msg, cls) { status.hidden = false; status.className = 'dw-status ' + (cls || ''); status.textContent = msg; }

  H.get('cves.json').then(function (d) {
    if (!Array.isArray(d.items)) throw new Error('bad items');
    var shown = 0;
    d.items.slice(0, 15).forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      var id = H.str(it.id, 32);
      if (!/^CVE-\d{4}-\d{4,10}$/.test(id)) return;
      var score = H.num(it.cvss);
      var summary = H.str(it.summary, 280);
      if (score === null || !summary) return;
      var li = H.el('li', 'dw-card dw-cve' + (score >= 9 ? ' is-crit' : ''));
      var head = H.el('div', 'dw-meta');
      head.appendChild(H.el('span', 'id', id));
      head.appendChild(H.el('span', 'dw-badge' + (score >= 9 ? '' : ' is-high'), 'CVSS ' + score.toFixed(1)));
      li.appendChild(head);
      li.appendChild(H.el('p', '', summary));
      var meta = H.el('div', 'dw-meta');
      var ago = H.ago(it.published);
      if (ago) { var t = H.el('time', '', 'Published ' + ago); var dt = H.date(it.published); if (dt) t.setAttribute('datetime', dt.toISOString()); meta.appendChild(t); }
      li.appendChild(meta);
      list.appendChild(li);
      shown++;
    });
    if (!shown) { say('No critical CVEs to show right now.', 'is-warn'); return; }
    list.hidden = false;
    if (H.isStale(d.generated_at, 3)) {
      var g = H.ago(d.generated_at);
      say('This list may be out of date' + (g ? ' (last updated ' + g + ')' : '') + '. Please check back soon.', 'is-warn');
    }
  }).catch(function () {
    say('The security feed is unavailable right now. Please try again later.', 'is-err');
  });
})();
