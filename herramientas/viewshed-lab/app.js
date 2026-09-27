(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { points: [], cells: [], observer: null, map: null, layer: null, grid: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function number(value) { const parsed = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(parsed) ? parsed : null; }
  function distance(a, b) { const radius = Math.PI / 180, dLat = (b.lat - a.lat) * radius, dLon = (b.lon - a.lon) * radius, q = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radius) * Math.cos(b.lat * radius) * Math.sin(dLon / 2) ** 2; return 6371008.8 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); }
  function bearing(a, b) { const radius = Math.PI / 180, y = Math.sin((b.lon - a.lon) * radius) * Math.cos(b.lat * radius), x = Math.cos(a.lat * radius) * Math.sin(b.lat * radius) - Math.sin(a.lat * radius) * Math.cos(b.lat * radius) * Math.cos((b.lon - a.lon) * radius); return (Math.atan2(y, x) / radius + 360) % 360; }
  function csvRows(value) { return value.trim().split(/\r?\n/).map(line => line.split(/[,;\t]/).map(item => item.trim().replace(/^"|"$/g, ''))).filter(row => row.some(Boolean)); }

  function fromJson(parsed) {
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : Array.isArray(parsed) ? parsed : [];
    if (!features.length) throw new Error('El JSON no contiene una FeatureCollection, un Feature ni una lista de puntos.');
    return features.map(item => {
      if (item.type === 'Feature') { const coordinates = item.geometry?.coordinates; const props = item.properties || {}; return { lon: number(coordinates?.[0]), lat: number(coordinates?.[1]), elevation: number(coordinates?.[2] ?? props.elevation ?? props.elevacion ?? props.z), label: props.nombre || props.name || '' }; }
      if (Array.isArray(item)) return { lon: number(item[0]), lat: number(item[1]), elevation: number(item[2]) ?? 0, label: '' };
      return { lon: number(item.lon ?? item.lng ?? item.longitude ?? item.x), lat: number(item.lat ?? item.latitude ?? item.y), elevation: number(item.elevation ?? item.elevacion ?? item.z ?? item.value), label: item.nombre || item.name || '' };
    });
  }

  function fromCsv(value) {
    const rows = csvRows(value); if (!rows.length) return [];
    const first = rows[0], normalized = first.map(item => item.toLowerCase().replace(/[áéíóú]/g, char => ({ á:'a', é:'e', í:'i', ó:'o', ú:'u' }[char]))), hasHeader = normalized.some(item => /lon|lat|elev|altura|^x$|^y$|^z$/.test(item));
    const header = hasHeader ? normalized : ['lon', 'lat', 'elevation'], data = hasHeader ? rows.slice(1) : rows;
    const findIndex = patterns => { const index = header.findIndex(item => patterns.some(pattern => pattern.test(item))); return index < 0 ? null : index; };
    const lonIndex = findIndex([/^lon/, /^x$/]), latIndex = findIndex([/^lat/, /^y$/]), elevationIndex = findIndex([/elev/, /altura/, /^z$/, /value/, /valor/]);
    if (lonIndex === null || latIndex === null) throw new Error('El CSV necesita columnas lon/lat o x/y.');
    return data.map(row => ({ lon: number(row[lonIndex]), lat: number(row[latIndex]), elevation: number(row[elevationIndex ?? 2]) ?? 0, label: '' }));
  }

  function parseSource(value) {
    const trimmed = value.trim(); let points;
    try { points = /^[\[{]/.test(trimmed) ? fromJson(JSON.parse(trimmed)) : fromCsv(trimmed); } catch (error) { if (/JSON|Unexpected|FeatureCollection/.test(error.message)) throw error; points = fromCsv(trimmed); }
    const clean = points.filter(item => Number.isFinite(item.lon) && Number.isFinite(item.lat) && item.lon >= -180 && item.lon <= 180 && item.lat >= -90 && item.lat <= 90 && Number.isFinite(item.elevation));
    const unique = new Map(); clean.forEach(item => unique.set(`${item.lon.toFixed(8)}|${item.lat.toFixed(8)}`, item));
    if (unique.size < 3) throw new Error('Se necesitan al menos tres puntos con lon, lat y elevación válidos.');
    return [...unique.values()];
  }

  function median(values) { const sorted = values.filter(value => value > 0).sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : .01; }
  function buildGrid(points) { const lons = [...new Set(points.map(item => item.lon))].sort((a, b) => a - b), lats = [...new Set(points.map(item => item.lat))].sort((a, b) => a - b); return { lons, lats, dx: median(lons.slice(1).map((value, index) => value - lons[index])), dy: median(lats.slice(1).map((value, index) => value - lats[index])) }; }
  function nearest(points, target) { return points.reduce((best, item) => !best || (item.lon - target.lon) ** 2 + (item.lat - target.lat) ** 2 < (best.lon - target.lon) ** 2 + (best.lat - target.lat) ** 2 ? item : best, null); }
  function cellKey(point) { return `${point.lon.toFixed(8)}|${point.lat.toFixed(8)}`; }

  function lineOfSight(observer, target, points) {
    const targetDistance = distance(observer, target); if (!targetDistance) return true;
    const targetAngle = (target.elevation - observer.observerElevation) / targetDistance, steps = Math.max(3, Math.ceil(Math.max(Math.abs(target.lon - observer.lon) / observer.grid.dx, Math.abs(target.lat - observer.lat) / observer.grid.dy) * 3));
    for (let index = 1; index < steps; index++) {
      const fraction = index / steps, samplePoint = nearest(points, { lon: observer.lon + (target.lon - observer.lon) * fraction, lat: observer.lat + (target.lat - observer.lat) * fraction });
      if (!samplePoint || cellKey(samplePoint) === cellKey(target) || cellKey(samplePoint) === cellKey(observer.point)) continue;
      const sampleDistance = distance(observer, samplePoint), terrainAngle = (samplePoint.elevation - observer.observerElevation) / sampleDistance;
      if (terrainAngle > targetAngle + .00001) return false;
    }
    return true;
  }

  function calculate() {
    try {
      const points = parseSource($('source').value), grid = buildGrid(points), requested = { lon: number($('observerLon').value), lat: number($('observerLat').value) }, point = nearest(points, { lon: requested.lon ?? points[0].lon, lat: requested.lat ?? points[0].lat }), observer = { lon: point.lon, lat: point.lat, observerElevation: point.elevation + Math.max(0, number($('observerHeight').value) ?? 0), point, grid }, maxRange = Math.max(0, number($('maxRange').value) ?? 0) * 1000;
      const cells = points.map((item, index) => { const meters = distance(observer, item), outside = maxRange > 0 && meters > maxRange, visible = !outside && (cellKey(item) === cellKey(point) || lineOfSight(observer, item, points)); return { ...item, index, distance: meters, bearing: bearing(observer, item), status: cellKey(item) === cellKey(point) ? 'observador' : outside ? 'fuera de rango' : visible ? 'visible' : 'oculto', visible, angle: meters ? (item.elevation - observer.observerElevation) / meters * 1000 : 0 }; });
      state.points = points; state.grid = grid; state.observer = observer; state.cells = cells; renderMap(cells, grid, observer); renderTable(cells); updateStats(cells, observer); $('geojsonBtn').disabled = false; $('csvBtn').disabled = false;
      const visible = cells.filter(item => item.visible).length; setStatus(`${points.length} celdas analizadas: ${visible} visibles y ${cells.filter(item => item.status === 'oculto').length} ocultas.`); $('quality').textContent = 'Listo'; $('quality').style.background = '#143747'; $('quality').style.borderColor = '#346275'; $('quality').style.color = 'var(--accent)';
    } catch (error) { setStatus(error.message || 'No se pudo calcular la visibilidad.', true); }
  }

  function colorFor(status) { return status === 'visible' || status === 'observador' ? '#75d6c4' : status === 'oculto' ? '#ff8b8b' : '#71838c'; }
  function renderMap(cells, grid, observer) {
    if (!state.layer) return; state.layer.clearLayers(); const bounds = [];
    cells.forEach(cell => { const halfLon = grid.dx / 2, halfLat = grid.dy / 2, color = colorFor(cell.status), rectangle = L.rectangle([[cell.lat - halfLat, cell.lon - halfLon], [cell.lat + halfLat, cell.lon + halfLon]], { color, fillColor: color, fillOpacity: .6, weight: 1 }); rectangle.bindPopup(`<strong>Celda ${cell.index + 1}</strong><br>Estado: ${esc(cell.status)}<br>Elevación: ${format(cell.elevation)} m<br>Distancia: ${format(cell.distance / 1000)} km<br>Azimut: ${format(cell.bearing)}°`).addTo(state.layer); bounds.push([cell.lat, cell.lon]); });
    const marker = L.circleMarker([observer.lat, observer.lon], { radius: 8, color: '#f7c86b', fillColor: '#f7c86b', fillOpacity: 1, weight: 3 }).bindPopup(`<strong>Observador</strong><br>Terreno: ${format(observer.point.elevation)} m<br>Altura: ${format(observer.observerElevation - observer.point.elevation)} m`); marker.addTo(state.layer); if (bounds.length) state.map.fitBounds(bounds, { padding: [22, 22], maxZoom: 15 });
  }
  function renderTable(cells) { const rows = cells.slice().sort((a, b) => a.distance - b.distance).slice(0, 150); $('tableWrap').innerHTML = `<table><thead><tr><th>#</th><th>ESTADO</th><th>LONGITUD</th><th>LATITUD</th><th>ELEVACIÓN</th><th>DISTANCIA</th><th>AZIMUT</th></tr></thead><tbody>${rows.map(cell => `<tr><td>${cell.index + 1}</td><td><span class="row-status status-${cell.status === 'visible' || cell.status === 'observador' ? 'visible' : cell.status === 'oculto' ? 'hidden' : 'range'}">${esc(cell.status)}</span></td><td>${format(cell.lon, 5)}</td><td>${format(cell.lat, 5)}</td><td>${format(cell.elevation)} m</td><td>${format(cell.distance / 1000)} km</td><td>${format(cell.bearing)}°</td></tr>`).join('')}</tbody></table><p class="table-foot">Se muestran ${rows.length.toLocaleString('es-ES')} de ${cells.length.toLocaleString('es-ES')} celdas.</p>`; }
  function updateStats(cells, observer) { const visible = cells.filter(item => item.visible).length, hidden = cells.filter(item => item.status === 'oculto').length, maxDistance = Math.max(...cells.map(item => item.distance), 0); $('pointCount').textContent = cells.length.toLocaleString('es-ES'); $('visibleCount').textContent = visible.toLocaleString('es-ES'); $('hiddenCount').textContent = hidden.toLocaleString('es-ES'); $('observerReadout').textContent = `${format(observer.lon, 3)}, ${format(observer.lat, 3)}`; $('maxDistance').textContent = format(maxDistance / 1000) + ' km'; $('visibleBadge').textContent = `${visible}/${cells.length}`; }

  function initMap() { if (!window.L) return; state.map = L.map('map').setView([40.42, -3.70], 12); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map); state.layer = L.layerGroup().addTo(state.map); state.map.on('click', event => { $('observerLon').value = event.latlng.lng.toFixed(5); $('observerLat').value = event.latlng.lat.toFixed(5); calculate(); }); }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function csvCell(value) { const text = String(value ?? ''); return `"${text.replace(/"/g, '""')}"`; }
  function exportCsv() { const lines = ['indice,lon,lat,elevacion_m,estado,visible,distancia_m,azimut_deg,angulo_relativo_mm']; state.cells.forEach(cell => lines.push([cell.index + 1, cell.lon, cell.lat, cell.elevation, cell.status, cell.visible, cell.distance, cell.bearing, cell.angle].map(csvCell).join(','))); download('cuenca-visual.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }
  function exportGeoJSON() { const features = state.cells.map(cell => ({ type: 'Feature', properties: { indice: cell.index + 1, elevacion_m: cell.elevation, estado: cell.status, visible: cell.visible, distancia_m: cell.distance, azimut_deg: cell.bearing, angulo_relativo_mm: cell.angle }, geometry: { type: 'Point', coordinates: [cell.lon, cell.lat] } })); download('cuenca-visual.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('observerLon').value = '-3.700'; $('observerLat').value = '40.420'; calculate(); });
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('geojsonBtn').addEventListener('click', exportGeoJSON); $('csvBtn').addEventListener('click', exportCsv); initMap(); calculate();
})();
