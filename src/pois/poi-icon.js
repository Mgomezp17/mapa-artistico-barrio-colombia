import L from 'leaflet';

/**
 * Crea un L.divIcon en forma de banderín negro con número blanco,
 * para mantener consistencia visual con el directorio lateral.
 */
export function makePoiIcon(number, category = 'default') {
  const label = String(number ?? '').padStart(2, '0');
  return L.divIcon({
    className: `poi poi--${category}`,
    html: `
      <span class="poi__stem" aria-hidden="true"></span>
      <span class="poi__tag">${label}</span>
    `,
    iconSize: [34, 46],
    iconAnchor: [4, 44],
    popupAnchor: [12, -36],
  });
}
