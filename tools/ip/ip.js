(function () {
  var L = window.Lab, HOSTS = ['stat.ripe.net'], BASE = 'https://stat.ripe.net/data/';
  var f = document.getElementById('f'), q = document.getElementById('q'), go = document.getElementById('go');
  var me = document.getElementById('me'), status = document.getElementById('status'), out = document.getElementById('out');
  var busy = false;

  function v4(s) {
    var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s); if (!m) return null;
    var p = m.slice(1).map(Number); return p.every(function (n) { return n <= 255; }) ? p : null;
  }
  function privateV4(p) {
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || p[0] >= 224 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127);
  }
  function v6ok(s) { return /^[0-9a-f:]{2,39}$/i.test(s) && s.indexOf(':') !== -1 && !/:::/.test(s) && (s.match(/::/g) || []).length <= 1 && s.split(':').length <= 8; }
  /* Returns {kind:'ip'|'prefix'|'asn', value} or {error} */
  function parse(raw) {
    var s = raw.trim();
    if (!s) return { error: 'Enter an IP address, a prefix like 8.8.8.0/24, or an AS number like AS15169.' };
    var a = /^as?\s*(\d{1,10})$/i.exec(s);
    if (a && +a[1] > 0 && +a[1] < 4294967295) return { kind: 'asn', value: 'AS' + a[1] };
    var parts = s.split('/'); if (parts.length > 2) return { error: 'That does not look like an IP address or prefix.' };
    var addr = parts[0], len = parts.length === 2 ? parts[1] : null;
    if (len !== null && !/^\d{1,3}$/.test(len)) return { error: 'The prefix length must be a number.' };
    var p = v4(addr);
    if (p) {
      if (len !== null && +len > 32) return { error: 'An IPv4 prefix length is 0 to 32.' };
      if (privateV4(p)) return { error: 'That is a private or reserved address, so it has no public owner. Try a public one.' };
      return { kind: len === null ? 'ip' : 'prefix', value: addr + (len === null ? '' : '/' + len) };
    }
    if (v6ok(addr)) {
      if (len !== null && +len > 128) return { error: 'An IPv6 prefix length is 0 to 128.' };
      if (/^(::1?|fe80:|fc|fd|ff)/i.test(addr)) return { error: 'That is a private or reserved IPv6 address, so it has no public owner.' };
      return { kind: len === null ? 'ip' : 'prefix', value: addr + (len === null ? '' : '/' + len) };
    }
    return { error: 'That does not look like an IP address, prefix or AS number.' };
  }
  function ripe(path, resource, extra) {
    return L.fetch(BASE + path + '/data.json?resource=' + encodeURIComponent(resource) + (extra || ''), HOSTS).then(function (j) {
      if (!j || typeof j !== 'object' || j.status !== 'ok' || !j.data || typeof j.data !== 'object') throw new Error('bad ripe');
      return j.data;
    });
  }
  function kv(pairs) {
    var dl = L.el('dl', 'lab-kv');
    pairs.forEach(function (p) { if (!p[1]) return; var d = L.el('div'); d.appendChild(L.el('dt', '', p[0])); d.appendChild(L.el('dd', '', p[1])); dl.appendChild(d); });
    return dl;
  }
  function card(h, kids) { var c = L.el('section'); c.appendChild(L.el('h2', 'dw-h2', h)); kids.forEach(function (k) { c.appendChild(k); }); return c; }
  function copy(t) { return L.el('p', 'dw-copy', t); }

  function lookup(input) {
    var asnP, prefix = null;
    var chain;
    if (input.kind === 'asn') {
      chain = Promise.resolve({ asns: [{ asn: parseInt(input.value.slice(2), 10) }], prefixData: null });
    } else {
      chain = ripe('prefix-overview', input.value).then(function (d) {
        var asns = Array.isArray(d.asns) ? d.asns.filter(function (a) { return a && Number.isInteger(a.asn); }).slice(0, 5) : [];
        return { asns: asns, prefixData: d };
      });
    }
    return chain.then(function (r) {
      var first = r.asns[0], pd = r.prefixData;
      if (pd && typeof pd.resource === 'string' && /^[0-9a-f:.\/]{3,60}$/i.test(pd.resource)) prefix = pd.resource;
      var pAS = first ? ripe('as-overview', 'AS' + first.asn).catch(function () { return null; }) : Promise.resolve(null);
      var pRpki = first && prefix ? ripe('rpki-validation', 'AS' + first.asn, '&prefix=' + encodeURIComponent(prefix)).catch(function () { return null; }) : Promise.resolve(null);
      return Promise.all([pAS, pRpki]).then(function (x) { return { r: r, as: x[0], rpki: x[1], prefix: prefix }; });
    });
  }

  function render(input, res) {
    L.clear(out);
    var r = res.r, pd = r.prefixData, first = r.asns[0], as = res.as;
    var holder = as && L.str(as.holder, 160);
    if (pd) {
      var announced = pd.announced === true;
      var rows = [
        ['You looked up', input.value],
        ['Smallest announced prefix', announced ? L.str(pd.resource, 60) : 'Not announced in global routing'],
        ['Origin AS', r.asns.length ? r.asns.map(function (a) { return 'AS' + a.asn + (a.holder ? ' (' + L.str(a.holder, 100) + ')' : ''); }).join(', ') : 'None'],
        ['Address block registry', pd.block && L.str(pd.block.desc, 160)],
        ['Block name', pd.block && L.str(pd.block.name, 160)]
      ];
      out.appendChild(card('Who has this address', [kv(rows),
        copy(announced ? 'Networks announce the address ranges they use through BGP. The origin AS is the network that claims this range, and the holder is who it is registered to. It is the owner of the route, which is not always the owner of the machine behind it: cloud, hosting and VPN customers share their provider\'s ranges.'
                       : 'Nobody is announcing this range on the public internet right now, so traffic to it will not route. It may be unused, reserved, or briefly withdrawn.')]));
    }
    if (first) {
      var asRows = [['AS number', 'AS' + first.asn], ['Holder', holder], ['Announcing now', as ? (as.announced ? 'Yes' : 'No') : ''], ['Registry block', as && as.block && L.str(as.block.desc, 160)]];
      out.appendChild(card('The network behind it', [kv(asRows),
        copy('An autonomous system (AS) is a network run by one organisation, such as an ISP, company or university, that has its own routing policy and a number.')]));
    }
    if (res.rpki) {
      var st = L.str(res.rpki.status, 20).toLowerCase();
      var say = { valid: 'Valid: a signed record (ROA) authorises this AS to announce this prefix. Hijack attempts by other networks would be rejected by networks that check.',
                  invalid: 'Invalid: a signed record exists, but this announcement does not match it (wrong AS or too-specific prefix). Networks that filter on RPKI will drop it. Possible misconfiguration or hijack.',
                  unknown: 'Unknown: no signed record covers this prefix. It still routes, but nothing cryptographic protects it from being hijacked.' }[st];
      var pill = L.el('p', 'dw-copy'); pill.appendChild(L.el('span', 'lab-pill ' + (st === 'valid' ? 'pass' : st === 'invalid' ? 'fail' : 'warn'), 'RPKI ' + (say ? st.toUpperCase() : 'UNREADABLE')));
      out.appendChild(card('Is the route signed (RPKI)?', [pill, copy(say || 'The validator returned a status this page does not recognise.')]));
    } else if (first && res.prefix) {
      out.appendChild(card('Is the route signed (RPKI)?', [copy('The RPKI check did not respond, so there is no verdict here. The ownership data above is still valid.')]));
    }
    if (!pd && !first) out.appendChild(copy('Nothing came back for that input.'));
  }

  function run(raw) {
    var input = parse(raw);
    L.clear(out);
    if (input.error) { L.status(status, input.error, 'is-err'); return; }
    busy = true; go.disabled = true; me.disabled = true; L.status(status, 'Asking RIPEstat about ' + input.value + '...', '');
    lookup(input).then(function (res) { L.status(status, ''); render(input, res); })
      .catch(function () { L.status(status, 'RIPEstat did not answer in time or sent something unexpected. Try again in a moment.', 'is-err'); })
      .then(function () { busy = false; go.disabled = false; me.disabled = false; });
  }
  f.addEventListener('submit', function (e) { e.preventDefault(); if (!busy) run(q.value); });
  me.addEventListener('click', function () {
    if (busy) return;
    L.status(status, 'Asking RIPEstat for the address it sees you at...', '');
    me.disabled = true;
    ripe('whats-my-ip', '').then(function (d) {
      var ip = typeof d.ip === 'string' ? d.ip.trim() : '';
      var p = parse(ip);
      if (p.error || p.kind !== 'ip') throw new Error('bad ip');
      q.value = ip; L.status(status, 'Your address is filled in. Press "Look up" to continue.', '');
      q.focus();
    }).catch(function () { L.status(status, 'Could not find your address automatically. Type one instead.', 'is-warn'); })
      .then(function () { me.disabled = false; });
  });
})();
