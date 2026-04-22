# Barrio Colombia — Mapa artístico interactivo

Mapa ilustrado, responsive y rapidísimo incluso en mobile. Construido con
**Vite + JavaScript vanilla + Leaflet** usando `CRS.Simple` para coordenadas
en píxeles (no lat/long), y un sistema de diseño propio inspirado en la
identidad **Barrio Colombia** (damero verde, rayas magenta/lavanda, banda
multicolor, crema, negro bold).

## Requisitos

- Node.js 18 o superior.
- **pnpm** 9 o superior (`brew install pnpm` o `corepack enable`).

## Instalación y desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

En modo dev se activa el **coord-picker**: hacé click sobre el mapa y
copia `[y, x]` al portapapeles, listo para pegar en los JSON.

## Build de producción

```bash
pnpm build       # genera dist/
pnpm preview     # sirve dist/ localmente
```

El build es 100% estático: subilo a Netlify, Vercel, GitHub Pages, etc.

## Estructura

```
artistic-map/
├─ index.html                 # Shell de la app (header + mapa + footer)
├─ public/
│  └─ assets/
│     ├─ base/base-map.svg    # Base del mapa (calles rosas)
│     ├─ illustrations/       # Ilustraciones sueltas (tranvía, mercado, ...)
│     └─ pois/                # Imágenes que aparecen en los popups
├─ src/
│  ├─ main.js                 # Entry: arma el mapa y conecta datos + UI
│  ├─ map/
│  │  ├─ createMap.js         # Leaflet + CRS.Simple + bounds + maxBounds
│  │  ├─ baseLayer.js         # imageOverlay de la base rosa
│  │  └─ illustrationsLayer.js# imageOverlay por cada ilustración
│  ├─ pois/
│  │  ├─ poi-icon.js          # DivIcon numerado (coloreado por categoría)
│  │  └─ renderPois.js        # Markers + popups editoriales
│  ├─ ui/legend.js            # Leyenda de categorías
│  ├─ utils/responsive.js     # fitBounds en resize/orientationchange
│  ├─ dev/coord-picker.js     # Dev-only: click → [y,x] al portapapeles
│  ├─ data/
│  │  ├─ map-config.json      # dims de la base, rango de zoom
│  │  ├─ categories.json      # categorías (id, label, descripción)
│  │  ├─ illustrations.json   # ilustraciones + bounds en pixeles
│  │  └─ pois.json            # POIs (nombre, categoría, coords, foto, desc)
│  └─ styles/
│     ├─ tokens.css           # Paleta Barrio Colombia + tipografía + radii
│     ├─ patterns.css         # Damero, rayas verticales y horizontales
│     ├─ main.css             # Layout, header, footer, leyenda, responsive
│     └─ leaflet-custom.css   # Overrides de popup, markers y controles
```

## Cómo reemplazar la base del mapa

1. Dejá tu imagen en `public/assets/base/` (recomendado: `.webp`, `.png` o
   `.jpg`; el actual es `base-map.jpg` 1024×682).
2. Actualizá `src/data/map-config.json` con el nuevo `src`, `width` y `height`
   **en píxeles** exactos de la imagen.
3. Las coordenadas de POIs e ilustraciones se expresan como `[y, x]` en ese
   sistema. **Usá el coord-picker** (activo sólo en `pnpm dev`): click en
   cualquier lugar del mapa y el par `[y, x]` queda copiado al portapapeles
   listo para pegar en `pois.json` o `illustrations.json`.

## Cómo agregar un POI

Editá `src/data/pois.json` y agregá un objeto:

```json
{
  "id": "mi-lugar",
  "name": "Mi Lugar",
  "category": "gastro",
  "coords": [1030, 650],
  "image": "/assets/pois/mi-lugar.webp",
  "description": "Una breve descripción (1–2 líneas)."
}
```

`category` debe existir en `src/data/categories.json` para que herede color
y label. Los valores existentes son: `gastro`, `cultura`, `arte`, `historia`,
`verde`, `nocturno`. Podés sumar categorías nuevas agregándolas a
`categories.json` **y** al bloque "POIs por categoria" en `tokens.css`
(variables `--poi-<id>`) + las clases `.poi--<id>`, `.popup--<id>` y
`.legend__swatch--<id>`.

## Cómo agregar una ilustración

Dejá el PNG/SVG transparente en `public/assets/illustrations/` y sumalo a
`src/data/illustrations.json`:

```json
{
  "id": "mi-ilustracion",
  "src": "/assets/illustrations/mi-ilustracion.svg",
  "bounds": [[y1, x1], [y2, x2]],
  "alt": "Descripción accesible"
}
```

`bounds` define la esquina superior-izquierda y la inferior-derecha sobre la
base, en píxeles. La ilustración escalará con el zoom sin perder calidad.

## Sistema de diseño

La paleta **Barrio Colombia** está centralizada en `src/styles/tokens.css`
como variables CSS (`--bc-*`). Los colores de cada categoría de POI se
mapean a roles (`--poi-gastro`, `--poi-cultura`, …). Los patrones
(`.pattern-checker`, `.pattern-stripes-v`, `.pattern-stripes-h`) son puros
CSS (no agregan imágenes) y se pueden reutilizar en cualquier parte de la UI.

Tipografías: **Archivo Black** (display, para títulos) y **Inter** (body), ambas
cargadas desde Google Fonts con `display=swap`.

## Performance y accesibilidad

- `preferCanvas: true` en Leaflet para render más barato.
- `loading="lazy"` + `decoding="async"` en las fotos de popup.
- `maxBounds` + `maxBoundsViscosity: 1` evitan pan fuera del mapa.
- `touch-action: pan-x pan-y` en el contenedor para gestos fluidos en mobile.
- `prefers-reduced-motion` desactiva transiciones/hover animations.
- Markers con borde 3px, contraste alto y `aria-label` para lectores de
  pantalla.

## Roadmap (descartado de v1, listo para sumar)

- Filtrado de POIs por categoría o recorrido.
- Trazado animado de rutas (`L.polyline` con `stroke-dasharray`).
- Panel lateral con lista de POIs sincronizada con el mapa (`map.flyTo`).
