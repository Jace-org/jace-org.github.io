(function () {
  var H = window.Hub, status = document.getElementById('status'), live = document.getElementById('live');
  var SVGNS = 'http://www.w3.org/2000/svg';
  function say(msg, cls) { status.hidden = false; status.className = 'dw-status ' + (cls || ''); status.textContent = msg; }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function svg(tag, attrs, text) { var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }

  function stats(d) {
    var box = document.getElementById('stats');
    [['asn_count', 'Nepali networks (ASNs)', 'yellow'], ['prefix_count_v4', 'IPv4 prefixes', 'orange'], ['prefix_count_v6', 'IPv6 prefixes', 'mint']].forEach(function (p) {
      var v = H.num(d[p[0]]);
      if (v === null) return;
      var s = H.el('div', 'fact fact-' + p[2]); s.appendChild(H.el('p', 'fact-num', fmt(v))); s.appendChild(H.el('p', 'fact-say', p[1])); box.appendChild(s);
    });
  }

  function chart(hist) {
    var pts = (Array.isArray(hist) ? hist : []).slice(-90).map(function (h) {
      return h && { d: H.str(h.date, 10), v: H.num(h.prefix_count) };
    }).filter(function (p) { return p && p.v !== null && /^\d{4}-\d{2}-\d{2}$/.test(p.d); });
    var box = document.getElementById('chart'), note = document.getElementById('chartnote');
    if (pts.length < 2) { box.hidden = true; note.textContent = 'Not enough history yet; the trend appears once a few days have been collected.'; return; }
    var W = 800, Hh = 260, L = 56, R = 12, T = 14, B = 30;
    var min = Math.min.apply(null, pts.map(function (p) { return p.v; })), max = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    if (max === min) { max += 1; min -= 1; }
    var pad = (max - min) * 0.1; min -= pad; max += pad;
    var x = function (i) { return L + (W - L - R) * i / (pts.length - 1); };
    var y = function (v) { return T + (Hh - T - B) * (1 - (v - min) / (max - min)); };
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': 'Line chart of announced prefixes over the last ' + pts.length + ' days, from ' + fmt(pts[0].v) + ' to ' + fmt(pts[pts.length - 1].v) });
    for (var g = 0; g < 4; g++) {
      var v = min + (max - min) * g / 3, yy = y(v);
      s.appendChild(svg('line', { x1: L, x2: W - R, y1: yy, y2: yy, 'class': 'grid' }));
      s.appendChild(svg('text', { x: L - 6, y: yy + 4, 'text-anchor': 'end' }, fmt(Math.round(v))));
    }
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join('');
    s.appendChild(svg('path', { d: line + 'L' + x(pts.length - 1).toFixed(1) + ' ' + (Hh - B) + 'L' + L + ' ' + (Hh - B) + 'Z', 'class': 'area' }));
    s.appendChild(svg('path', { d: line, 'class': 'line' }));
    s.appendChild(svg('text', { x: L, y: Hh - 8 }, pts[0].d));
    s.appendChild(svg('text', { x: W - R, y: Hh - 8, 'text-anchor': 'end' }, pts[pts.length - 1].d));
    box.appendChild(s);
    note.textContent = 'Total announced prefixes (IPv4 + IPv6), one point per day.';
  }

  function networks(list) {
    var tb = document.querySelector('#nets tbody');
    (Array.isArray(list) ? list : []).slice(0, 5).forEach(function (n) {
      if (!n || typeof n !== 'object') return;
      var asn = H.num(n.asn), name = H.str(n.name, 80);
      if (asn === null || !name || typeof n.visible !== 'boolean') return;
      var tr = document.createElement('tr');
      tr.appendChild(H.el('td', 'n', 'AS' + asn));
      tr.appendChild(H.el('td', '', name));
      var pc = H.num(n.announced_prefixes);
      tr.appendChild(H.el('td', 'n', pc === null ? '–' : fmt(pc)));
      tr.appendChild(H.el('td', 'dw-vis ' + (n.visible ? 'on' : 'off'), n.visible ? 'Visible' : 'Not visible'));
      tb.appendChild(tr);
    });
  }

  function outages(list) {
    var ol = document.getElementById('outages'), n = 0;
    (Array.isArray(list) ? list : []).forEach(function (o) {
      if (!o || typeof o !== 'object') return;
      var title = H.str(o.title, 140); if (!title) return;
      var li = document.createElement('li');
      var dt = H.date(o.date), tm = H.el('time', '', H.str(o.date, 10));
      if (dt) tm.setAttribute('datetime', H.str(o.date, 10));
      li.appendChild(tm);
      li.appendChild(H.el('h3', '', title));
      var note = H.str(o.note, 400); if (note) li.appendChild(H.el('p', '', note));
      var href = H.safeUrl(o.source_url);
      if (href) { var p = H.el('p'); p.appendChild(H.link(href, 'Source', '')); li.appendChild(p); }
      ol.appendChild(li); n++;
    });
    document.getElementById('outnone').hidden = n > 0;
  }

  H.get('pulse.json').then(function (d) {
    stats(d); chart(d.history); networks(d.networks); outages(d.outages);
    live.hidden = false;
    if (H.isStale(d.generated_at, 3)) {
      var g = H.ago(d.generated_at);
      say('This data may be out of date' + (g ? ' (last updated ' + g + ')' : '') + '.', 'is-warn');
    }
  }).catch(function () {
    say('The pulse data is unavailable right now. Please try again later.', 'is-err');
  });
})();
