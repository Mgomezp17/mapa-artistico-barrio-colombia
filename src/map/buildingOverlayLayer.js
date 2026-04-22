import L from 'leaflet';

/**
 * Ensayo visual: superpone "huellas" de edificio simplificadas
 * alrededor de cada POI para simular casas coloreadas.
 * Cada huella puede activarse por id de POI.
 */
export function addBuildingOverlay(map, pois = []) {
  const layerGroup = L.layerGroup().addTo(map);
  const byPoiId = new Map();

  pois.forEach((poi, index) => {
    if (!Array.isArray(poi.coords) || poi.coords.length !== 2 || !poi.id)
      return;
    const [lat, lng] = poi.coords;

    // Dimensiones aproximadas de una huella urbana pequeña.
    const halfWidthM = 7.5;
    const halfHeightM = 5.5;
    const angleDeg = (index % 4) * 12 - 18; // leve variación para no verse idénticas
    const polygon = makeRotatedRect(
      lat,
      lng,
      halfWidthM,
      halfHeightM,
      angleDeg,
    );

    const feature = L.polygon(polygon, {
      className: 'building-footprint',
      stroke: true,
      color: 'rgba(42, 255, 49, 0.55)',
      weight: 1.5,
      fill: true,
      fillColor: 'rgba(42, 255, 49, 0.55)',
      fillOpacity: 0.42,
      interactive: false,
      pane: 'overlayPane',
    }).addTo(layerGroup);

    byPoiId.set(poi.id, feature);
  });

  function setActive(poiId) {
    byPoiId.forEach((polygon, id) => {
      const el = polygon.getElement();
      if (!el) return;
      if (id === poiId) el.classList.add('is-active');
      else el.classList.remove('is-active');
    });
  }

  return { layerGroup, setActive };
}

function makeRotatedRect(lat, lng, halfWidthM, halfHeightM, angleDeg) {
  const corners = [
    [-halfWidthM, -halfHeightM],
    [halfWidthM, -halfHeightM],
    [halfWidthM, halfHeightM],
    [-halfWidthM, halfHeightM],
  ];
  const angle = (angleDeg * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return corners.map(([x, y]) => {
    const xr = x * cos - y * sin;
    const yr = x * sin + y * cos;
    return metersOffset(lat, lng, xr, yr);
  });
}

function metersOffset(lat, lng, eastM, northM) {
  const dLat = northM / 111_320;
  const dLng = eastM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}
