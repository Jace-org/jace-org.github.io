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
  var KW = /\b(comput\w*|internet|software|hardware|satellite\w*|cryptograph\w*|encrypt\w*|cipher|network\w*|web|www|email|e-mail|microprocessor|transistor\w*|programm\w*|algorithm\w*|hacker\w*|malware|virus|operating system|unix|linux|microsoft|apple inc|google|ibm|telegraph|telephon\w*|radio|laser|semiconductor|robot\w*|artificial intelligence|spacecraft|space probe|sputnik|rocket|astronaut|cosmonaut|digital|silicon|database|smartphone|iphone|data|telecommunication\w*|bitcoin|blockchain|chip)\b/i;
  var day = new Date(); var showAll = false, events = [];
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var seq = 0;

  function render() {
    var list = $('events'); T.clear(list);
    var shown = showAll ? events : events.filter(function (e) { return KW.test(e.text); });
    $('summary').textContent = events.length ? (showAll ? events.length + ' events on this date.' : shown.length + ' of ' + events.length + ' events match the computing filter.') : '';
    if (events.length && !shown.length) { list.appendChild(T.el('li', 'o-empty', 'No computing-related events listed for this date. Try "Show all events" or another day.')); return; }
    shown.sort(function (a, b) { return a.year - b.year; }).forEach(function (e) {
      var li = T.el('li');
      li.appendChild(T.el('time', null, String(e.year)));
      li.appendChild(T.el('p', 'o-text', e.text));
      if (e.url) li.appendChild(T.link(e.url, e.title + ' on Wikipedia'));
      list.appendChild(li);
    });
  }

  function load() {
    var my = ++seq, m = day.getMonth() + 1, d = day.getDate();
    $('daylabel').textContent = d + ' ' + MONTH[m - 1];
    $('summary').textContent = 'Loading...'; T.clear($('events')); status.hidden = true; events = [];
    var mm = ('0' + m).slice(-2), dd = ('0' + d).slice(-2);
    window.Hub.get('onthisday.json').then(function (r) {
      if (my !== seq) return;
      var a = r && r.days && Object.prototype.hasOwnProperty.call(r.days, mm + '-' + dd) ? r.days[mm + '-' + dd] : null;
      if (!a) {
        $('summary').textContent = '';
        T.status(status, 'Only dates within two days of today are available (the feed is saved on this site\'s data service, not fetched live). Press "Today" to go back.', 'is-warn');
        return;
      }
      if (!Array.isArray(a)) throw new Error('bad');
      a.forEach(function (e) {
        var year = T.num(e && e.year), text = T.str(e && e.text, 400); if (year === null || !text) return;
        var url = T.safeUrl(e.url, ['en.wikipedia.org']), title = T.str(e.title || '', 100);
        events.push({ year: year, text: text, url: url, title: title });
      });
      if (window.Hub.isStale(r.generated_at, 24)) T.status(status, 'Showing the last saved copy; it may be out of date.', 'is-warn');
      render();
    }).catch(function () {
      if (my !== seq) return;
      $('summary').textContent = '';
      T.status(status, 'The "On this day" feed could not be loaded right now. Try again in a few minutes.', 'is-err');
    });
  }
  function shift(n) { day = new Date(2024, day.getMonth(), day.getDate() + n); load(); }  /* 2024 = leap year so 29 Feb exists */
  day = new Date(2024, day.getMonth(), day.getDate());
  $('prev').onclick = function () { shift(-1); };
  $('next').onclick = function () { shift(1); };
  $('today').onclick = function () { var n = new Date(); day = new Date(2024, n.getMonth(), n.getDate()); load(); };
  $('all').onclick = function () { showAll = !showAll; this.setAttribute('aria-pressed', String(showAll)); render(); };
  load();
})();
