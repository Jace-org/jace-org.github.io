/* The ONE place the data endpoint is defined.
   ?fixtures=1 serves local sample JSON from /widgets/fixtures/ (same-origin, testing only);
   ?fixtures=stale serves old-timestamp samples; ?fixtures=bad serves deliberately broken/hostile samples from /widgets/fixtures/bad/. */
(function () {
  var DATA_BASE = 'https://datastats.abcnews.com.np/v1/';
  var base = DATA_BASE;
  try {
    var f = new URLSearchParams(location.search).get('fixtures');
    if (f === '1') base = '/widgets/fixtures/';
    else if (f === 'stale') base = '/widgets/fixtures/stale/';
    else if (f === 'bad') base = '/widgets/fixtures/bad/';
  } catch (e) { /* keep default */ }
  window.DATA_BASE = base;
})();
