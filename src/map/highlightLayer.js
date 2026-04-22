import L from 'leaflet';

/**
 * Dibuja el "spotlight" del barrio:
 *  - Capa de m\u00e1scara: pol\u00edgono con un hueco con la forma del barrio, fill
 *    semitransparente oscuro. Todo lo que est\u00e1 fuera del barrio queda
 *    atenuado y el barrio queda iluminado.
 *  - Contorno del barrio en el color del branding, grueso, sin relleno.
 *
 * Devuelve { maskLayer, outlineLayer, bounds } para que el caller haga
 * fitBounds al iniciar.
 */
export function addBarrioHighlight(map, featureCollection, options = {}) {
  const feature = featureCollection.features?.[0];
  if (!feature) throw new Error('addBarrioHighlight: featureCollection vac\u00edo');
  const ring = feature.geometry.coordinates[0]; // [lng, lat][]

  const {
    dimColor = '#000000',
    dimOpacity = 0.55,
    outlineColor = '#0a0a0a',
    outlineWeight = 4,
    outlineDash = null,
    accentColor = '#e832d3',
    accentWeight = 2,
  } = options;

  // Ring en orden [lat, lng] para Leaflet
  const barrioLatLng = ring.map(([lng, lat]) => [lat, lng]);

  // Rect\u00e1ngulo enorme que cubre el mundo (lat -85..85, lng -180..180)
  // pero evitamos los polos para no pelearnos con la proyecci\u00f3n.
  const worldRect = [
    [-85, -180],
    [85, -180],
    [85, 180],
    [-85, 180],
    [-85, -180],
  ];

  // Un polygon con dos rings crea un donut: el exterior se rellena y el
  // interior es un hueco. Orientaci\u00f3n: exterior CCW, hueco CW (Leaflet
  // usa even-odd, as\u00ed que en la pr\u00e1ctica alcanza con pasarlos).
  const maskLayer = L.polygon([worldRect, barrioLatLng], {
    stroke: false,
    fillColor: dimColor,
    fillOpacity: dimOpacity,
    fillRule: 'evenodd',
    interactive: false,
    pane: 'overlayPane',
    className: 'barrio-mask',
  }).addTo(map);

  // Contorno grueso negro por encima de la m\u00e1scara
  const outlineLayer = L.polygon(barrioLatLng, {
    color: outlineColor,
    weight: outlineWeight,
    dashArray: outlineDash,
    fill: false,
    interactive: false,
    className: 'barrio-outline',
  }).addTo(map);

  // Borde interior de acento (m\u00e1s fino) para el pop de color
  const accentLayer = L.polygon(barrioLatLng, {
    color: accentColor,
    weight: accentWeight,
    fill: false,
    interactive: false,
    className: 'barrio-accent',
  }).addTo(map);

  const bounds = outlineLayer.getBounds();
  return { maskLayer, outlineLayer, accentLayer, bounds };
}
