// @ts-check
/// <reference lib="webworker" />
/// <reference lib="es2018" />

/*
 * Слово.Проповеди — service worker.
 *
 * Two jobs:
 *  1. Versioned app precache — at build time scripts/inject-sw-precache.mjs
 *     writes the dist file manifest and a content hash into BUILD_VERSION and
 *     PRECACHE_URLS below. On install the whole manifest is downloaded into a
 *     versioned bucket (`precache-v<hash>`); navigations and same-origin
 *     static assets are served cache-first from it, so normal opens never hit
 *     the server. Activation is user-driven: a new build installs into a NEW
 *     bucket and then WAITS in `waiting` (install never calls skipWaiting).
 *     The page (features/web-update) shows a confirmation modal when a
 *     waiting worker appears; on "Обновить" it posts { type: 'SKIP_WAITING' },
 *     the worker activates (activate drops the old buckets + clients.claim),
 *     the page reloads on controllerchange and serves the fresh build. The
 *     very first install (no controller yet) activates itself with no dialog.
 *  2. Offline audio — serve sermon audio from the Cache Storage bucket that
 *     AudioCacheService.web fills on an explicit "download". Uncached audio is
 *     streamed straight from the network, exactly like on native.
 *
 * Plain ES2018, no bundler. Registered from /public/index.html.
 * `@ts-check` above type-checks this file in the editor (it is excluded from the
 * project tsconfig); the reference libs pull in ServiceWorker + Cache typings.
 */

'use strict'

/** @typedef {ServiceWorkerGlobalScope} SW */
const sw = /** @type {SW & typeof globalThis} */ (
  /** @type {unknown} */ (self)
)

/**
 * @type {string} Cache bucket for downloaded sermon audio.
 * Keep in sync with AUDIO_CACHE_NAME in src/shared/lib/audio-cache/webCacheApi.ts.
 */
const AUDIO_CACHE = 'audio-cache-v1'

/** Build version, injected by scripts/inject-sw-precache.mjs at build time. */
const BUILD_VERSION = '__SW_BUILD_VERSION__'
/**
 * @type {string[]} Dist file manifest, injected at build time (a string in
 * source; dev never precaches).
 */
const PRECACHE_URLS = /** @type {string[]} */ (
  /** @type {unknown} */ ('__SW_PRECACHE_URLS__')
)

/** @type {string} Versioned cache bucket holding the current build's files. */
const PRECACHE = 'precache-v' + BUILD_VERSION

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|opus|wav|flac)(\?|$)/i
const DEV_HOSTS = ['localhost', '127.0.0.1']
/** @type {boolean} On the Metro dev host the SW only manages the audio cache. */
const isDev = DEV_HOSTS.indexOf(sw.location.hostname) !== -1

sw.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.resolve()
      .then(() => {
        if (isDev) return undefined
        // addAll is all-or-nothing: if any file fails to download, install
        // fails and the old SW keeps serving the old fully-cached version;
        // the next update check retries.
        return caches.open(PRECACHE).then((cache) =>
          cache.addAll(
            PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })),
          ),
        )
      }),
  )
})

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Never drop AUDIO_CACHE on a SW update — those are the user's downloads.
            // This also cleans up the legacy shell-cache-v1 bucket.
            .filter((key) => key !== PRECACHE && key !== AUDIO_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => sw.clients.claim()),
  )
})

// Activation is user-driven: the page asks the waiting worker to take over
// only after the user confirms the update dialog (features/web-update).
sw.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') sw.skipWaiting()
})

/**
 * Whether a request is for an audio file (media element or known extension).
 * @param {Request} request
 * @param {URL} url
 * @returns {boolean}
 */
function isAudioRequest(request, url) {
  return request.destination === 'audio' || AUDIO_EXT.test(url.pathname)
}

/**
 * Return a cached audio response, honouring a `Range` header when the body is
 * readable. Opaque (cross-origin, no-CORS) bodies can't be sliced, so they are
 * handed back whole — the media element copes fine.
 * @param {Request} request
 * @param {Response} cached
 * @returns {Promise<Response>}
 */
function serveWithRange(request, cached) {
  const rangeHeader = request.headers.get('range')
  if (!rangeHeader || cached.type === 'opaque') return Promise.resolve(cached)

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match) return Promise.resolve(cached)

  return cached.arrayBuffer().then((buffer) => {
    const total = buffer.byteLength
    const start = match[1] ? parseInt(match[1], 10) : 0
    let end = match[2] ? parseInt(match[2], 10) : total - 1
    if (Number.isNaN(start) || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': 'bytes */' + total },
      })
    }
    end = Math.min(end, total - 1)
    return new Response(buffer.slice(start, end + 1), {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': String(end - start + 1),
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      },
    })
  })
}

/**
 * Cache-first for audio: serve a downloaded copy if present, otherwise stream
 * from the network (uncached audio is never auto-downloaded here).
 * @param {Request} request
 * @param {URL} url
 * @returns {Promise<Response>}
 */
function audioStrategy(request, url) {
  return caches.open(AUDIO_CACHE).then((cache) =>
    cache.match(url.href, { ignoreVary: true }).then((cached) => {
      if (cached) return serveWithRange(request, cached)
      return fetch(request)
    }),
  )
}

/**
 * Cache-first for navigations: serve the precached SPA shell (`/index.html`),
 * fall back to the network on the very first visit (before the SW finished
 * installing).
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function navigationStrategy(request) {
  return caches.open(PRECACHE).then((cache) =>
    cache.match('/index.html', { ignoreSearch: true }).then((cached) => {
      if (cached) return cached
      return fetch(request)
    }),
  )
}

/**
 * Cache-first for same-origin static assets, with a runtime-fill safety net
 * for anything not in the manifest.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function cacheFirst(request) {
  return caches.open(PRECACHE).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {})
        return response
      })
    }),
  )
}

sw.addEventListener('fetch', (event) => {
  // Navigation Preload is deliberately NOT used: cache-first navigations never
  // read the network, so a preload request would only waste bandwidth.
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (isAudioRequest(request, url)) {
    event.respondWith(audioStrategy(request, url))
    return
  }

  // In dev, leave the shell to Metro so hot reloads are never served stale.
  if (isDev) return

  // Never serve the SW script from cache — the browser fetches /sw.js itself
  // to detect updates, and nginx already sends it with no-cache.
  if (url.pathname === '/sw.js') return

  if (request.mode === 'navigate' && url.origin === sw.location.origin) {
    event.respondWith(navigationStrategy(request))
    return
  }

  if (url.origin === sw.location.origin) {
    event.respondWith(cacheFirst(request))
  }
})
