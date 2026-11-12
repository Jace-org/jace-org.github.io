/* Mobile menu toggle for the shared site nav on /pulse/ and /security/ (mirrors main.js behaviour). */
(function () {
  var b = document.getElementById('menu-btn'), n = document.getElementById('nav-links');
  if (!b || !n) return;
  function set(o) { n.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Close' : 'Menu'; }
  b.addEventListener('click', function () { set(!n.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('open')) { set(false); b.focus(); } });
})();
