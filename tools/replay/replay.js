/* Attack replay theatre: SYNTHETIC data only. Everything from the JSON is validated before use. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var COLORS = ['var(--yellow)', 'var(--orange)', 'var(--red)', 'var(--mint)', 'var(--paper)', '#6f8fff'];
  var DOC_IP = /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/;
  var ANIM = 2.2;               // seconds of replay time an arc stays on screen
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D, W = 1000, H = 394, svg = $('map'), speed = 1, playing = false, t = 0, last = 0, raf = 0;
  var types = [], on = {}, tcolor = {}, nodes = {}, evs = [], counts = {}, shownLog = -1;

  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function px(lon, lat) { return [(lon + 180) * W / 360, (84 - lat) * W / 360]; }
  function fail(m) { var s = $('status'); s.hidden = false; s.textContent = m; $('rstage').hidden = true; }
  function getJSON(u) {
    var c = new AbortController(), to = setTimeout(function () { c.abort(); }, 8000);
    return fetch(u, { signal: c.signal, credentials: 'omit' }).then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('http'); return r.json(); });
  }
  function str(s, n) { return typeof s === 'string' ? s.replace(/[^\x20-\x7E]/g, '').slice(0, n) : ''; }

  function validate(d) {
    if (!d || !d.meta || d.meta.synthetic !== true || !d.types || !d.sources || !Array.isArray(d.events)) throw new Error('shape');
    var dur = Number(d.meta.duration); if (!(dur > 5 && dur <= 3600)) throw new Error('dur');
    var tt = {}, k;
    for (k in d.types) { if (/^[a-z0-9-]{1,30}$/.test(k) && d.types[k] && typeof d.types[k].label === 'string') tt[k] = { label: str(d.types[k].label, 40), about: str(d.types[k].about, 200) }; }
    var ss = {};
    for (k in d.sources) { var s = d.sources[k]; if (/^[A-Z]{2}$/.test(k) && s && isFinite(s.lon) && isFinite(s.lat) && s.lon >= -180 && s.lon <= 180 && s.lat >= -90 && s.lat <= 90) ss[k] = { name: str(s.name, 40), lon: +s.lon, lat: +s.lat }; }
    var se = d.sensor && isFinite(d.sensor.lon) && isFinite(d.sensor.lat) ? { label: str(d.sensor.label, 50), lon: +d.sensor.lon, lat: +d.sensor.lat } : null;
    if (!se) throw new Error('sensor');
    var ee = d.events.slice(0, 2000).filter(function (e) {
      return e && tt[e.type] && ss[e.src] && typeof e.ip === 'string' && DOC_IP.test(e.ip) && isFinite(e.t) && e.t >= 0 && e.t <= dur;
    }).map(function (e) { return { t: +e.t, type: e.type, src: e.src, ip: e.ip, detail: str(e.detail, 80) }; }).sort(function (a, b) { return a.t - b.t; });
    var cc = (Array.isArray(d.captions) ? d.captions : []).filter(function (c) { return c && isFinite(c.t) && typeof c.text === 'string'; })
      .map(function (c) { return { t: +c.t, text: str(c.text, 300) }; }).sort(function (a, b) { return a.t - b.t; });
    return { dur: dur, types: tt, sources: ss, sensor: se, events: ee, caps: cc };
  }

  function build(world) {
    if (world && typeof world.d === 'string' && /^[MLZ0-9.\s-]+$/.test(world.d) && world.d.length < 400000) {
      svg.appendChild(el('path', { d: world.d, 'class': 'land' }));
    }
    var arcLayer = el('g', {}); arcLayer.id = 'arcs'; svg.appendChild(arcLayer);
    var used = {};
    evs.forEach(function (e) { used[e.src] = 1; });
    Object.keys(used).forEach(function (k) {
      var s = D.sources[k], p = px(s.lon, s.lat);
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 3.2, 'class': 'src' }));
      var tx = el('text', { x: p[0] + 6, y: p[1] + 4 }); tx.textContent = s.name; svg.appendChild(tx);
    });
    var sp = px(D.sensor.lon, D.sensor.lat);
    svg.appendChild(el('circle', { cx: sp[0], cy: sp[1], r: 5, 'class': 'sensor' }));
    var lab = el('text', { x: sp[0] - 6, y: sp[1] + 18, 'text-anchor': 'middle' }); lab.textContent = D.sensor.label; svg.appendChild(lab);
    var ring = el('circle', { cx: sp[0], cy: sp[1], r: 5, 'class': 'ring', opacity: 0 }); ring.id = 'ring'; svg.appendChild(ring);
  }

  function arcPath(e) {
    var a = px(D.sources[e.src].lon, D.sources[e.src].lat), b = px(D.sensor.lon, D.sensor.lat);
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.min(90, Math.hypot(a[0] - b[0], a[1] - b[1]) * .25);
    return { a: a, b: b, c: [mx, my] };
  }
  function at(p, u) { var v = 1 - u; return [v * v * p.a[0] + 2 * v * u * p.c[0] + u * u * p.b[0], v * v * p.a[1] + 2 * v * u * p.c[1] + u * u * p.b[1]]; }

  function drawFrame() {
    var layer = $('arcs'), ring = $('ring');
    layer.textContent = '';
    var pulse = 0;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i]; if (e.t > t) break;
      var age = t - e.t; if (age > ANIM || !on[e.type]) continue;
      var u = Math.min(1, age / (ANIM * .7)), p = arcPath(e), col = tcolor[e.type];
      var path = el('path', { d: 'M' + p.a + ' Q' + p.c + ' ' + p.b, 'class': 'arc', stroke: col, 'stroke-opacity': (1 - age / ANIM).toFixed(2) });
      if (!reduce) { path.setAttribute('pathLength', '1'); path.setAttribute('stroke-dasharray', '1'); path.setAttribute('stroke-dashoffset', String((1 - u).toFixed(3))); }
      layer.appendChild(path);
      if (!reduce) { var q = at(p, u); layer.appendChild(el('circle', { cx: q[0], cy: q[1], r: 3.2, fill: col })); }
      if (u >= 1) pulse = Math.max(pulse, 1 - (age - ANIM * .7) / (ANIM * .3));
    }
    if (pulse > 0 && !reduce) { ring.setAttribute('opacity', pulse.toFixed(2)); ring.setAttribute('r', String(5 + (1 - pulse) * 22)); } else ring.setAttribute('opacity', 0);
  }

  function updateText() {
    var n = 0, c = {}, recent = 0;
    types.forEach(function (k) { c[k] = 0; });
    evs.forEach(function (e) { if (e.t <= t) { c[e.type]++; if (on[e.type]) { n++; if (t - e.t <= 10) recent++; } } });
    types.forEach(function (k) { nodes[k].textContent = String(c[k]); });
    $('s-total').textContent = String(n); $('s-rate').textContent = String(recent);
    var top = '-', best = 0; types.forEach(function (k) { if (on[k] && c[k] > best) { best = c[k]; top = D.types[k].label; } });
    $('s-top').textContent = top;
    $('clock').textContent = Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);
    $('seek').value = String(t);
    var cap = D.caps.filter(function (x) { return x.t <= t; }).pop();
    var capEl = $('cap'); var txt = cap ? cap.text : 'Press Play to start the replay.';
    if (capEl.textContent !== txt) capEl.textContent = txt;
    var lg = $('log'), key = n + ':' + Object.keys(on).filter(function (k) { return on[k]; }).join();
    if (key !== shownLog) {
      shownLog = key; lg.textContent = '';
      var shown = 0;
      for (var i = evs.length - 1; i >= 0 && shown < 8; i--) {
        var e = evs[i]; if (e.t > t || !on[e.type]) continue;
        var li = document.createElement('li'); li.style.borderLeftColor = tcolor[e.type];
        var b = document.createElement('b'); b.textContent = Math.floor(e.t / 60) + ':' + ('0' + Math.floor(e.t % 60)).slice(-2);
        li.appendChild(b); li.appendChild(document.createTextNode('  ' + e.ip + ' (' + D.sources[e.src].name + ')  ' + D.types[e.type].label + (e.detail ? ': ' + e.detail : '')));
        lg.appendChild(li); shown++;
      }
    }
  }
  function render() { drawFrame(); updateText(); }

  function tick(now) {
    if (!playing) return;
    t = Math.min(D.dur, t + (now - last) / 1000 * speed); last = now;
    render();
    if (t >= D.dur) return setPlaying(false);
    raf = requestAnimationFrame(tick);
  }
  function setPlaying(p) {
    playing = p; var b = $('play'); b.textContent = p ? 'Pause' : (t >= D.dur ? 'Replay' : 'Play'); b.setAttribute('aria-pressed', String(p));
    cancelAnimationFrame(raf);
    if (p) { if (t >= D.dur) t = 0; last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function init(d, world) {
    D = d; evs = d.events; types = Object.keys(d.types);
    types.forEach(function (k, i) { on[k] = true; tcolor[k] = COLORS[i % COLORS.length]; });
    $('seek').max = String(d.dur);
    build(world);
    var ul = $('types');
    types.forEach(function (k) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.title = d.types[k].about;
      var sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = tcolor[k];
      var lb = document.createElement('span'); lb.textContent = d.types[k].label;
      var n = document.createElement('span'); n.className = 'n'; n.textContent = '0'; nodes[k] = n;
      b.appendChild(sw); b.appendChild(lb); b.appendChild(n);
      b.addEventListener('click', function () { on[k] = !on[k]; b.setAttribute('aria-pressed', String(on[k])); shownLog = -1; render(); });
      li.appendChild(b); ul.appendChild(li);
    });
    var st = $('stats');
    [['s-total', 'Events shown so far', 'fact-yellow'], ['s-rate', 'In the last 10 seconds', 'fact-orange'], ['s-top', 'Busiest type', 'fact-mint']].forEach(function (x) {
      var f = document.createElement('div'); f.className = 'fact ' + x[2];
      var a = document.createElement('span'); a.className = 'fact-num'; a.id = x[0]; a.textContent = '0'; if (x[0] === 's-top') a.style.fontSize = 'clamp(1.75rem,1rem + 2vw,3rem)';
      var b = document.createElement('span'); b.className = 'fact-say'; b.textContent = x[1];
      f.appendChild(a); f.appendChild(b); st.appendChild(f);
    });
    $('play').addEventListener('click', function () { setPlaying(!playing); });
    $('restart').addEventListener('click', function () { t = 0; render(); setPlaying(true); });
    $('seek').addEventListener('input', function (e) { t = Math.max(0, Math.min(D.dur, parseFloat(e.target.value) || 0)); render(); });
    Array.prototype.forEach.call(document.querySelectorAll('.r-speed button'), function (b) {
      b.addEventListener('click', function () {
        speed = parseFloat(b.getAttribute('data-s')) || 1;
        Array.prototype.forEach.call(document.querySelectorAll('.r-speed button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      });
    });
    $('rstage').hidden = false; render();
    window.JKReplay = { seek: function (x) { t = x; render(); }, state: function () { return { t: t, playing: playing, events: evs.length }; } };
  }

  Promise.all([getJSON('replay.json'), getJSON('world.json').catch(function () { return null; })]).then(function (r) { init(validate(r[0]), r[1]); })
    .catch(function () { fail('The replay data could not be loaded or did not pass validation, so nothing is shown. Reload to try again.'); });

  (function () {
    var b = $('menu-btn'), n = $('nav-links'); if (!b || !n) return;
    function set(o) { n.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Close' : 'Menu'; }
    b.addEventListener('click', function () { set(!n.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('open')) { set(false); b.focus(); } });
  })();
})();
