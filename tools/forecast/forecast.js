(function () {
  var L = window.Lab, status = document.getElementById('status'), list = document.getElementById('list');
  var CVE = /^CVE-\d{4}-\d{4,10}$/;

  function norm(r) {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !CVE.test(r.id)) return null;
    var e = L.num(r.epss), p = L.num(r.percentile), cv = L.num(r.cvss);
    return { id: r.id, title: L.str(r.title, 140), desc: L.str(r.desc, 260),
      cvss: cv !== null && cv >= 0 && cv <= 10 ? cv : null,
      epss: e !== null && e >= 0 && e <= 1 ? e : null, pct: p !== null && p >= 0 && p <= 1 ? p : null };
  }
  function weather(p) {
    if (p >= 0.5) return ['is-hot', 'Storm warning', 'More likely than not to be exploited. Patch first.'];
    if (p >= 0.1) return ['is-warm', 'Showers likely', 'A real chance of exploitation. Schedule the fix soon.'];
    if (p >= 0.01) return ['is-mild', 'Scattered clouds', 'Possible, but not expected. Patch in the normal cycle.'];
    return ['is-clear', 'Clear skies', 'Exploitation is unlikely in the next 30 days.'];
  }
  function card(c) {
    var li = L.el('li');
    var head = L.el('div', 'dw-meta');
    head.appendChild(L.el('span', 'lab-chip', c.id));
    if (c.cvss !== null) head.appendChild(L.el('span', 'lab-chip', 'CVSS ' + c.cvss.toFixed(1)));
    li.appendChild(head);
    if (c.epss === null) {
      li.appendChild(L.el('div', 'pct is-clear', '--'));
      li.appendChild(L.el('p', 'cond', 'Not scored yet'));
      li.appendChild(L.el('p', '', 'FIRST has not published a probability for this one, which is normal for a very new CVE.'));
    } else {
      var w = weather(c.epss), pc = c.epss * 100;
      li.appendChild(L.el('div', 'pct ' + w[0], (pc >= 10 ? pc.toFixed(0) : pc < 0.1 ? '<0.1' : pc.toFixed(1)) + '%'));
      li.appendChild(L.el('p', 'cond', w[1] + ' (' + (c.pct !== null ? 'riskier than ' + Math.round(c.pct * 100) + '% of CVEs' : 'percentile unknown') + ')'));
      var m = L.el('div', 'lab-meter'); var b = L.el('span'); b.style.width = Math.max(1, Math.min(100, pc)) + '%'; m.appendChild(b); li.appendChild(m);
      li.appendChild(L.el('p', '', w[2]));
    }
    if (c.title) li.appendChild(L.el('h3', '', c.title));
    if (c.desc && c.desc !== c.title) li.appendChild(L.el('p', '', c.desc));
    var href = L.safeHref('https://nvd.nist.gov/vuln/detail/' + encodeURIComponent(c.id), ['nvd.nist.gov']);
    if (href) li.appendChild(L.link(href, 'Official record for ' + c.id));
    return li;
  }

  window.Hub.get('forecast.json').then(function (d) {
    if (!Array.isArray(d.items)) throw new Error('bad items');
    var items = [];
    d.items.slice(0, 30).forEach(function (r) { var c = norm(r); if (c) items.push(c); });
    if (!items.length) throw new Error('no cves');
    items.sort(function (a, b) { return (b.epss === null ? -1 : b.epss) - (a.epss === null ? -1 : a.epss); });
    items.slice(0, 20).forEach(function (c) { list.appendChild(card(c)); });
    list.hidden = false;
    if (window.Hub.isStale(d.generated_at, 6)) L.status(status, 'This forecast may be out of date. It is refreshed every 30 minutes and the last update is older than expected.', 'is-warn');
    else L.status(status, 'Ranked by EPSS, highest chance first. Updated daily by FIRST.', '');
  }).catch(function () {
    list.hidden = true; L.status(status, 'The forecast is unavailable right now. Please try again later.', 'is-err');
  });
})();
