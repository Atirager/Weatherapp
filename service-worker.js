self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open("weatherapp").then((cache) =>
      cache.addAll(["/", "/index.html", "/style.css", "/script.js", "/weather-icon.png"])
    )
  );
});

self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
