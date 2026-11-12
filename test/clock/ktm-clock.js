/* ktm-clock.js: "22:58 · 14°C in Kathmandu". Vanilla, no dependencies.
   Usage: <span id="ktm-clock" hidden></span> + <script src="ktm-clock.js"></script>
          then ktmClock(document.getElementById('ktm-clock'));
   Time is computed locally; the temperature comes from Open-Meteo (keyless) and is
   simply left out if the request fails or takes longer than 8 s. */
(function () {
  var URL = 'https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.324&current=temperature_2m';
  var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  window.ktmClock = function (el) {
    if (!el || typeof Intl === 'undefined') return;
    var temp = null;
    function paint() {
      el.textContent = fmt.format(new Date()) + (temp === null ? '' : ' · ' + temp + '°C') + ' in Kathmandu';
      el.hidden = false;
    }
    function weather() {
      var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
      fetch(URL, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          var v = d && d.current && d.current.temperature_2m;
          temp = (typeof v === 'number' && isFinite(v) && v > -60 && v < 60) ? Math.round(v) : null;
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
