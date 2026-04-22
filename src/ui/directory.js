/**
 * Directorio numerado de POIs (talleres y galerías).
 * Al hacer click o Enter sobre una fila dispara `onSelect(poi, index)`
 * para que el caller pueda volar el mapa y abrir el popup.
 */
export function renderDirectory(el, pois = [], { onSelect } = {}) {
  if (!el) return { setActive: () => {} };
  el.innerHTML = '';

  const frag = document.createDocumentFragment();
  const rows = new Map();

  pois.forEach((poi, i) => {
    const n = i + 1;
    const li = document.createElement('li');
    li.className = 'directory__item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'directory__row';
    btn.dataset.poiId = poi.id;
    btn.setAttribute('aria-label', `${n}. ${poi.name}`);
    btn.innerHTML = `
      <span class="directory__badge" aria-hidden="true">${String(n).padStart(2, '0')}</span>
      <span class="directory__name">${escapeHtml(poi.name)}</span>
    `;

    btn.addEventListener('click', () => onSelect?.(poi, i));

    li.appendChild(btn);
    frag.appendChild(li);
    rows.set(poi.id, btn);
  });

  el.appendChild(frag);

  function setActive(id) {
    rows.forEach((row, key) => {
      row.classList.toggle('is-active', key === id);
    });
  }

  return { setActive };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
