/* Offline-first service worker: cache the app shell on install,
 * serve from cache with network fallback, refresh cache in background.
 * Paths are relative to the SW script so the app works at any base path
 * (root domain, GitHub Pages subpath, etc.). */
const CACHE = 'lol-cgh-v2'
const SHELL = ['./', './manifest.webmanifest', './icon-128.png', './icon-192.png', './icon-512.png', './csgo-wheel-sound.mp3']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never cache Data Dragon API responses here (the app caches champion data itself);
  // do cache champion images once fetched.
  const isDdragonData = url.hostname.includes('ddragon') && url.pathname.includes('/data/')
  if (isDdragonData) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && (url.origin === self.location.origin || url.hostname.includes('ddragon'))) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
