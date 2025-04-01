self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("weatherapp").then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./script.js",
        "./manifest.json",
        "./weather-icon.png"
      ])
    )
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((resp) => resp || fetch(e.request)));
});
