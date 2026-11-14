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
  var status = document.getElementById('status');
  var $ = function (id) { return document.getElementById(id); };

  /* ---- Bikram Sambat: month lengths, Baisakh..Chaitra. Anchors: 2082/1/1 = 2025-04-14, 2083/1/1 = 2026-04-14. ---- */
  var BS = { 2080: [31,32,31,32,31,30,30,30,29,29,30,30], 2081: [31,32,31,32,31,30,30,30,29,30,29,31], 2082: [31,31,32,31,31,31,30,29,30,29,30,30],
             2083: [31,31,32,31,31,31,30,29,30,29,30,30], 2084: [31,31,32,31,31,30,30,30,29,30,30,30], 2085: [31,32,31,32,30,31,30,30,29,30,30,30] };
  var BS_START = Date.UTC(2023, 3, 14);      /* 1 Baisakh 2080 */
  var BS_START_YEAR = 2080;
  var MONTHS = ['Baisakh','Jestha','Asar','Shrawan','Bhadra','Aswin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
  /* Convert a calendar date (y, m 1-12, d) to BS, or null when outside the supported range. */
  function adToBs(y, m, d) {
    var days = Math.round((Date.UTC(y, m - 1, d) - BS_START) / 864e5);
    if (days < 0) return null;
    for (var by = BS_START_YEAR; BS[by]; by++) {
      for (var i = 0; i < 12; i++) {
        if (days < BS[by][i]) return { y: by, m: i, d: days + 1 };
        days -= BS[by][i];
      }
    }
    return null;
  }
  window.__adToBs = adToBs;   /* exposed for the self-test in the verification notes */

  function tick() {
    var p = T.ktmParts(new Date());
    $('t-time').textContent = p.hour + ':' + p.minute;
    $('t-date').textContent = p.day + '/' + p.month + '/' + p.year + ' AD';
    var b = adToBs(+p.year, +p.month, +p.day);
    if (b) { $('t-bs').textContent = b.d + ' ' + MONTHS[b.m]; $('t-bs-sub').textContent = b.y + ' BS'; }
    else { $('t-bs').textContent = 'n/a'; $('t-bs-sub').textContent = 'Outside the supported range (2080 to 2085 BS)'; }
  }
  tick(); setInterval(tick, 5000);

  /* ---- Weather / sun ---- */
  var WMO = { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
              71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail' };
  var failed = [];
  function note(what) { failed.push(what); T.status(status, 'Could not load: ' + failed.join(', ') + '. The rest of the page still works.', 'is-warn'); }

  var AQI = [[50, 'Good', 'fact-mint'], [100, 'Moderate', 'fact-yellow'], [150, 'Unhealthy for sensitive groups', 'fact-orange'], [200, 'Unhealthy', 'fact-red'], [300, 'Very unhealthy', 'fact-red'], [9999, 'Hazardous', 'fact-red']];
  /* Weather, sun times and air quality come from the site's data hub (pre-fetched server-side); the browser never contacts Open-Meteo. */
  Hub.get('weather.json')
    .then(function (d) {
      var t = T.num(d && d.temperature_c);
      if (t === null) throw new Error('bad');
      var stale = Hub.isStale(d.generated_at, 3);
      $('t-temp').textContent = Math.round(t) + '°C';
      $('t-wx').textContent = (WMO[d.weather_code] || 'Weather') + ' in Kathmandu' + (stale ? ' (may be out of date)' : '');
      $('tile-wx').hidden = false;
      var sr = T.str(d.sunrise, 25), ss = T.str(d.sunset, 25);
      if (/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(sr) && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(ss)) {
        $('t-sun').textContent = sr.slice(11) + ' / ' + ss.slice(11);
        $('t-sun-say').textContent = 'Sunrise / sunset today';
        $('tile-sun').hidden = false;
      }
      var a = d.aqi && T.num(d.aqi.us_aqi), pm = d.aqi && T.num(d.aqi.pm2_5);
      if (a === null) { note('air quality'); return; }
      var band = AQI.filter(function (b) { return a <= b[0]; })[0];
      var tile = $('tile-aqi'); tile.className = 'fact ' + band[2];
      $('t-aqi').textContent = Math.round(a);
      $('t-aqi-say').textContent = 'US AQI: ' + band[1] + (pm !== null ? ' (PM2.5 ' + T.fmt(pm, 1) + ' µg/m³)' : '') + (stale ? ' (may be out of date)' : '');
      tile.hidden = false;
    }).catch(function () { note('weather'); note('air quality'); });

  /* ---- NRB forex ---- */
  var WANT = ['USD', 'INR', 'EUR', 'GBP', 'JPY'];
  var ago = function (n) { var d = new Date(Date.now() - n * 864e5); return d.toISOString().slice(0, 10); };
  T.getJSON('https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=' + ago(7) + '&to=' + ago(-1))
    .then(function (d) {
      var list = d && d.data && d.data.payload;
      if (!Array.isArray(list) || !list.length) throw new Error('empty');
      var best = null;
      list.forEach(function (x) { if (x && /^\d{4}-\d\d-\d\d$/.test(x.date || '') && Array.isArray(x.rates) && (!best || x.date > best.date)) best = x; });
      if (!best) throw new Error('none');
      var tb = document.querySelector('#fx tbody'), rows = 0;
      WANT.forEach(function (iso) {
        var r = best.rates.filter(function (q) { return q && q.currency && q.currency.iso3 === iso; })[0];
        if (!r) return;
        var buy = parseFloat(r.buy), sell = parseFloat(r.sell), unit = Number(r.currency.unit);
        if (!isFinite(buy) || !isFinite(sell) || !isFinite(unit)) return;
        var tr = T.el('tr');
        tr.appendChild(T.el('td', null, T.str(r.currency.name, 40) + ' (' + iso + ')'));
        tr.appendChild(T.el('td', 'n', String(unit)));
        tr.appendChild(T.el('td', 'n', T.fmt(buy, 2)));
        tr.appendChild(T.el('td', 'n', T.fmt(sell, 2)));
        tb.appendChild(tr); rows++;
      });
      if (!rows) throw new Error('norows');
      $('fx-cap').textContent = 'Official Nepal Rastra Bank rates for ' + best.date + ', in Nepali rupees per unit of foreign currency.';
      $('fx-wrap').hidden = false; $('fx-note').hidden = true;
    }).catch(function () { $('fx-note').textContent = 'Exchange rates are unavailable right now.'; note('exchange rates'); });
})();
