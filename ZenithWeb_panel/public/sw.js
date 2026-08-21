// Discord Self-Bot Control Panel - Service Worker & Firmware Update Manager
const CACHE_NAME = 'phantom-bot-panel-v2.4.8';
const SW_VERSION = '2.4.8';

// Firmware & API Version Metadata
let currentVersions = {
  firmwareVersion: '2.4.8',
  apiVersion: '1.9.4',
  swVersion: SW_VERSION,
  hasPendingUpdate: true,
  pendingFirmwareVersion: '2.5.0-STABLE',
  pendingApiVersion: '2.0.0-PRO',
  releaseDate: '2026-08-18',
  changelog: [
    '⚡ Полная переработка WebSocket Gateway v10 с авто-переподключением за 150мс',
    '🛡️ Добавлен интеллектуальный обход Cloudflare / Discord rate limits',
    '🔄 Оптимизирован циклический ротатор никнеймов и устранены сбои таймеров',
    '📦 Интеграция быстрого Service Worker кэширования для работы без интернета',
    '🚀 Ускорен отклик и исполнение команд (.purge, .ping, .status, .say)'
  ]
};

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/script.js',
  '/style.css'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event fired. Version:', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[ServiceWorker] Cache addAll warning:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event fired. Claiming clients.');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Intercept network requests
self.addEventListener('fetch', (event) => {
  // Let API requests pass through
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, fetch update in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle messages from the React application
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  const port = event.ports && event.ports[0];

  switch (data.type) {
    case 'CHECK_FOR_UPDATES': {
      const responsePayload = {
        type: 'UPDATE_CHECK_RESULT',
        hasUpdate: currentVersions.hasPendingUpdate,
        currentFirmwareVersion: currentVersions.firmwareVersion,
        currentApiVersion: currentVersions.apiVersion,
        swVersion: currentVersions.swVersion,
        pendingFirmwareVersion: currentVersions.pendingFirmwareVersion,
        pendingApiVersion: currentVersions.pendingApiVersion,
        releaseDate: currentVersions.releaseDate,
        changelog: currentVersions.changelog,
        timestamp: new Date().toISOString()
      };

      if (port) {
        port.postMessage(responsePayload);
      } else {
        broadcastToClients(responsePayload);
      }
      break;
    }

    case 'TRIGGER_UPDATE': {
      // Simulate applying update, hot-swapping versions
      currentVersions.firmwareVersion = currentVersions.pendingFirmwareVersion;
      currentVersions.apiVersion = currentVersions.pendingApiVersion;
      currentVersions.hasPendingUpdate = false;

      const updateCompletedPayload = {
        type: 'UPDATE_APPLIED_SUCCESS',
        firmwareVersion: currentVersions.firmwareVersion,
        apiVersion: currentVersions.apiVersion,
        swVersion: currentVersions.swVersion,
        timestamp: new Date().toISOString()
      };

      if (port) {
        port.postMessage(updateCompletedPayload);
      }
      broadcastToClients(updateCompletedPayload);
      break;
    }

    case 'SIMULATE_NEW_UPDATE': {
      currentVersions.hasPendingUpdate = true;
      currentVersions.pendingFirmwareVersion = '2.5.' + Math.floor(Math.random() * 9 + 1) + '-STABLE';
      currentVersions.pendingApiVersion = '2.0.1-PRO';

      const updateAvailPayload = {
        type: 'UPDATE_AVAILABLE',
        hasUpdate: true,
        pendingFirmwareVersion: currentVersions.pendingFirmwareVersion,
        pendingApiVersion: currentVersions.pendingApiVersion,
        changelog: currentVersions.changelog
      };

      if (port) port.postMessage(updateAvailPayload);
      broadcastToClients(updateAvailPayload);
      break;
    }

    case 'SKIP_WAITING': {
      self.skipWaiting();
      break;
    }

    case 'GET_STATUS':
    default: {
      const statusPayload = {
        type: 'SW_STATUS_REPORT',
        firmwareVersion: currentVersions.firmwareVersion,
        apiVersion: currentVersions.apiVersion,
        swVersion: currentVersions.swVersion,
        hasPendingUpdate: currentVersions.hasPendingUpdate,
        pendingFirmwareVersion: currentVersions.pendingFirmwareVersion,
        pendingApiVersion: currentVersions.pendingApiVersion,
        changelog: currentVersions.changelog
      };
      if (port) port.postMessage(statusPayload);
      break;
    }
  }
});

function broadcastToClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage(msg);
    });
  });
}
