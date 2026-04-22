import Jimp from 'jimp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Extracts the green-blob contour from the Barrio Colombia silhouette image
 * and georeferences it onto the real-world bounding box of the neighborhood
 * in Medellín. Produces GeoJSON ready for Leaflet.
 *
 * Reference bbox (approx., real Barrio Colombia):
 *   N = 6.2430   S = 6.2320
 *   W = -75.5830  E = -75.5745
 *
 * The source silhouette has black padding around the green shape, so we
 * measure the green blob's bounding box in pixels and map THAT rectangle
 * to the real-world bbox (affine, axis-aligned).
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMG = '/Users/marco_gpt/.cursor/projects/Users-marco-gpt-Documents-Projects-artistic-map/assets/mapa_barrio_colombia-ddbc8cb2-cef5-4a99-99b3-7e76621d7266.png';
const OUT = resolve(__dirname, '../src/data/barrio-colombia.json');

// Real-world bbox for Barrio Colombia, Medellín (centrado en el centroide
// OSM 6.2273, -75.5720 con proporciones similares a la silueta original).
const GEO = { N: 6.2342, S: 6.2204, W: -75.5770, E: -75.5670 };

function isGreen(r, g, b) {
  // Mint green (#8ee3a6-ish) clearly brighter than black padding
  return g > 150 && r < 220 && b < 220 && g > r - 10 && g > b - 10;
}

function buildMask(img) {
  const { width: w, height: h } = img.bitmap;
  const green = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      green[y * w + x] = isGreen(r, g, b) ? 1 : 0;
    }
  }
  // Flood-fill "outside": non-green pixels reachable from the image border.
  // Everything NOT marked outside is either green or an internal hole (street
  // line inside the barrio). Final mask = NOT outside.
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (outside[i] || green[i]) return;
    outside[i] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = outside[i] ? 0 : 1;
  return { mask, w, h };
}

function boundingBox(mask, w, h) {
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Row-scan contour extractor. For each horizontal row, find the leftmost and
 * rightmost foreground pixel. Stitch them into a closed polygon by going down
 * the left edge and back up the right edge. Works for y-monotone shapes (no
 * horizontal overhangs), which Barrio Colombia is.
 */
function traceContour(mask, w, h) {
  const left = [];
  const right = [];
  for (let y = 0; y < h; y++) {
    let lx = -1, rx = -1;
    for (let x = 0; x < w; x++) if (mask[y * w + x]) { lx = x; break; }
    if (lx === -1) continue;
    for (let x = w - 1; x >= 0; x--) if (mask[y * w + x]) { rx = x; break; }
    left.push({ x: lx, y });
    right.push({ x: rx, y });
  }
  return [...left, ...right.reverse()];
}

/** Douglas-Peucker line simplification. */
function simplify(points, tol) {
  if (points.length < 3) return points.slice();
  const sqTol = tol * tol;
  const sqDist = (p, a, b) => {
    let x = a.x, y = a.y;
    let dx = b.x - x, dy = b.y - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b.x; y = b.y; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p.x - x; dy = p.y - y;
    return dx * dx + dy * dy;
  };
  const dp = (pts, first, last, keep) => {
    let maxSq = 0;
    let idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = sqDist(pts[i], pts[first], pts[last]);
      if (d > maxSq) { idx = i; maxSq = d; }
    }
    if (maxSq > sqTol && idx !== -1) {
      if (idx - first > 1) dp(pts, first, idx, keep);
      keep.push(pts[idx]);
      if (last - idx > 1) dp(pts, idx, last, keep);
    }
  };
  const keep = [points[0]];
  dp(points, 0, points.length - 1, keep);
  keep.push(points[points.length - 1]);
  return keep;
}

async function main() {
  const img = await Jimp.read(IMG);
  const { mask, w, h } = buildMask(img);
  const bb = boundingBox(mask, w, h);
  console.log(`Image ${w}x${h}, green bbox: ${JSON.stringify(bb)}`);

  const contour = traceContour(mask, w, h);
  if (!contour.length) throw new Error('No green pixels found');
  console.log(`Raw contour points: ${contour.length}`);

  const simplified = simplify(contour, 3);
  console.log(`Simplified points: ${simplified.length}`);

  // Map pixel (x,y) in the green bbox -> geographic (lat, lng)
  const { minX, minY, maxX, maxY } = bb;
  const pxW = maxX - minX;
  const pxH = maxY - minY;
  const toLngLat = (p) => {
    const nx = (p.x - minX) / pxW; // 0 left, 1 right
    const ny = (p.y - minY) / pxH; // 0 top,  1 bottom
    const lng = GEO.W + nx * (GEO.E - GEO.W);
    const lat = GEO.N - ny * (GEO.N - GEO.S);
    return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
  };

  const ring = simplified.map(toLngLat);
  // Ensure closed ring
  const [fLng, fLat] = ring[0];
  const [lLng, lLat] = ring[ring.length - 1];
  if (fLng !== lLng || fLat !== lLat) ring.push([fLng, fLat]);

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Barrio Colombia', source: 'silhouette-auto' },
        geometry: { type: 'Polygon', coordinates: [ring] },
      },
    ],
  };
  writeFileSync(OUT, JSON.stringify(geojson, null, 2));
  console.log(`Wrote ${OUT} with ${ring.length} vertices.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
