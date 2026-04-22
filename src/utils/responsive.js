/**
 * Reajusta el mapa al pol\u00edgono del barrio en resize/orientationchange.
 * Se desactiva una vez que el usuario interactua (zoom o drag) para no
 * pelearle al control manual.
 */
export function keepBarrioFitted(map, barrioBounds, { padding = [40, 40] } = {}) {
  let userInteracted = false;
  let pending = 0;

  const markInteracted = () => { userInteracted = true; };
  map.on('zoomstart', markInteracted);
  map.on('dragstart', markInteracted);

  const refit = () => {
    map.invalidateSize({ animate: false });
    if (userInteracted) return;
    map.fitBounds(barrioBounds, { animate: false, padding });
  };

  const onResize = () => {
    window.cancelAnimationFrame(pending);
    pending = window.requestAnimationFrame(refit);
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    map.off('zoomstart', markInteracted);
    map.off('dragstart', markInteracted);
  };
}
