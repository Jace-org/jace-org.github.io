/* Shared helpers for the /test security tools. Vanilla, textContent only, 8 s timeouts, https allowlists. */
(function () {
  var Lab = {};
  Lab.el = function (tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  };
  Lab.clear = function (n) { while (n.firstChild) n.removeChild(n.firstChild); };
  Lab.str = function (v, max) {
    if (typeof v !== 'string') return '';
    v = v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    return v.length > max ? v.slice(0, max - 1) + '…' : v;
  };
  Lab.num = function (v) { var n = typeof v === 'string' ? parseFloat(v) : v; return typeof n === 'number' && isFinite(n) ? n : null; };
  Lab.fmt = function (n) { return n.toLocaleString('en-US'); };
  /* Fetch with an 8 s abort. hosts = allowed hostnames; https only. Resolves {res, json|text}. */
  Lab.fetch = function (url, hosts, opts) {
    opts = opts || {};
    var u;
    try { u = new URL(url); } catch (e) { return Promise.reject(new Error('bad url')); }
    if (u.protocol !== 'https:' || hosts.indexOf(u.hostname) === -1) return Promise.reject(new Error('blocked host'));
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 8000);
    return fetch(u.href, {
      signal: ctl.signal, headers: opts.headers || {}, cache: 'no-store',
      credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors'
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return opts.text ? res.text() : res.json();
    }).then(function (b) { clearTimeout(timer); return b; },
            function (e) { clearTimeout(timer); throw e; });
  };
  Lab.status = function (node, msg, cls) {
    node.hidden = !msg; node.className = 'dw-status ' + (cls || '');
    node.textContent = msg || '';
  };
  Lab.chip = function (text, cls) { return Lab.el('span', 'lab-chip' + (cls ? ' ' + cls : ''), text); };
  Lab.safeHref = function (href, hosts) {
    try { var u = new URL(href); return u.protocol === 'https:' && hosts.indexOf(u.hostname) !== -1 ? u.href : ''; } catch (e) { return ''; }
  };
  Lab.link = function (href, text) {
    var a = Lab.el('a', '', text); a.href = href; a.rel = 'noopener noreferrer'; a.target = '_blank'; return a;
  };
  window.Lab = Lab;
})();
