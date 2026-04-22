import L from 'leaflet';
import { makePoiIcon } from './poi-icon.js';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPopupHtml(poi, number, categoryLabel) {
  const name = escapeHtml(poi.name);
  const desc = escapeHtml(poi.description ?? '');
  const cat = escapeHtml(categoryLabel ?? poi.category ?? '');
  const num = String(number).padStart(2, '0');
  const [lat, lng] = Array.isArray(poi.coords) ? poi.coords : [];
  const mapsUrl = Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;
  const img = poi.image
    ? `<img class="popup__img" src="${escapeHtml(poi.image)}" loading="lazy" decoding="async" alt="${name}" />`
    : '';
  const cta = mapsUrl
    ? `
      <p class="popup__actions">
        <a
          class="popup__maps-btn"
          href="${escapeHtml(mapsUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver en Maps
        </a>
      </p>
    `
    : '';
  return `
    <article class="popup popup--${escapeHtml(poi.category)}">
      <header class="popup__header">
        <span class="popup__badge" aria-hidden="true">${num}</span>
        <div class="popup__heading">
          <span class="popup__eyebrow">${cat}</span>
          <h3 class="popup__title">${name}</h3>
        </div>
      </header>
      ${img}
      <p class="popup__desc">${desc}</p>
      ${cta}
    </article>
  `;
}

/**
 * Dibuja todos los POIs en el mapa y retorna utilidades para
 * enfocarlos programáticamente desde el directorio lateral.
 */
export function renderPois(map, pois = [], categories = [], options = {}) {
  const categoryLabel = Object.fromEntries(
    categories.map(c => [c.id, c.label]),
  );
  const group = L.layerGroup();
  const byId = new Map();
  let pendingOpenHandler = null;

  pois.forEach((poi, i) => {
    if (!Array.isArray(poi.coords) || poi.coords.length !== 2) return;
    const n = i + 1;

    const marker = L.marker(poi.coords, {
      icon: makePoiIcon(n, poi.category),
      keyboard: true,
      riseOnHover: true,
      title: poi.name,
      alt: `${n}. ${poi.name}`,
    });

    marker.bindPopup(buildPopupHtml(poi, n, categoryLabel[poi.category]), {
      maxWidth: 320,
      minWidth: 240,
      className: `popup-wrap popup-wrap--${poi.category}`,
      autoPanPadding: [24, 24],
      autoPan: false,
      closeButton: true,
    });

    if (options.onSelect) {
      marker.on('popupopen', () => options.onSelect(poi, n));
      marker.on('popupclose', () => options.onSelect(null));
    }

    marker.addTo(group);
    const entry = { marker, poi, number: n };
    byId.set(poi.id, entry);
  });

  group.addTo(map);

  function focus(id) {
    const entry = byId.get(id);
    if (!entry) return;

    // Evita encadenar callbacks de clicks previos del directorio.
    if (pendingOpenHandler) {
      map.off('moveend', pendingOpenHandler);
      pendingOpenHandler = null;
    }

    map.stop();

    const latlng = entry.marker.getLatLng();
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 18.5);
    const shouldAnimateZoom = currentZoom < targetZoom - 0.01;
    const open = () => {
      pendingOpenHandler = null;
      entry.marker.openPopup();
    };

    if (shouldAnimateZoom) {
      pendingOpenHandler = open;
      map.once('moveend', pendingOpenHandler);
      map.flyTo(latlng, targetZoom, { duration: 0.45, easeLinearity: 0.25 });
      return;
    }

    // Si ya estás a buen zoom, solo panea y abre popup (sin zoom animation).
    map.panTo(latlng, { animate: true, duration: 0.35 });
    window.requestAnimationFrame(open);
  }

  return { group, focus, get: id => byId.get(id) };
}
