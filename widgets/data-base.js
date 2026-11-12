/* The ONE place the data endpoint is defined.
   ?fixtures=1 serves local sample JSON from /widgets/fixtures/ (local dev only; fixtures live outside the published repo);
   ?fixtures=stale serves old-timestamp samples; ?fixtures=bad serves deliberately broken/hostile samples from /widgets/fixtures/bad/. */
(function () {
  var DATA_BASE = 'https://datastats.abcnews.com.np/v1/';
  var base = DATA_BASE;
  try {
    // Sample-data switch works on a local dev server only; on the live site it is ignored.
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var f = local ? new URLSearchParams(location.search).get('fixtures') : null;
    if (f === '1') base = '/widgets/fixtures/';
    else if (f === 'stale') base = '/widgets/fixtures/stale/';
    else if (f === 'bad') base = '/widgets/fixtures/bad/';
  } catch (e) { /* keep default */ }
  window.DATA_BASE = base;
})();
