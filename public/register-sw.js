// Early ES5 service-worker registration, loaded from public/index.html.
// Kept as an external file (not an inline <script>) so the CSP can drop
// 'unsafe-inline' from script-src — see nginx.conf.
//
// Register the service worker (versioned precache + audio cache). Skipped
// on localhost so it never interferes with the Metro dev server / HMR —
// test the PWA from a production build (`expo export -p web`). sw.js is
// in /public.
//
// This script only does the early ES5 registration. Background update
// checks and the update confirmation modal live in the app bundle
// (features/web-update): the SW precaches the whole dist manifest at
// build time and serves it cache-first, so normal opens never hit the
// server. New versions are detected by the bundle (60-min interval +
// online + visibility), downloaded into a new cache bucket and left
// WAITING; the user confirms the update in a modal, the page posts
// SKIP_WAITING, the SW activates and the page reloads.
(function () {
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if ('serviceWorker' in navigator && !isLocal) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (error) {
        console.warn('[pwa] service worker registration failed:', error);
      });
    });
  } else if ('serviceWorker' in navigator && isLocal) {
    // Clean up a worker left over from a previous production-style run.
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) {
        reg.unregister();
      });
    });
  }
})();
