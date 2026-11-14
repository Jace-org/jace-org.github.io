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
  var NS = 'http://www.w3.org/2000/svg', svg = $('map');
  var W = 720, H = 360;
  function svgEl(tag, attrs, text) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }
  function X(lon) { return (lon + 180) / 360 * W; }
  function Y(lat) { return (90 - lat) / 180 * H; }
  var trace = null, issDot, issRing, ready = false, failures = 0, timer = null;

  function grid() {
    for (var lo = -180; lo <= 180; lo += 30) { svg.appendChild(svgEl('line', { x1: X(lo), y1: 0, x2: X(lo), y2: H, class: lo === 0 ? 'axis' : 'grid' })); }
    for (var la = -90; la <= 90; la += 30) { svg.appendChild(svgEl('line', { x1: 0, y1: Y(la), x2: W, y2: Y(la), class: la === 0 ? 'axis' : 'grid' })); }
    [-120, -60, 0, 60, 120].forEach(function (lo) { svg.appendChild(svgEl('text', { x: X(lo) + 3, y: H - 4 }, lo + '°')); });
    [-60, -30, 30, 60].forEach(function (la) { svg.appendChild(svgEl('text', { x: 3, y: Y(la) - 3 }, la + '°')); });
    svg.appendChild(svgEl('circle', { cx: X(T.KTM.lon), cy: Y(T.KTM.lat), r: 5, class: 'ktm' }));
    svg.appendChild(svgEl('text', { x: X(T.KTM.lon) + 8, y: Y(T.KTM.lat) - 8, class: 'lbl' }, 'Kathmandu'));
  }
  grid();

  function drawTrace(pts) {
    if (trace) svg.removeChild(trace);
    trace = svgEl('g', {});
    var d = '', prev = null;
    pts.forEach(function (p) {
      var jump = prev && Math.abs(p.lon - prev.lon) > 180;
      d += (prev && !jump ? 'L' : 'M') + X(p.lon).toFixed(1) + ' ' + Y(p.lat).toFixed(1) + ' ';
      prev = p;
    });
    trace.appendChild(svgEl('path', { d: d, class: 'trace' }));
    svg.insertBefore(trace, svg.querySelector('.ktm'));
  }

  function update() {
    /* Position is pre-fetched server-side by the data hub (refreshed about every 10 s); the browser never contacts the ISS API. */
    Hub.get('iss.json').then(function (d) {
      var P = d && d.position;
      var lat = T.num(P && P.lat), lon = T.num(P && P.lon), alt = T.num(P && P.alt_km), vel = T.num(P && P.velocity_kmh), fp = T.num(P && P.footprint_km);
      if (lat === null || lon === null || alt === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('bad');
      failures = 0;
      if (Hub.isStale(d.generated_at, 2 / 60)) T.status(status, 'Live updates are delayed; this position is from ' + (Hub.ago(d.generated_at) || 'a while ago') + ' and the station has moved since.', 'is-warn');
      else status.hidden = true;
      var ground = T.dist(T.KTM.lat, T.KTM.lon, lat, lon);
      /* straight line: law of cosines through Earth's centre */
      var R = 6371, ang = ground / R, r2 = R + alt;
      var straight = Math.sqrt(R * R + r2 * r2 - 2 * R * r2 * Math.cos(ang));
      $('i-dist').textContent = T.fmt(ground) + ' km';
      $('i-dist-say').textContent = 'Along the ground from Kathmandu (' + T.fmt(straight) + ' km straight line), to the ' + T.compass(T.bearing(T.KTM.lat, T.KTM.lon, lat, lon));
      $('i-alt').textContent = T.fmt(alt) + ' km';
      $('i-vel').textContent = vel === null ? 'orbital speed' : T.fmt(vel) + ' km/h';
      var inView = fp !== null && ground < fp / 2;
      $('i-over').textContent = inView ? 'Yes' : 'No';
      $('i-over-say').textContent = inView ? 'Kathmandu is inside the station’s horizon circle right now' : 'Kathmandu is beyond the station’s horizon circle';
      $('tiles').hidden = false;
      if (!issDot) {
        issRing = svgEl('circle', { r: 11, class: 'ring' }); issDot = svgEl('circle', { r: 6, class: 'iss' });
        svg.appendChild(issRing); svg.appendChild(issDot);
      }
      [issRing, issDot].forEach(function (c) { c.setAttribute('cx', X(lon)); c.setAttribute('cy', Y(lat)); });
      ready = true;
      if (Array.isArray(d.trace)) {
        var pts = d.trace.map(function (p) { return p && { lat: T.num(p.lat), lon: T.num(p.lon) }; }).filter(function (p) { return p && p.lat !== null && p.lon !== null; });
        if (pts.length > 1) { drawTrace(pts); }
      }
    }).catch(function () {
      failures++;
      if (!ready) T.status(status, 'The station position could not be loaded right now.', 'is-err');
      else T.status(status, 'Live updates are failing; showing the last known position.', 'is-warn');
    });
  }
  function start() { if (!timer) { update(); timer = setInterval(update, 10000); } }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if (!document.hidden) start();
})();
