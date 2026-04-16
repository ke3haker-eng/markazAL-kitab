/* ══════════════════════════════════════
   Service Worker — مركز الكتاب للتحفيظ
   ══════════════════════════════════════ */

const CACHE_NAME = 'markaz-alkitab-v1';

// الملفات التي سيتم تخزينها مؤقتاً
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&display=swap'
];

/* ── Install: تخزين الملفات ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // تجاهل أخطاء التخزين (مثل Google Fonts)
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

/* ── Activate: حذف الكاش القديم ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: استراتيجية Cache First ── */
self.addEventListener('fetch', event => {
  // تجاهل طلبات غير GET
  if (event.request.method !== 'GET') return;

  // تجاهل chrome-extension وما شابه
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // تخزين فقط الردود الناجحة
          if (
            response &&
            response.status === 200 &&
            response.type !== 'opaque'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // إذا كان الطلب لصفحة HTML → أرجع index.html من الكاش
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
