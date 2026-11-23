// public/sw.js — Service worker de l'app Klaris installée
//
// Volontairement minimal : AUCUNE donnée de dossier n'est mise en cache sur le
// téléphone (pièces d'identité, analyses : elles restent sur le serveur). Seule une
// page « pas de connexion » est gardée, pour remplacer l'écran d'erreur du système.

const CACHE = "klaris-shell-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/pwa/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Seules les navigations sont interceptées, et uniquement pour le cas hors ligne.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
