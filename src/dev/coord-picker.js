/**
 * Utilidad de desarrollo: al hacer click sobre el mapa, imprime en consola
 * las coordenadas [lat, lng] reales y las copia al portapapeles (si esta
 * disponible). Activado solo en `pnpm dev` via import.meta.env.DEV en main.js.
 */
export function enableCoordPicker(map) {
  const fmt = (n) => Number(n.toFixed(5));

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.style.cssText = `
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 1000;
    padding: 6px 10px;
    font: 600 12px/1.3 var(--font-body, system-ui);
    color: #f4eedb;
    background: #0a0a0a;
    border-radius: 6px;
    box-shadow: 2px 2px 0 0 rgba(255, 90, 21, 0.9);
    pointer-events: none;
    max-width: 60vw;
  `;
  banner.textContent = 'DEV · click en el mapa para copiar [lat, lng]';
  const container = map.getContainer();
  if (container.style.position !== 'absolute' && container.style.position !== 'relative') {
    container.style.position = 'relative';
  }
  container.appendChild(banner);

  const onClick = (ev) => {
    const coord = [fmt(ev.latlng.lat), fmt(ev.latlng.lng)];
    const str = `[${coord[0]}, ${coord[1]}]`;
    console.info('[coord-picker]', str);
    banner.textContent = `DEV · copiado ${str}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(str).catch(() => {});
    }
  };

  map.on('click', onClick);

  return () => {
    map.off('click', onClick);
    banner.remove();
  };
}
