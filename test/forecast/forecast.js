(function () {
  var L = window.Lab, status = document.getElementById('status'), list = document.getElementById('list');
  var CIRCL = ['cve.circl.lu'], FIRST = ['api.first.org'], CVE = /^CVE-\d{4}-\d{4,10}$/;

  function pickScore(rec) {
    var best = null;
    function scan(metrics) {
      if (!Array.isArray(metrics)) return;
      metrics.forEach(function (m) {
        if (!m || typeof m !== 'object') return;
        ['cvssV4_0', 'cvssV3_1', 'cvssV3_0'].forEach(function (k) {
          var s = m[k] && L.num(m[k].baseScore);
          if (s !== null && s >= 0 && s <= 10 && (best === null || s > best)) best = s;
        });
      });
    }
    var c = rec.containers || {};
    if (c.cna) scan(c.cna.metrics);
    if (Array.isArray(c.adp)) c.adp.forEach(function (a) { if (a) scan(a.metrics); });
    return best;
  }
  function extract(rec) {
    if (!rec || typeof rec !== 'object') return null;
    var id = rec.cveMetadata && rec.cveMetadata.cveId, cna = rec.containers && rec.containers.cna || {};
    if (typeof id !== 'string') {
      var al = Array.isArray(rec.aliases) ? rec.aliases : [];
      id = al.filter(function (a) { return typeof a === 'string' && CVE.test(a); })[0];
    }
    if (typeof id !== 'string' || !CVE.test(id)) return null;
    var d = '';
    if (Array.isArray(cna.descriptions) && cna.descriptions[0]) d = L.str(cna.descriptions[0].value, 260);
    if (!d) d = L.str(rec.summary || rec.details || '', 260);
    var title = L.str(cna.title || rec.summary || '', 140);
    var pub = (rec.cveMetadata && rec.cveMetadata.datePublished) || rec.published || '';
    return { id: id, title: title, desc: d, cvss: pickScore(rec), pub: L.str(pub, 40) };
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

  L.fetch('https://cve.circl.lu/api/last', CIRCL).then(function (arr) {
    if (!Array.isArray(arr)) throw new Error('bad list');
    var seen = {}, items = [];
    arr.slice(0, 60).forEach(function (r) { var c = extract(r); if (c && !seen[c.id]) { seen[c.id] = 1; items.push(c); } });
    if (!items.length) throw new Error('no cves');
    items = items.slice(0, 30);
    var ids = items.map(function (c) { return c.id; }).join(',');
    return L.fetch('https://api.first.org/data/v1/epss?cve=' + encodeURIComponent(ids) + '&limit=100', FIRST).then(function (j) {
      return j && Array.isArray(j.data) ? j.data : [];
    }, function () { return null; }).then(function (rows) {
      var map = {};
      (rows || []).forEach(function (r) { if (r && typeof r.cve === 'string' && CVE.test(r.cve)) map[r.cve] = { e: L.num(r.epss), p: L.num(r.percentile) }; });
      items.forEach(function (c) { var m = map[c.id]; c.epss = m && m.e !== null && m.e >= 0 && m.e <= 1 ? m.e : null; c.pct = m ? m.p : null; });
      items.sort(function (a, b) { return (b.epss === null ? -1 : b.epss) - (a.epss === null ? -1 : a.epss); });
      items.slice(0, 20).forEach(function (c) { list.appendChild(card(c)); });
      list.hidden = false;
      if (rows === null) L.status(status, 'The scoring service (EPSS) did not answer, so no probabilities are shown. Try again later.', 'is-warn');
      else L.status(status, 'Ranked by EPSS, highest chance first. Updated daily by FIRST.', '');
    });
  }).catch(function () {
    list.hidden = true; L.status(status, 'The latest-CVE feed is unavailable right now. Please try again later.', 'is-err');
  });
})();
