import L from 'leaflet';

export function createMap(el, config = {}) {
  if (!el) throw new Error('createMap: elemento contenedor requerido');

  const {
    center = [6.2385, -75.579],
    zoom = 16,
    minZoom = 13,
    maxZoom = 32,
    maxBounds,
    tiles = {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: maxZoom,
    },
  } = config;

  const map = L.map(el, {
    center,
    zoom,
    minZoom,
    maxZoom,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    maxBounds: maxBounds
      ? L.latLngBounds(maxBounds[0], maxBounds[1])
      : undefined,
    maxBoundsViscosity: 0.85,
    preferCanvas: false,
    attributionControl: true,
    zoomControl: true,
    inertia: false,
    // tap: true,
    worldCopyJump: false,
  });

  L.tileLayer(tiles.url, {
    attribution: tiles.attribution,
    subdomains: tiles.subdomains,
    maxZoom: tiles.maxZoom,
    crossOrigin: true,
  }).addTo(map);

  return map;
}
