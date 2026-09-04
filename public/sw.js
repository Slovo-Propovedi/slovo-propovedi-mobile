// @ts-check
/// <reference lib="webworker" />
/// <reference lib="es2018" />

/*
 * Слово.Проповеди — service worker.
 *
 * Two jobs:
 *  1. Offline app shell — precache "/" and static assets, serve them when the
 *     network is down (production hosts only; on localhost the shell is left
 *     to Metro so dev reloads stay fresh).
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

/** @type {string} Cache bucket for the precached app shell. */
const SHELL_CACHE = 'shell-cache-v1'
/**
 * @type {string} Cache bucket for downloaded sermon audio.
 * Keep in sync with AUDIO_CACHE_NAME in src/shared/lib/audio-cache/webCacheApi.ts.
 */
const AUDIO_CACHE = 'audio-cache-v1'

/** @type {string[]} Same-origin URLs precached on install (production only). */
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|opus|wav|flac)(\?|$)/i
const DEV_HOSTS = ['localhost', '127.0.0.1']
/** @type {boolean} On the Metro dev host the SW only manages the audio cache. */
const isDev = DEV_HOSTS.indexOf(sw.location.hostname) !== -1

sw.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.resolve()
      .then(() => {
        if (isDev) return undefined
        return caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
      })
      .then(() => sw.skipWaiting()),
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
            .filter((key) => key !== SHELL_CACHE && key !== AUDIO_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => sw.clients.claim()),
  )
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
 * Stale-while-revalidate for same-origin static assets.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function staleWhileRevalidate(request) {
  return caches.open(SHELL_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone()).catch(() => {})
          return response
        })
        .catch(() => cached || Response.error())
      return cached || network
    }),
  )
}

/**
 * Network-first for navigations, falling back to the cached app shell offline.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function navigationStrategy(request) {
  return fetch(request).catch(() =>
    caches.match('/', { ignoreSearch: true }).then((cached) => cached || Response.error()),
  )
}

sw.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (isAudioRequest(request, url)) {
    event.respondWith(audioStrategy(request, url))
    return
  }

  // In dev, leave the shell to Metro so hot reloads are never served stale.
  if (isDev) return

  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  if (url.origin === sw.location.origin) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
