// オフラインで動かすための仕組み（サービスワーカー）。
// 一度ひらいたときに下のファイルを iPhone/iPad の中に保存し、次からはネット無しでも動く。
// ★ファイルを直して公開したら、CACHE の番号を1つ上げること（上げないと古いまま残ることがある）
const CACHE = 'suuji-v2';
const FILES = [
  './', 'index.html', 'app.css', 'app.js', 'voices.js', 'digits.js', 'pictures.js',
  'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットにつながっていれば最新を取りに行き、つながらなければ保存しておいた分を使う
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
