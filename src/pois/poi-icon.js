import L from 'leaflet';

/**
 * Crea iconos para POIs. Si existe `image`, se usa foto "a secas";
 * si no, cae a un icono numérico simple de respaldo.
 */
export function makePoiIcon(number, category = 'default', image = '', zoom = 16) {
  const label = String(number ?? '').padStart(2, '0');
  const hasImage = Boolean(image && String(image).trim());

  if (hasImage) {
    const size = sizeForZoom(zoom);
    return L.icon({
      iconUrl: image,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      className: `poi-photo-marker poi-photo-marker--${category}`,
    });
  }

  return L.divIcon({
    className: `poi-fallback poi-fallback--${category}`,
    html: `<span class="poi-fallback__num">${label}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function sizeForZoom(zoom = 16) {
  // Escala suave: ~34px en zoom 14, ~72px en zoom 19
  const raw = 34 + (zoom - 14) * 7.5;
  return Math.max(26, Math.min(72, Math.round(raw)));
}
