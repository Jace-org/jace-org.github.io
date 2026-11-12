(function () {
  var L = window.Lab, HOSTS = ['api.pwnedpasswords.com'];
  var f = document.getElementById('f'), pw = document.getElementById('pw'), go = document.getElementById('go');
  var tog = document.getElementById('tog'), status = document.getElementById('status'), out = document.getElementById('out');
  var busy = false;

  tog.addEventListener('click', function () {
    var show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    tog.textContent = show ? 'Hide' : 'Show';
    tog.setAttribute('aria-pressed', String(show));
  });

  function sha1hex(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-1', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('').toUpperCase();
    });
  }
  function step(title, cls) { var s = L.el('div', 'lab-step' + (cls ? ' ' + cls : '')); s.appendChild(L.el('h3', '', title)); return s; }

  function render(hash, prefix, suffix, lines, count) {
    L.clear(out);
    var flow = L.el('div', 'lab-flow');
    var a = step('1. Hashed here');
    a.appendChild(L.el('p', '', 'Your browser turned the password into a 40-character SHA-1 fingerprint. A hash cannot be reversed, but it can be matched.'));
    var h = L.el('div', 'lab-hash'); h.appendChild(L.el('span', 'sent', prefix)); h.appendChild(L.el('span', 'kept', suffix));
    a.appendChild(h);
    a.appendChild(L.el('p', 'dw-note', 'Highlighted: the part that leaves. Grey: the part that stays.'));
    var b = step('2. What left your machine', 'is-sent');
    b.appendChild(L.el('p', '', 'Exactly one request, containing only these 5 characters:'));
    b.appendChild(L.el('code', 'lab-code', 'GET https://api.pwnedpasswords.com/range/' + prefix + '\nAdd-Padding: true'));
    b.appendChild(L.el('p', '', 'Not sent: your password, the other 35 hash characters, or any cookie.'));
    var c = step('3. Matched here');
    c.appendChild(L.el('p', '', 'The service replied with ' + L.fmt(lines) + ' hash endings (some are padding) that share your prefix. Your browser looked for its own 35-character ending in that list; the service never learns which one, if any, you wanted.'));
    flow.appendChild(a); flow.appendChild(b); flow.appendChild(c);
    out.appendChild(flow);
    var v = L.el('div', 'lab-verdict ' + (count > 0 ? 'is-bad' : 'is-ok'));
    if (count > 0) {
      v.appendChild(document.createTextNode('Found in ' + L.fmt(count) + ' breach record' + (count === 1 ? '' : 's') + '. Do not use this password anywhere.'));
      v.appendChild(L.el('small', '', 'Attackers try leaked passwords first. Change it wherever it is used and prefer a password manager with a long random one.'));
    } else {
      v.appendChild(document.createTextNode('Not found in the known breach list.'));
      v.appendChild(L.el('small', '', 'That is good, but not proof it is strong: a short or guessable password can still fall to guessing. Length beats cleverness.'));
    }
    out.appendChild(v);
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var val = pw.value;
    if (!val) { L.status(status, 'Type a password first.', 'is-err'); L.clear(out); return; }
    if (!(window.crypto && crypto.subtle)) { L.status(status, 'This browser cannot do hashing here (WebCrypto needs a secure connection).', 'is-err'); return; }
    busy = true; go.disabled = true; L.clear(out); L.status(status, 'Hashing and checking...', '');
    sha1hex(val).then(function (hash) {
      val = ''; pw.value = '';
      var prefix = hash.slice(0, 5), suffix = hash.slice(5);
      return L.fetch('https://api.pwnedpasswords.com/range/' + prefix, HOSTS, { text: true, headers: { 'Add-Padding': 'true' } }).then(function (body) {
        if (typeof body !== 'string') throw new Error('bad body');
        var lines = body.split(/\r?\n/), count = 0, n = 0;
        lines.forEach(function (ln) {
          var m = /^([0-9A-F]{35}):(\d{1,12})$/i.exec(ln.trim());
          if (!m) return;
          n++;
          if (m[1].toUpperCase() === suffix) count = Math.max(count, parseInt(m[2], 10));
        });
        if (!n) throw new Error('no data');
        L.status(status, '');
        render(hash, prefix, suffix, n, count);
      });
    }).catch(function () {
      L.status(status, 'The breach service did not answer or sent unexpected data. Nothing was found or stored; try again later.', 'is-err');
    }).then(function () { busy = false; go.disabled = false; val = ''; });
  });
  window.addEventListener('pagehide', function () { pw.value = ''; });
})();
