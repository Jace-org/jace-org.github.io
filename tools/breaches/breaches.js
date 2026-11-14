(function () {
  var L = window.Lab, status = document.getElementById('status'), app = document.getElementById('app');
  var bars = document.getElementById('bars'), fy = document.getElementById('fy'), fc = document.getElementById('fc'), fs = document.getElementById('fs');
  var count = document.getElementById('count'), list = document.getElementById('list'), more = document.getElementById('more');
  var x0 = document.getElementById('x0'), x1 = document.getElementById('x1');
  var all = [], shown = 40, PAGE = 40;

  /* items arrive pre-cleaned (compact keys) from the site's data service; re-validated here before display. */
  function clean(b, classes) {
    if (!b || typeof b !== 'object') return null;
    var name = L.str(b.n, 80), title = L.str(b.t, 120), date = typeof b.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.d) ? b.d : '';
    var n = L.num(b.c);
    if (!title || !date || n === null || n < 0) return null;
    var cl = Array.isArray(b.k) ? b.k.map(function (i) { return typeof i === 'number' ? classes[i] : null; }).filter(function (c) { return typeof c === 'string'; }).map(function (c) { return L.str(c, 40); }).slice(0, 30) : [];
    return { name: name, title: title, date: date, year: +date.slice(0, 4), n: n, classes: cl, desc: L.str(b.x, 280), verified: b.v === 1 };
  }
  function fmtDate(d) { var dt = new Date(d + 'T00:00:00Z'); return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  function compact(n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + ' billion' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' million' : n >= 1e3 ? Math.round(n / 1e3) + ' thousand' : String(n); }

  function filtered() {
    var y = fy.value, c = fc.value;
    var r = all.filter(function (b) { return (y === 'all' || String(b.year) === y) && (c === 'all' || b.classes.indexOf(c) !== -1); });
    r.sort(fs.value === 'size' ? function (a, b) { return b.n - a.n; } : function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    return r;
  }
  function drawBars() {
    L.clear(bars);
    var c = fc.value, byYear = {}, max = 1;
    all.forEach(function (b) { if (c === 'all' || b.classes.indexOf(c) !== -1) { byYear[b.year] = (byYear[b.year] || 0) + 1; } });
    var years = Object.keys(byYear).map(Number).sort();
    years.forEach(function (y) { max = Math.max(max, byYear[y]); });
    years.forEach(function (y) {
      var btn = L.el('button', 'lab-bar' + (String(y) === fy.value ? ' is-on' : ''));
      btn.type = 'button'; btn.style.height = Math.max(4, Math.round(byYear[y] / max * 100)) + '%';
      btn.setAttribute('aria-label', y + ': ' + byYear[y] + ' breaches. Filter to this year.');
      btn.title = y + ': ' + byYear[y];
      btn.setAttribute('aria-pressed', String(String(y) === fy.value));
      btn.addEventListener('click', function () { fy.value = String(y) === fy.value ? 'all' : String(y); shown = PAGE; draw(); });
      bars.appendChild(btn);
    });
    x0.textContent = years.length ? String(years[0]) : ''; x1.textContent = years.length ? String(years[years.length - 1]) : '';
  }
  function draw() {
    drawBars();
    var r = filtered();
    count.textContent = r.length ? 'Showing ' + Math.min(shown, r.length) + ' of ' + L.fmt(r.length) + ' breaches, ' + compact(r.reduce(function (s, b) { return s + b.n; }, 0)) + ' accounts in total.' : 'No breaches match these filters.';
    L.clear(list);
    r.slice(0, shown).forEach(function (b) {
      var li = L.el('li'), t = L.el('time', '', fmtDate(b.date)); t.setAttribute('datetime', b.date);
      li.appendChild(t); li.appendChild(L.el('h3', '', b.title));
      li.appendChild(L.el('p', '', L.fmt(b.n) + ' accounts' + (b.verified ? '' : ' (unverified)') + '.'));
      if (b.desc) li.appendChild(L.el('p', '', b.desc));
      var chips = L.el('div', 'lab-chips');
      b.classes.slice(0, 8).forEach(function (c) { chips.appendChild(L.chip(c, /password/i.test(c) ? 'is-hot' : '')); });
      if (b.classes.length > 8) chips.appendChild(L.chip('+' + (b.classes.length - 8) + ' more'));
      li.appendChild(chips);
      if (b.name && /^[A-Za-z0-9_.-]{1,80}$/.test(b.name)) {
        var href = L.safeHref('https://haveibeenpwned.com/PwnedWebsites#' + encodeURIComponent(b.name), ['haveibeenpwned.com']);
        if (href) { var p = L.el('p'); p.appendChild(L.link(href, 'Full entry on Have I Been Pwned')); li.appendChild(p); }
      }
      list.appendChild(li);
    });
    more.hidden = r.length <= shown;
  }
  function opt(sel, value, text) { var o = L.el('option', '', text); o.value = value; sel.appendChild(o); }

  window.Hub.get('breaches.json').then(function (d) {
    if (!d || !Array.isArray(d.items) || !Array.isArray(d.classes)) throw new Error('bad list');
    var stale = window.Hub.isStale(d.generated_at, 72);
    d.items.forEach(function (b) { var c = clean(b, d.classes); if (c) all.push(c); });
    if (!all.length) throw new Error('empty');
    var years = {}, classes = {};
    all.forEach(function (b) { years[b.year] = 1; b.classes.forEach(function (c) { classes[c] = (classes[c] || 0) + 1; }); });
    opt(fy, 'all', 'All years');
    Object.keys(years).map(Number).sort(function (a, b) { return b - a; }).forEach(function (y) { opt(fy, String(y), String(y)); });
    opt(fc, 'all', 'Any data');
    Object.keys(classes).sort(function (a, b) { return classes[b] - classes[a] || (a < b ? -1 : 1); }).slice(0, 80).forEach(function (c) { opt(fc, c, c + ' (' + classes[c] + ')'); });
    [fy, fc, fs].forEach(function (s) { s.addEventListener('change', function () { shown = PAGE; draw(); }); });
    more.addEventListener('click', function () { shown += PAGE; draw(); });
    L.status(status, stale ? 'Showing the last saved copy of the list; it may be out of date.' : '', stale ? 'is-warn' : ''); app.hidden = false; draw();
  }).catch(function () {
    app.hidden = true; L.status(status, 'The breach list is unavailable right now. Please try again later, or visit haveibeenpwned.com.', 'is-err');
  });
})();
