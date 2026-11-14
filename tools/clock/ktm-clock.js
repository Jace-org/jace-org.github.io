/* ktm-clock.js: "22:58 · 14°C in Kathmandu". Vanilla, no dependencies.
   Usage: <span id="ktm-clock" hidden></span> + <script src="/widgets/data-base.js"></script> + <script src="ktm-clock.js"></script>
          then ktmClock(document.getElementById('ktm-clock'));
   Time is computed locally; the temperature is read from the site's data hub (weather.json, pre-fetched
   server-side from Open-Meteo, so the browser never contacts Open-Meteo). It is simply left out if
   data-base.js is missing, the request fails or takes longer than 8 s, or the data is more than 3 hours old. */
(function () {
  var URL = window.DATA_BASE ? window.DATA_BASE + 'weather.json' : null;
  var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  window.ktmClock = function (el) {
    if (!el || typeof Intl === 'undefined') return;
    var temp = null;
    function paint() {
      el.textContent = fmt.format(new Date()) + (temp === null ? '' : ' · ' + temp + '°C') + ' in Kathmandu';
      el.hidden = false;
    }
    function weather() {
      if (!URL) { temp = null; paint(); return; }
      var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
      fetch(URL, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          var v = d && d.schema === 1 && d.temperature_c, g = d && Date.parse(d.generated_at);
          var fresh = isFinite(g) && Date.now() - g < 3 * 3600e3;
          temp = (fresh && typeof v === 'number' && isFinite(v) && v > -60 && v < 60) ? Math.round(v) : null;
          paint();
        })
        .catch(function () { temp = null; paint(); })
        .finally(function () { clearTimeout(t); });
    }
    paint(); weather();
    setInterval(paint, 15000);       /* minute display: 15 s is plenty */
    setInterval(weather, 15 * 60000);
  };
})();
