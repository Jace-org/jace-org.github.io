/* Test-lab helpers (inline per tool; vanilla, textContent only). */
var T = (function () {
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }
  function str(v, max) { return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max || 300).trim() : ''; }
  /* GET JSON with an 8 s timeout; no cookies, no referrer. */
  function getJSON(url) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
    return fetch(url, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).finally(function () { clearTimeout(t); });
  }
  /* https URL on an exact-host allowlist, else ''. */
  function safeUrl(u, hosts) {
    if (typeof u !== 'string' || u.length > 2048) return '';
    var p; try { p = new URL(u); } catch (e) { return ''; }
    if (p.protocol !== 'https:' || p.username || p.password) return '';
    return hosts.indexOf(p.hostname) === -1 ? '' : p.href;
  }
  function link(href, text) { var a = el('a', null, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; return a; }
  var KTM = { lat: 27.7172, lon: 85.3240 };
  function rad(d) { return d * Math.PI / 180; }
  /* Great-circle surface distance in km. */
  function dist(la1, lo1, la2, lo2) {
    var dLa = rad(la2 - la1), dLo = rad(lo2 - lo1);
    var a = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function bearing(la1, lo1, la2, lo2) {
    var y = Math.sin(rad(lo2 - lo1)) * Math.cos(rad(la2));
    var x = Math.cos(rad(la1)) * Math.sin(rad(la2)) - Math.sin(rad(la1)) * Math.cos(rad(la2)) * Math.cos(rad(lo2 - lo1));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function compass(b) { return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(b / 45) % 8]; }
  function fmt(n, d) { return n.toLocaleString('en-US', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function ktmParts(d) {
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', hourCycle: 'h23' });
    var o = {}; f.formatToParts(d).forEach(function (p) { o[p.type] = p.value; }); return o;
  }
  function status(box, msg, cls) { box.hidden = false; box.className = 'dw-status ' + (cls || ''); box.textContent = msg; }
  return { el: el, clear: clear, num: num, str: str, getJSON: getJSON, safeUrl: safeUrl, link: link, KTM: KTM, dist: dist, bearing: bearing, compass: compass, fmt: fmt, ktmParts: ktmParts, status: status };
})();

(function () {
  var status = document.getElementById('status'), $ = function (id) { return document.getElementById(id); };
  var GORKHA = { lat: 28.147, lon: 84.708 };
  var now = Date.now();
  var from = new Date(now - 30 * 864e5).toISOString().slice(0, 10);
  var URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=26&maxlatitude=31&minlongitude=79&maxlongitude=89&minmagnitude=2.5&orderby=time&limit=200&starttime=' + from;
  var ktm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function ageText(ms) { var h = (now - ms) / 36e5; return h < 1 ? 'less than an hour ago' : h < 48 ? Math.round(h) + ' hours ago' : Math.round(h / 24) + ' days ago'; }

  T.getJSON(URL).then(function (d) {
    var fs = d && Array.isArray(d.features) ? d.features : null;
    if (!fs) throw new Error('bad');
    var ev = [];
    fs.forEach(function (f) {
      var p = f && f.properties, g = f && f.geometry && f.geometry.coordinates;
      if (!p || !Array.isArray(g)) return;
      var mag = T.num(p.mag), t = T.num(p.time), lon = T.num(g[0]), lat = T.num(g[1]), dep = T.num(g[2]);
      if (mag === null || t === null || lon === null || lat === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
      ev.push({ mag: mag, t: t, lat: lat, lon: lon, depth: dep, place: T.str(p.place, 120) || 'Unnamed location', url: T.safeUrl(p.url, ['earthquake.usgs.gov']),
                km: T.dist(T.KTM.lat, T.KTM.lon, lat, lon) });
    });
    ev.sort(function (a, b) { return b.t - a.t; });
    if (!ev.length) { T.status(status, 'No magnitude 2.5+ events were reported in this area during the last 30 days.', ''); mapInit([]); return; }
    var last = ev[0];
    $('q-mag').textContent = 'M' + T.fmt(last.mag, 1);
    $('q-mag-say').textContent = 'Most recent event: ' + last.place + ', ' + ageText(last.t);
    $('q-dist').textContent = T.fmt(last.km) + ' km';
    $('q-dist-say').textContent = 'From Kathmandu, to the ' + T.compass(T.bearing(T.KTM.lat, T.KTM.lon, last.lat, last.lon)) + ' (distance along the surface)';
    $('q-count').textContent = String(ev.length) + (ev.length === 200 ? '+' : '');
    $('tiles').hidden = false;
    var tb = document.querySelector('#list tbody');
    ev.slice(0, 25).forEach(function (e) {
      var tr = T.el('tr');
      tr.appendChild(T.el('td', 'n', ktm.format(new Date(e.t))));
      tr.appendChild(T.el('td', 'n', T.fmt(e.mag, 1)));
      var td = T.el('td'); if (e.url) td.appendChild(T.link(e.url, e.place)); else td.textContent = e.place; tr.appendChild(td);
      tr.appendChild(T.el('td', 'n', T.fmt(e.km) + ' km'));
      tb.appendChild(tr);
    });
    $('list-wrap').hidden = false;
    mapInit(ev);
  }).catch(function () {
    T.status(status, 'The earthquake feed could not be loaded right now. Try again in a few minutes.', 'is-err');
    mapInit([]);
  });

  function mapInit(ev) {
    var note = $('mapnote');
    if (!window.L) { note.textContent = 'The map library could not be loaded. The table above still lists every event.'; return; }
    note.hidden = true;
    var map = L.map('map', { scrollWheelZoom: false, worldCopyJump: false }).setView([28.3, 84], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    L.circleMarker([T.KTM.lat, T.KTM.lon], { radius: 6, color: '#111111', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }).bindTooltip('Kathmandu').addTo(map);
    var g = L.circleMarker([GORKHA.lat, GORKHA.lon], { radius: 22, color: '#ffd60a', weight: 4, fill: false });
    g.bindPopup(T.el('span', null, 'Gorkha earthquake, 25 April 2015, M7.8 (reference)')); g.addTo(map);
    ev.forEach(function (e) {
      var fresh = (now - e.t) / 864e5 < 3;
      var m = L.circleMarker([e.lat, e.lon], { radius: 3 + e.mag * 1.8, color: '#111111', weight: 1, fillColor: fresh ? '#d81f26' : '#ff7a1a', fillOpacity: fresh ? .85 : .5 });
      var box = T.el('div'); box.appendChild(T.el('strong', null, 'M' + T.fmt(e.mag, 1) + ' · ' + e.place));
      box.appendChild(T.el('div', null, ktm.format(new Date(e.t)) + ' Nepal time'));
      if (e.depth !== null) box.appendChild(T.el('div', null, 'Depth ' + T.fmt(e.depth) + ' km'));
      box.appendChild(T.el('div', null, T.fmt(e.km) + ' km from Kathmandu'));
      m.bindPopup(box); m.addTo(map);
    });
    map.on('focus', function () { map.scrollWheelZoom.enable(); }); map.on('blur', function () { map.scrollWheelZoom.disable(); });
  }
})();
