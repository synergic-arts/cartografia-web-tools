(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { points: [], contours: [], map: null, layer: null, meta: null };
  const colors = ['#313695','#4575b4','#74add1','#abd9e9','#e0f3f8','#fee090','#fdae61','#f46d43','#d73027','#a50026'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function formatValue(value) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: 3 }); }
  function csvRows(value) { const clean = value.replace(/^\uFEFF/, ''), first = clean.split(/\r?\n/).find(line => line.trim()) || '', delimiter = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0], rows = []; let row = [], cell = '', quote = false; for (let i = 0; i < clean.length; i += 1) { const char = clean[i], next = clean[i + 1]; if (char === '"' && quote && next === '"') { cell += '"'; i += 1; } else if (char === '"') quote = !quote; else if (char === delimiter && !quote) { row.push(cell.trim()); cell = ''; } else if ((char === '\n' || char === '\r') && !quote) { if (char === '\r' && next === '\n') i += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; } else cell += char; } row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); return rows; }
  function featurePoints(value) { const parsed = JSON.parse(value), features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : parsed.coordinates ? [{ geometry: parsed, properties: {} }] : [], field = $('valueField').value.trim(); return features.map((feature, index) => { if (feature.geometry?.type !== 'Point') return null; const coords = feature.geometry.coordinates, raw = feature.properties?.[field]; return { lon: Number(coords[0]), lat: Number(coords[1]), value: Number(raw), name: feature.properties?.name || feature.properties?.nombre || 'Punto ' + (index + 1) }; }).filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat) && Number.isFinite(point.value) && point.lon >= -180 && point.lon <= 180 && point.lat >= -90 && point.lat <= 90); }
  function parsePoints(value) { const trimmed = value.trim(); if (trimmed.startsWith('{') || trimmed.startsWith('[')) return featurePoints(trimmed); const rows = csvRows(value); if (rows.length < 2) throw new Error('El CSV necesita una cabecera y al menos un punto.'); const headers = rows[0].map(header => String(header).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')), find = aliases => headers.findIndex(header => aliases.includes(header)), lonIndex = find(['lon','lng','longitude','longitud','x','coordx']), latIndex = find(['lat','latitude','latitud','y','coordy']), valueIndex = find(['value','valor','z','elev','elevacion','altitud','height','ndvi','temperatura']); if (lonIndex < 0 || latIndex < 0 || valueIndex < 0) throw new Error('CSV no reconocido: necesita columnas lon, lat y value/elevacion o equivalentes.'); return rows.slice(1).map((row, index) => ({ lon: Number(String(row[lonIndex]).replace(',', '.')), lat: Number(String(row[latIndex]).replace(',', '.')), value: Number(String(row[valueIndex]).replace(',', '.')), name: row[0] || 'Punto ' + (index + 1) })).filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat) && Number.isFinite(point.value) && point.lon >= -180 && point.lon <= 180 && point.lat >= -90 && point.lat <= 90); }
  function idw(points, lon, lat) { let numerator = 0, denominator = 0; points.forEach(point => { const dx = (point.lon - lon) * Math.cos(lat * Math.PI / 180), dy = point.lat - lat, d = Math.sqrt(dx * dx + dy * dy); if (d < 1e-10) { numerator = point.value; denominator = 1; return; } const weight = 1 / d ** 2; numerator += point.value * weight; denominator += weight; }); return denominator ? numerator / denominator : null; }
  function edgePoint(a, b, va, vb, level) { if ((va < level && vb < level) || (va > level && vb > level) || va === vb) return null; const t = Math.max(0, Math.min(1, (level - va) / (vb - va))); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function buildContours(points, gridSize, interval) {
    const minLon = Math.min(...points.map(point => point.lon));
    const maxLon = Math.max(...points.map(point => point.lon));
    const minLat = Math.min(...points.map(point => point.lat));
    const maxLat = Math.max(...points.map(point => point.lat));
    const nx = gridSize;
    const ny = gridSize;
    const values = [];
    for (let y = 0; y <= ny; y += 1) {
      const row = [];
      const lat = minLat + (maxLat - minLat) * y / ny;
      for (let x = 0; x <= nx; x += 1) {
        row.push(idw(points, minLon + (maxLon - minLon) * x / nx, lat));
      }
      values.push(row);
    }

    const low = Math.min(...values.flat());
    const high = Math.max(...values.flat());
    const levels = [];
    for (let level = Math.ceil(low / interval) * interval; level <= high + interval * .001; level += interval) {
      levels.push(Number(level.toFixed(8)));
    }

    const contours = [];
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const p = [
          [minLon + (maxLon - minLon) * x / nx, minLat + (maxLat - minLat) * y / ny],
          [minLon + (maxLon - minLon) * (x + 1) / nx, minLat + (maxLat - minLat) * y / ny],
          [minLon + (maxLon - minLon) * (x + 1) / nx, minLat + (maxLat - minLat) * (y + 1) / ny],
          [minLon + (maxLon - minLon) * x / nx, minLat + (maxLat - minLat) * (y + 1) / ny]
        ];
        const v = [values[y][x], values[y][x + 1], values[y + 1][x + 1], values[y + 1][x]];
        levels.forEach(level => {
          const edges = [
            [p[0], p[1], v[0], v[1]],
            [p[1], p[2], v[1], v[2]],
            [p[2], p[3], v[2], v[3]],
            [p[3], p[0], v[3], v[0]]
          ];
          const hits = edges.map(edge => edgePoint(...edge, level)).filter(Boolean);
          for (let i = 0; i + 1 < hits.length; i += 2) {
            contours.push({ level, coordinates: [hits[i], hits[i + 1]], cell: x + ',' + y });
          }
        });
      }
    }
    return { contours, minLon, maxLon, minLat, maxLat, low, high, levels };
  }
  function colorFor(level) {
    const levels = state.meta?.levels || [level];
    const index = levels.indexOf(level);
    const position = Math.round(index / Math.max(1, levels.length - 1) * (colors.length - 1));
    return colors[Math.max(0, Math.min(colors.length - 1, position))];
  }
  function contourCollection() { return { type: 'FeatureCollection', features: state.contours.map(item => ({ type: 'Feature', properties: { level: item.level, method: 'IDW + marching squares', cell: item.cell }, geometry: { type: 'LineString', coordinates: item.coordinates } })) }; }
  function renderTable() { const grouped = new Map(); state.contours.forEach(item => grouped.set(item.level, (grouped.get(item.level) || 0) + 1)); $('tableWrap').innerHTML = '<table><thead><tr><th>Nivel</th><th>Segmentos</th><th>Color</th></tr></thead><tbody>' + [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([level, count]) => `<tr><td><strong>${formatValue(level)}</strong></td><td>${count}</td><td><span class="swatch" style="background:${colorFor(level)}"></span>${colorFor(level)}</td></tr>`).join('') + '</tbody></table>'; }
  function initMap() { if (!window.L) { $('map').hidden = true; $('mapFallback').hidden = false; return; } state.map = L.map('map').setView([40.4, -3.7], 6); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map); state.layer = L.layerGroup().addTo(state.map); }
  function renderMap() { if (!state.layer) return; state.layer.clearLayers(); const points = L.featureGroup(state.points.map(point => L.circleMarker([point.lat, point.lon], { radius: 4, color: '#eff7ff', weight: 1, fillColor: '#eff7ff', fillOpacity: .85 }).bindPopup(`<strong>${esc(point.name)}</strong><br>Valor: ${formatValue(point.value)}`))); points.addTo(state.layer); state.contours.forEach(item => L.polyline(item.coordinates.map(point => [point[1], point[0]]), { color: colorFor(item.level), weight: 2, opacity: .82 }).bindPopup('Nivel: ' + formatValue(item.level)).addTo(state.layer)); if (points.getBounds().isValid()) state.map.fitBounds(points.getBounds(), { padding: [25, 25], maxZoom: 16 }); }
  function calculate() { try { const points = parsePoints($('source').value); if (points.length < 3) throw new Error('Se necesitan al menos tres puntos válidos.'); const interval = Number($('interval').value), gridSize = Number($('gridSize').value); if (!Number.isFinite(interval) || interval <= 0) throw new Error('El intervalo debe ser mayor que cero.'); const result = buildContours(points, gridSize, interval); state.points = points; state.contours = result.contours; state.meta = { ...result, interval, gridSize }; $('pointCount').textContent = points.length.toLocaleString('es-ES'); $('valueRange').textContent = formatValue(result.low) + ' – ' + formatValue(result.high); $('lineCount').textContent = state.contours.length.toLocaleString('es-ES'); $('intervalReadout').textContent = formatValue(interval); $('contourBadge').textContent = state.contours.length + ' líneas'; $('quality').textContent = state.contours.length ? `${result.levels.length} niveles` : 'Sin niveles'; $('quality').className = 'quality'; renderTable(); renderMap(); $('geojsonBtn').disabled = !state.contours.length; $('csvBtn').disabled = !state.contours.length; setStatus(`${points.length} puntos interpolados localmente en una malla ${gridSize} × ${gridSize}.`); } catch (error) { setStatus(error.message || 'No se pudo generar la superficie.', true); } }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportCsv() { const lines = ['nivel,lon_inicio,lat_inicio,lon_fin,lat_fin,celda']; state.contours.forEach(item => lines.push([item.level, item.coordinates[0][0], item.coordinates[0][1], item.coordinates[1][0], item.coordinates[1][1], item.cell].join(','))); download('isolineas.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }
  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('valueField').value = 'elevacion'; calculate(); }); $('interval').addEventListener('change', calculate); $('gridSize').addEventListener('change', calculate); $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); }); $('geojsonBtn').addEventListener('click', () => download('isolineas.geojson', JSON.stringify(contourCollection(), null, 2), 'application/geo+json;charset=utf-8')); $('csvBtn').addEventListener('click', exportCsv); initMap(); calculate();
})();
