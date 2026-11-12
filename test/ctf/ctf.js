/* Static CTF terminal. Flags are never stored here, only SHA-256 hashes. */
(function () {
  'use strict';
  var KEY = 'jk-ctf-v1';
  var CH = [
 {
  "id": 1,
  "name": "Read the notes",
  "desc": "A plain text file sits in the assets folder. Machines read these, and so can you.",
  "h1": "Real files live next to this page. Try /test/ctf/assets/ and think about which file name security researchers always check.",
  "h2": "security.txt. The comment line holds the flag as base64. Decode it (atob in the console, or base64 -d)."
 },
 {
  "id": 2,
  "name": "Dressed to hide",
  "desc": "The stylesheet of this page was written by someone who likes leaving notes.",
  "h1": "Open the Network tab or view source, then find the CSS file this page loads.",
  "h2": "Search ctf.css for a comment. It is ROT13: every letter moved 13 places. Decode it."
 },
 {
  "id": 3,
  "name": "Page not found",
  "desc": "Every site has a page that says nothing. This one says a little more.",
  "h1": "There is a fake 404 page inside assets/. Guess its name from what it is called in this challenge list: it is the page that is lost.",
  "h2": "assets/lost.html. Look at the page source, there is an HTML comment with base64."
 },
 {
  "id": 4,
  "name": "Ghost in the DOM",
  "desc": "Something appears on this page only after the scripts run. View-source will not show it.",
  "h1": "Use the browser inspector (Elements tab), not view-source. Look for an element with an id that sounds spooky.",
  "h2": "Find #ghost near the end of the page. Its text is the flag."
 },
 {
  "id": 5,
  "name": "Pixel notes",
  "desc": "The badge image has metadata that the picture itself does not show.",
  "h1": "Download assets/badge.png and read its text chunks: strings badge.png, exiftool, or zsteg.",
  "h2": "The Comment chunk starts with hex: then hex bytes. Convert the hex to ASCII."
 },
 {
  "id": 6,
  "name": "Reverse lookup",
  "desc": "Pure knowledge, no website needed. 203.0.113.7 is a documentation address (RFC 5737). What is the name used to look up its PTR record?",
  "h1": "PTR records live under in-addr.arpa with the octets reversed. Try: dig -x 203.0.113.7 (it will not answer, that is fine).",
  "h2": "Flag format JK{name}: reverse the four octets, then add .in-addr.arpa. No real DNS record is involved."
 },
 {
  "id": 7,
  "name": "Console whisperer",
  "desc": "The page talks to the developer console when it loads.",
  "h1": "Open DevTools and read the Console tab right after reloading.",
  "h2": "Look for a message marked psst. It is base64."
 },
 {
  "id": 8,
  "name": "Hidden file",
  "desc": "The terminal below has a file that plain ls does not show.",
  "h1": "On Linux, files starting with a dot are hidden. ls has a flag for that.",
  "h2": "Run ls -a then cat the file. The letters are shifted by 3 (a becomes d). Shift them back."
 }
];
  var HASH = ["74e0bff5c19811d7d003fef26b537e16bf8e74160347336f52f5f7b8b7ec80b7", "2b5b6400f5720f94ff151ade2e89f02e4a051e84053081070ef175b675c51423", "55acc6cad366a7b25ea2f46b00ec9c8fbf54b0b2100727abc0511120dc4156e9", "b301f36585cee4d0f3c63e304d1a687b4ee64e88f28a509369cefbf13955fd1c", "c2a242b85d33526543dc6b7c3baee218af24c8fd11121d5b45b27bc809e624b1", "70bfff552263c54217593233cfe52d6cbe9bca4a4afe279bf48cab49eaa8cec2", "bf023f030b14e74d56a13299d54a52a3c5e3200aca2c6ae2e3a25e1b15887fc5", "6b186d017cfa27241c62ed4ebbed81cb8b61413c216d0259a3259f1e5525f14a"];
  var out = document.getElementById('out'), form = document.getElementById('form'), inp = document.getElementById('cmd');
  var grid = document.getElementById('flags'), meter = document.getElementById('meter');
  var solved = [], hintsUsed = {};
  var canStore = true;

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(raw)) solved = raw.filter(function (n) { return typeof n === 'number' && n >= 1 && n <= CH.length; });
    } catch (e) { canStore = false; solved = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(solved)); } catch (e) { canStore = false; } }

  function print(text, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
    return d;
  }
  function printLink(label, href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return; }
    if (u.origin !== location.origin) return;
    var d = document.createElement('div'), a = document.createElement('a');
    a.textContent = label; a.href = u.pathname; a.target = '_blank'; a.rel = 'noopener';
    d.appendChild(a); out.appendChild(d); out.scrollTop = out.scrollHeight;
  }

  function renderBoard() {
    grid.textContent = '';
    CH.forEach(function (c) {
      var done = solved.indexOf(c.id) !== -1;
      var li = document.createElement('li');
      li.className = 't-flag' + (done ? ' is-done' : '');
      var b = document.createElement('b'); b.textContent = '#' + c.id;
      var s = document.createElement('span'); s.textContent = done ? c.name + ' - solved' : c.name;
      li.appendChild(b); li.appendChild(s); grid.appendChild(li);
    });
    meter.textContent = solved.length + ' of ' + CH.length + ' flags';
  }

  function sha256(str) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('nocrypto'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  var FILES = {
    'README.txt': 'Welcome, guest. There are %d flags hidden on this site and in your own knowledge.\nEvery flag looks like JK{something}. Find one, then: submit JK{...}\nStuck? hint <number>. Nothing here attacks anything: it is all static files.',
    'targets.txt': null,
    '.cache': 'Letters in the line below are shifted by 3 (a became d). Shift them back.\nMN{fdhvdu_zdv_khuh}'
  };

  var cmds = {
    help: function () {
      ['help               show this list', 'ls [-a]            list files', 'cat <file>         read a file', 'challenges         list the challenges',
       'hint <n>           a hint for challenge n (try twice for more)', 'submit <flag>      check a flag, e.g. submit JK{example}',
       'score              your progress', 'whoami            who you are', 'clear              clear the screen', 'reset              forget your progress'
      ].forEach(function (l) { print(l); });
    },
    whoami: function () { print('guest@lab  (read-only, nothing here can hurt you)'); },
    ls: function (a) {
      var all = a[0] === '-a';
      var names = ['README.txt', 'targets.txt', 'badge.png (real file: /test/ctf/assets/badge.png)'];
      if (all) names.push('.cache');
      print(names.join('\n'));
    },
    cat: function (a) {
      var f = a[0];
      if (!f) return print('usage: cat <file>', 'bad');
      if (f === 'README.txt') return print(FILES['README.txt'].replace('%d', CH.length));
      if (f === '.cache') return print(caesarFile());
      if (f === 'targets.txt') {
        print('Places worth a look (all on this site):', 'dim');
        printLink('/test/ctf/assets/  (a folder of odd files)', 'assets/security.txt');
        printLink('/test/ctf/assets/badge.png', 'assets/badge.png');
        printLink('/test/ctf/assets/lost.html', 'assets/lost.html');
        print('Also worth a look: this page\'s own CSS, its DOM, and its console.', 'dim');
        return;
      }
      print('cat: ' + f.slice(0, 40) + ': No such file', 'bad');
    },
    challenges: function () {
      CH.forEach(function (c) {
        var done = solved.indexOf(c.id) !== -1;
        print('#' + c.id + ' ' + (done ? '[x] ' : '[ ] ') + c.name + ' - ' + c.desc, done ? 'ok' : '');
      });
    },
    hint: function (a) {
      var n = parseInt(a[0], 10), c = CH[n - 1];
      if (!c) return print('usage: hint <1-' + CH.length + '>', 'bad');
      var used = hintsUsed[n] || 0;
      if (used >= 2) return print('No more hints for #' + n + '. You can do it.', 'dim');
      hintsUsed[n] = used + 1;
      print('hint ' + (used + 1) + '/2 for #' + n + ': ' + (used === 0 ? c.h1 : c.h2), 'dim');
    },
    score: function () {
      print('Solved ' + solved.length + ' of ' + CH.length + '. ' + (solved.length === CH.length ? 'You found everything. Respect.' : 'Keep going.'), 'ok');
      if (!canStore) print('(Progress cannot be saved in this browser, so it resets when you leave.)', 'dim');
    },
    clear: function () { out.textContent = ''; },
    reset: function () { solved = []; save(); renderBoard(); print('Progress cleared.', 'dim'); },
    submit: function (a, raw) {
      var flag = raw.replace(/^submit\s*/i, '').trim().slice(0, 120);
      if (!flag) return print('usage: submit JK{...}', 'bad');
      sha256(flag).then(function (h) {
        var idx = HASH.indexOf(h);
        if (idx === -1) return print('Nope. That is not one of the flags.', 'bad');
        var id = idx + 1;
        if (solved.indexOf(id) !== -1) return print('Already have that one (#' + id + ').', 'dim');
        solved.push(id); save(); renderBoard();
        print('Correct! #' + id + ' ' + CH[idx].name + ' solved. ' + solved.length + '/' + CH.length, 'ok');
        if (solved.length === CH.length) print('All flags found. The door is yours. Say hi: use Contact on the homepage.', 'ok');
      }, function () { print('This browser has no WebCrypto here (it needs https or localhost), so flags cannot be checked.', 'bad'); });
    }
  };
  function caesarFile() { return FILES['.cache']; }

  function run(line) {
    print('guest@lab:~$ ' + line.slice(0, 200), 'cmd');
    var parts = line.trim().split(/\s+/), name = (parts.shift() || '').toLowerCase();
    if (!name) return;
    if (Object.prototype.hasOwnProperty.call(cmds, name)) cmds[name](parts, line.trim());
    else if (name === 'sudo') print('Nice try. guest is not in the sudoers file. This incident will not be reported.', 'bad');
    else print(name.slice(0, 40) + ': command not found. Try help.', 'bad');
  }

  /* Challenge 4: a node that only exists after scripts run, built from an obfuscated string. */
  (function ghost() {
    var g = document.createElement('div');
    g.id = 'ghost'; g.className = 't-ghost';
    var enc = '=0XZ2lGbh91cp9VbvR2XlhGd7tkS';
    try { g.textContent = atob(enc.split('').reverse().join('')); } catch (e) {}
    document.body.appendChild(g);
  })();
  /* Challenge 7: console message. */
  try { console.info('%cpsst: Skt7Y29uc29sZV93aGlzcGVyZXJ9', 'color:#ffd60a'); } catch (e) {}

  load(); renderBoard();
  print('Static CTF lab. Type help to start. Nothing here attacks anything.', 'dim');
  form.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; run(v); });
  document.getElementById('menu-btn') && (function () {
    var b = document.getElementById('menu-btn'), n = document.getElementById('nav-links');
    function set(o) { n.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Close' : 'Menu'; }
    b.addEventListener('click', function () { set(!n.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('open')) { set(false); b.focus(); } });
  })();
})();
