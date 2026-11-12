(function () {
  var L = window.Lab, HOSTS = ['dns.google', 'cloudflare-dns.com'];
  var f = document.getElementById('f'), dom = document.getElementById('dom'), sel = document.getElementById('sel');
  var go = document.getElementById('go'), status = document.getElementById('status'), out = document.getElementById('out');
  var resolverUsed = '';

  function cleanDomain(v) {
    v = (v || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[\/?#].*$/, '').replace(/\.$/, '');
    if (v.length < 3 || v.length > 253) return '';
    var labels = v.split('.');
    if (labels.length < 2) return '';
    for (var i = 0; i < labels.length; i++) if (!/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(labels[i])) return '';
    return v;
  }
  /* DoH query. dns.google first, cloudflare on failure. Returns the JSON object. */
  function q(name, type, dnssec) {
    function one(base, extra) {
      var u = base + '?name=' + encodeURIComponent(name) + '&type=' + type + (dnssec ? '&do=1' : '') + (extra || '');
      return L.fetch(u, HOSTS, { headers: { Accept: 'application/dns-json' } }).then(function (j) {
        if (!j || typeof j !== 'object' || typeof j.Status !== 'number') throw new Error('bad dns json');
        return j;
      });
    }
    return one('https://dns.google/resolve').then(function (j) { resolverUsed = resolverUsed || 'Google Public DNS'; return j; }, function () {
      return one('https://cloudflare-dns.com/dns-query').then(function (j) { resolverUsed = 'Cloudflare DNS (fallback)'; return j; });
    });
  }
  function answers(j, type) {
    var a = Array.isArray(j.Answer) ? j.Answer : [];
    return a.filter(function (r) { return r && r.type === type && typeof r.data === 'string'; })
            .map(function (r) { return L.str(r.data, 4000); });
  }
  function txtJoin(d) {
    var parts = [], re = /"((?:[^"\\]|\\.)*)"/g, m;
    while ((m = re.exec(d))) parts.push(m[1].replace(/\\(.)/g, '$1'));
    return parts.length ? parts.join('') : d;
  }
  function txts(j) { return answers(j, 16).map(txtJoin); }
  function tag(rec) { var o = {}; rec.split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim(); }); return o; }

  /* Each check resolves to {id,title,status:'pass|warn|fail|info',weight,detail,fix,record} */
  function R(title, status, weight, detail, fix, record) { return { title: title, status: status, weight: weight, detail: detail, fix: fix || '', record: record || '' }; }

  function chkMX(d) {
    return q(d, 'MX').then(function (j) {
      var mx = answers(j, 15);
      if (!mx.length) return { r: R('MX records', 'info', 0, 'No mail servers are published, so this domain does not receive email.', 'If it should receive mail, add MX records. If not, publish a null MX ("0 .") and a "v=spf1 -all" SPF record.'), noMail: true };
      var nullMx = mx.length === 1 && /^0\s+\.?$/.test(mx[0].trim());
      if (nullMx) return { r: R('MX records', 'pass', 5, 'A null MX declares that this domain accepts no email.', '', mx.join('\n')), noMail: true };
      return { r: R('MX records', 'pass', 5, mx.length + ' mail server' + (mx.length > 1 ? 's' : '') + ' published.', '', mx.slice(0, 6).join('\n')) };
    });
  }
  function chkSPF(d, ctx) {
    return q(d, 'TXT').then(function (j) {
      var recs = txts(j).filter(function (t) { return /^v=spf1(\s|$)/i.test(t.trim()); });
      if (!recs.length) return R('SPF', ctx.noMail ? 'warn' : 'fail', 20, 'No SPF record. Anyone can claim to send mail as this domain without an easy way for receivers to tell.', 'Publish a TXT record such as "v=spf1 include:<your-mail-provider> -all". If the domain sends no mail: "v=spf1 -all".');
      if (recs.length > 1) return R('SPF', 'fail', 20, recs.length + ' SPF records found. Receivers treat more than one as a permanent error and ignore SPF entirely.', 'Merge them into a single v=spf1 record.', recs.join('\n'));
      var s = recs[0], toks = s.trim().split(/\s+/).slice(1), all = '', lookups = 0, ptr = false;
      toks.forEach(function (t) {
        var m = /^([+\-~?])?(all|include|a|mx|ptr|exists|redirect|exp)\b/i.exec(t); if (!m) return;
        var k = m[2].toLowerCase();
        if (k === 'all') all = (m[1] || '+') + 'all';
        if (/^(include|a|mx|ptr|exists|redirect)$/.test(k)) lookups++;
        if (k === 'ptr') ptr = true;
      });
      var issues = [], status = 'pass';
      if (all === '-all') {} else if (all === '~all') { status = 'warn'; issues.push('Ends in ~all (soft fail). Spoofed mail is flagged but often still delivered.'); }
      else if (all === '+all' || all === '?all') { status = 'fail'; issues.push('Ends in ' + all + ', which allows anyone to send as this domain.'); }
      else if (!/redirect=/i.test(s)) { status = 'warn'; issues.push('No "all" mechanism at the end, so unmatched senders are neutral.'); }
      if (lookups > 10) { status = 'fail'; issues.push('About ' + lookups + ' DNS lookups; the limit is 10, beyond which SPF breaks.'); }
      else if (lookups > 8 && status === 'pass') { status = 'warn'; issues.push(lookups + ' DNS lookups; close to the limit of 10.'); }
      if (ptr) { if (status === 'pass') status = 'warn'; issues.push('Uses the deprecated "ptr" mechanism.'); }
      return R('SPF', status, 20, issues.length ? issues.join(' ') : 'A single SPF record that ends in -all (hard fail).',
        status === 'pass' ? '' : 'Aim for one record, under 10 lookups, ending in -all once every legitimate sender is listed.', s);
    });
  }
  function chkDMARC(d) {
    return q('_dmarc.' + d, 'TXT').then(function (j) {
      var recs = txts(j).filter(function (t) { return /^v=DMARC1/i.test(t.trim()); });
      if (!recs.length) return R('DMARC', 'fail', 30, 'No DMARC record. Receivers have no policy for mail that fails SPF and DKIM, and you get no reports.', 'Start with TXT _dmarc: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain", read the reports, then move to quarantine and reject.');
      if (recs.length > 1) return R('DMARC', 'fail', 30, 'More than one DMARC record; receivers ignore all of them.', 'Keep a single v=DMARC1 record.', recs.join('\n'));
      var t = tag(recs[0]), p = (t.p || '').toLowerCase(), pct = t.pct ? parseInt(t.pct, 10) : 100, notes = [];
      if (p === 'reject') notes.push('Policy is reject, the strongest setting.');
      else if (p === 'quarantine') notes.push('Policy is quarantine: failing mail goes to spam.');
      else if (p === 'none') notes.push('Policy is none: monitoring only, spoofed mail is still delivered.');
      else notes.push('Policy tag p= is missing or invalid.');
      if (pct < 100 && pct >= 0) notes.push('Only ' + pct + '% of failing mail is subject to the policy.');
      if (!t.rua) notes.push('No rua= address, so you receive no aggregate reports.');
      var status = p === 'reject' && pct === 100 ? 'pass' : (p === 'reject' || p === 'quarantine') ? 'warn' : 'fail';
      if (p === 'reject' && pct === 100 && !t.rua) status = 'warn';
      return R('DMARC policy', status, 30, notes.join(' '),
        status === 'pass' ? '' : 'Work towards p=reject; pct=100; and add rua=mailto:... to see who is sending as you.', recs[0]);
    });
  }
  function chkDKIM(d, s) {
    if (!s) return Promise.resolve(R('DKIM', 'info', 0, 'Not checked. Enter a selector (for example "google", "selector1", "s1") to test one.', ''));
    var name = s + '._domainkey.' + d;
    return q(name, 'TXT').then(function (j) {
      var recs = txts(j).filter(function (t) { return /v=DKIM1|p=/i.test(t); });
      if (!recs.length) return R('DKIM (' + s + ')', 'fail', 10, 'No DKIM key found at that selector.', 'Check the selector name in your mail provider\'s settings, then publish the TXT record they give you.');
      var t = tag(recs[0]), key = (t.p || '').replace(/\s+/g, '');
      if (!key) return R('DKIM (' + s + ')', 'fail', 10, 'The key is empty, which means it has been revoked.', 'Publish a fresh key or remove the selector from your mail provider.', recs[0]);
      var approx = key.length > 380 ? 4096 : key.length > 215 ? 2048 : key.length > 150 ? 1024 : 512;
      var st = approx >= 2048 ? 'pass' : 'warn';
      return R('DKIM (' + s + ')', st, 10, 'Key found, roughly ' + approx + '-bit RSA.' + (st === 'warn' ? ' Under 2048 bits is weak.' : ''), st === 'warn' ? 'Rotate to a 2048-bit key.' : '', L.str(recs[0], 300));
    });
  }
  function chkMTASTS(d) {
    return q('_mta-sts.' + d, 'TXT').then(function (j) {
      var r = txts(j).filter(function (t) { return /^v=STSv1/i.test(t.trim()); });
      if (!r.length) return R('MTA-STS', 'warn', 10, 'No MTA-STS record. Mail between servers can be downgraded to plain text by an attacker on the path.', 'Publish TXT _mta-sts "v=STSv1; id=<timestamp>" and host a policy at https://mta-sts.<domain>/.well-known/mta-sts.txt.');
      return R('MTA-STS', 'pass', 10, 'MTA-STS record present. (Only the DNS record is checked; the policy file cannot be fetched from a browser.)', 'Make sure the policy mode is "enforce" once tested.', r[0]);
    });
  }
  function chkTLSRPT(d) {
    return q('_smtp._tls.' + d, 'TXT').then(function (j) {
      var r = txts(j).filter(function (t) { return /^v=TLSRPTv1/i.test(t.trim()); });
      if (!r.length) return R('TLS-RPT', 'info', 5, 'No TLS reporting record. You will not hear about failed encrypted deliveries.', 'Publish TXT _smtp._tls "v=TLSRPTv1; rua=mailto:tls@yourdomain".');
      return R('TLS-RPT', 'pass', 5, 'TLS reporting is configured.', '', r[0]);
    });
  }
  function chkBIMI(d) {
    return q('default._bimi.' + d, 'TXT').then(function (j) {
      var r = txts(j).filter(function (t) { return /^v=BIMI1/i.test(t.trim()); });
      if (!r.length) return R('BIMI', 'info', 0, 'No BIMI record. This is optional: it shows your logo in some inboxes and needs DMARC at enforcement.', '');
      return R('BIMI', 'pass', 0, 'BIMI record present (optional extra).', '', r[0]);
    });
  }
  function chkCAA(d) {
    return q(d, 'CAA').then(function (j) {
      var r = answers(j, 257);
      if (!r.length) return R('CAA', 'warn', 10, 'No CAA record, so any certificate authority may issue certificates for this domain.', 'Publish CAA records naming only the authorities you use, for example: 0 issue "letsencrypt.org".');
      return R('CAA', 'pass', 10, 'CAA limits which authorities may issue certificates.', '', r.slice(0, 5).join('\n'));
    });
  }
  function chkDNSSEC(d) {
    return q(d, 'A', true).then(function (j) {
      if (j.Status === 3) return R('DNSSEC', 'info', 0, 'The domain does not exist (NXDOMAIN).', '');
      if (j.AD === true) return R('DNSSEC', 'pass', 15, 'The resolver validated this answer with DNSSEC (AD flag set).', '');
      return R('DNSSEC', 'warn', 15, 'The answer was not DNSSEC-validated (AD flag not set). Forged DNS answers are harder to detect.', 'Enable DNSSEC at your DNS host and add the DS record at your registrar.');
    });
  }

  function grade(results) {
    var got = 0, max = 0;
    results.forEach(function (r) { if (!r.weight) return; max += r.weight; got += r.status === 'pass' ? r.weight : r.status === 'warn' ? r.weight * 0.5 : 0; });
    var pct = max ? Math.round(got / max * 100) : 0;
    var g = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
    return { pct: pct, g: g };
  }

  function render(d, results) {
    L.clear(out);
    var g = grade(results);
    var cls = g.g === 'A' ? 'is-ok' : g.g === 'B' ? 'is-mid' : g.g === 'C' ? 'is-warn' : 'is-bad';
    var wrap = L.el('div', 'lab-grade'), tile = L.el('div', 'lab-grade-tile ' + cls);
    tile.appendChild(L.el('div', 'lab-grade-letter', g.g));
    tile.appendChild(L.el('p', 'lab-grade-say', g.pct + ' out of 100'));
    var sum = L.el('div', 'lab-grade-sum');
    sum.appendChild(L.el('h2', '', d));
    var fails = results.filter(function (r) { return r.status === 'fail'; }).length, warns = results.filter(function (r) { return r.status === 'warn'; }).length;
    sum.appendChild(L.el('p', '', fails + ' failing, ' + warns + ' to improve, ' + results.filter(function (r) { return r.status === 'pass'; }).length + ' passing.'));
    sum.appendChild(L.el('p', 'dw-note', 'Answered by ' + (resolverUsed || 'DNS-over-HTTPS') + '. Results are a snapshot of public DNS right now.'));
    wrap.appendChild(tile); wrap.appendChild(sum); out.appendChild(wrap);
    var rows = L.el('div', 'lab-rows');
    results.forEach(function (r) {
      var row = L.el('div', 'lab-row'), head = L.el('div', 'lab-row-head');
      head.appendChild(L.el('h3', '', r.title));
      head.appendChild(L.el('span', 'lab-pill ' + r.status, { pass: 'PASS', warn: 'IMPROVE', fail: 'FAIL', info: 'INFO' }[r.status]));
      row.appendChild(head);
      row.appendChild(L.el('p', '', r.detail));
      if (r.fix) row.appendChild(L.el('p', 'fix', 'Fix: ' + r.fix));
      if (r.record) row.appendChild(L.el('code', '', r.record));
      rows.appendChild(row);
    });
    out.appendChild(rows);
  }

  var busy = false;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var d = cleanDomain(dom.value);
    if (!d) { L.status(status, 'Enter a valid domain such as example.com (letters, digits and hyphens only).', 'is-err'); L.clear(out); return; }
    var s = sel.value.trim().toLowerCase();
    if (s && !/^[a-z0-9]([a-z0-9._-]{0,61}[a-z0-9])?$/.test(s)) { L.status(status, 'The DKIM selector may only contain letters, digits, dots, hyphens and underscores.', 'is-err'); return; }
    busy = true; go.disabled = true; resolverUsed = ''; L.clear(out);
    L.status(status, 'Asking public DNS about ' + d + '...', '');
    chkMX(d).then(function (mx) {
      return Promise.all([chkSPF(d, mx), chkDMARC(d), chkDKIM(d, s), chkMTASTS(d), chkTLSRPT(d), chkBIMI(d), chkCAA(d), chkDNSSEC(d)]).then(function (rest) {
        return [mx.r].concat(rest);
      });
    }).then(function (results) {
      L.status(status, '');
      var order = { fail: 0, warn: 1, pass: 2, info: 3 };
      results.sort(function (a, b) { return order[a.status] - order[b.status]; });
      render(d, results);
    }).catch(function () {
      L.status(status, 'DNS lookup failed or timed out (both resolvers). Check your connection and try again.', 'is-err');
    }).then(function () { busy = false; go.disabled = false; });
  });
})();
