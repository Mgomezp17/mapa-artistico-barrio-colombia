import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/patterns.css';
import './styles/main.css';
import './styles/leaflet-custom.css';

import { createMap } from './map/createMap.js';
import { addBarrioHighlight } from './map/highlightLayer.js';
import { addBuildingOverlay } from './map/buildingOverlayLayer.js';
import { renderPois } from './pois/renderPois.js';
import { renderDirectory } from './ui/directory.js';
import { keepBarrioFitted } from './utils/responsive.js';

import mapConfig from './data/map-config.json';
import categories from './data/categories.json';
import pois from './data/pois.json';
import barrio from './data/barrio-colombia.json';

async function boot() {
  const mapEl = document.getElementById('map');
  if (!mapEl) throw new Error('#map no existe en el DOM');

  const map = createMap(mapEl, {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    tiles: mapConfig.tiles,
  });

  const { bounds: barrioBounds } = addBarrioHighlight(map, barrio, {
    dimOpacity: 0.55,
    outlineColor: '#0a0a0a',
    outlineWeight: 4,
    accentColor: '#e832d3',
    accentWeight: 2,
  });

  const directoryEl = document.getElementById('directory-list');
  const directoryPanelEl = directoryEl?.closest('.directory') ?? null;
  const buildingOverlay = addBuildingOverlay(map, pois);
  let directoryApi = null;

  const setDirectoryCollapsed = collapsed => {
    if (!directoryPanelEl) return;
    directoryPanelEl.classList.toggle(
      'directory--collapsed-mobile',
      Boolean(collapsed),
    );
  };

  const { focus } = renderPois(map, pois, categories, {
    onSelect: poi => {
      directoryApi?.setActive(poi?.id ?? null);
      buildingOverlay.setActive(poi?.id ?? null);
      setDirectoryCollapsed(Boolean(poi));
    },
  });

  directoryApi = renderDirectory(directoryEl, pois, {
    onSelect: poi => focus(poi.id),
  });

  /** @type {[number, number]} */
  const initialPadding = window.matchMedia('(max-width: 720px)').matches
    ? [28, 28]
    : [56, 56];
  map.fitBounds(barrioBounds, {
    padding: initialPadding,
    maxZoom: 17.8,
    animate: false,
  });
  keepBarrioFitted(map, barrioBounds, { padding: initialPadding });

  if (import.meta.env.DEV) {
    const { enableCoordPicker } = await import('./dev/coord-picker.js');
    enableCoordPicker(map);
  }
}

boot().catch(err => {
  console.error('[artistic-map] Error al inicializar', err);
});
