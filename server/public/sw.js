// sw.js

const CACHE_NAME = 'printly-v1';
const URLS_TO_CACHE = ['/', '/index.html', '/styles.css', '/script.js'];

// Install event – pre-cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  console.log('Service Worker: Installed');
});

// Activate event – cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  console.log('Service Worker: Activated');
});

// Fetch event – handle network + share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Web Share Target POST
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShare(event));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Handle share target POST
async function handleShare(event) {
  try {
    const formData = await event.request.formData();
    const files = formData.getAll('file');
    const text = formData.get('text');
    const title = formData.get('title');
    const url = formData.get('url');

    console.log('Shared text:', text);
    console.log('Shared title:', title);
    console.log('Shared URL:', url);

    for (const file of files) {
      console.log('Got shared file:', file.name, file.type, file.size);
      // Example: send file to your backend
      const upload = new FormData();
      upload.append('file', file, file.name);
      await fetch('/upload', { method: 'POST', body: upload });
    }

    // Redirect back to main page
    return Response.redirect('/', 303);
  } catch (err) {
    console.error('Error handling share:', err);
    return new Response('Share failed', { status: 500 });
  }
}
