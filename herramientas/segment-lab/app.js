(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const R = 6371008.8;
  const state = { source: null, lines: [], segments: [], map: null, layer: null };
  const sample = $('source').value;
  const rad = value => value * Math.PI / 180;
  const deg = value => value * 180 / Math.PI;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function formatDistance(value) { return value >= 1000 ? (value / 1000).toLocaleString('es-ES', { maximumFractionDigits: 3 }) + ' km' : value.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' m'; }
  function validPoint(point) { return Array.isArray(point) && point.length >= 2 && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])) && Number(point[0]) >= -180 && Number(point[0]) <= 180 && Number(point[1]) >= -90 && Number(point[1]) <= 90; }
  function normalize(value) { const parsed = typeof value === 'string' ? JSON.parse(value) : value; if (parsed?.type === 'FeatureCollection') return parsed; if (parsed?.type === 'Feature') return { type: 'FeatureCollection', features: [parsed] }; if (parsed?.type && parsed.coordinates) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: parsed }] }; throw new Error('El documento no contiene GeoJSON reconocible.'); }
  function distance(a, b) { const p1 = rad(a[1]), p2 = rad(b[1]), dLat = p2 - p1, dLon = rad(b[0] - a[0]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); }
  function bearing(a, b) { if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return 0; const p1 = rad(a[1]), p2 = rad(b[1]), dLon = rad(b[0] - a[0]); const value = deg(Math.atan2(Math.sin(dLon) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon))); return (value + 360) % 360; }
  function lineParts(feature) { if (feature.geometry?.type === 'LineString') return [feature.geometry.coordinates]; if (feature.geometry?.type === 'MultiLineString') return feature.geometry.coordinates; return []; }
  function positionAt(line, target, cumulative) { if (target <= 0) return line[0].slice(0, 2); for (let index = 1; index < line.length; index += 1) { const start = cumulative[index - 1], span = cumulative[index] - start; if (target <= cumulative[index] || index === line.length - 1) { const fraction = span ? Math.max(0, Math.min(1, (target - start) / span)) : 0; return [line[index - 1][0] + (line[index][0] - line[index - 1][0]) * fraction, line[index - 1][1] + (line[index][1] - line[index - 1][1]) * fraction]; } } return line[line.length - 1].slice(0, 2); }
  function sliceLine(line, cumulative, from, to) { const coordinates = [positionAt(line, from, cumulative)]; for (let index = 1; index < line.length - 1; index += 1) if (cumulative[index] > from + 1e-7 && cumulative[index] < to - 1e-7) coordinates.push(line[index].slice(0, 2)); const end = positionAt(line, to, cumulative); const last = coordinates[coordinates.length - 1]; if (!last || last[0] !== end[0] || last[1] !== end[1]) coordinates.push(end); return coordinates; }
  function calculate(collection) {
    const interval = Number($('interval').value);
    if (!Number.isFinite(interval) || interval <= 0) throw new Error('La longitud de tramo debe ser mayor que cero.');
    const lines = [], segments = [];
    collection.features.forEach((feature, featureIndex) => lineParts(feature).forEach((raw, partIndex) => {
      const line = raw.filter(validPoint).map(point => [Number(point[0]), Number(point[1])]);
      if (line.length < 2) return;
      const cumulative = [0];
      for (let index = 1; index < line.length; index += 1) cumulative.push(cumulative[index - 1] + distance(line[index - 1], line[index]));
      const length = cumulative[cumulative.length - 1];
      if (!length) return;
      const lineIndex = lines.length + 1;
      const name = feature.properties?.name || feature.properties?.nombre || `Línea ${lineIndex}`;
      lines.push({ lineIndex, feature, partIndex: partIndex + 1, line, cumulative, length, name });
      let from = 0, segmentIndex = 0;
      while (from < length - 0.01) {
        const to = Math.min(from + interval, length);
        const partial = to - from < interval - 0.01;
        if (partial && !$('includeRemainder').checked) break;
        segmentIndex += 1;
        const coords = sliceLine(line, cumulative, from, to);
        const middle = positionAt(line, (from + to) / 2, cumulative);
        segments.push({ id: segments.length + 1, lineIndex, part: partIndex + 1, segment: segmentIndex, from, to, length: to - from, bearing: bearing(coords[0], coords[coords.length - 1]), point: middle, name, featureIndex, properties: feature.properties || {}, geometry: { type: 'LineString', coordinates: coords } });
        from = to;
      }
    }));
    if (!lines.length) throw new Error('La capa no contiene líneas válidas.');
    if (!segments.length) throw new Error('No se pudieron crear tramos; aumenta o reduce la longitud objetivo.');
    state.source = collection; state.lines = lines; state.segments = segments;
    const totalLength = lines.reduce((sum, item) => sum + item.length, 0);
    $('lineCount').textContent = lines.length.toLocaleString('es-ES'); $('lengthTotal').textContent = formatDistance(totalLength); $('segmentCount').textContent = segments.length.toLocaleString('es-ES'); $('intervalReadout').textContent = formatDistance(interval); $('segmentBadge').textContent = segments.length + (segments.length === 1 ? ' tramo' : ' tramos'); $('quality').textContent = $('includeRemainder').checked ? 'Conserva finales parciales' : 'Sólo tramos completos'; $('quality').className = 'quality';
    renderTable(); renderMap(); $('geojsonBtn').disabled = false; $('csvBtn').disabled = false; status(`${segments.length} tramos generados sobre ${lines.length} líneas localmente.`);
  }
  function resultCollection() { return { type: 'FeatureCollection', name: 'segment-lab', features: state.segments.map(item => ({ type: 'Feature', id: `line-${item.lineIndex}-segment-${item.segment}`, properties: { ...item.properties, source_name: item.name, line_index: item.lineIndex, part_index: item.part, segment_index: item.segment, from_m: Number(item.from.toFixed(3)), to_m: Number(item.to.toFixed(3)), length_m: Number(item.length.toFixed(3)), bearing_deg: Number(item.bearing.toFixed(3)) }, geometry: item.geometry })) }; }
  function renderTable() { const rows = state.segments.slice(0, 500).map(item => `<tr><td>${item.id}</td><td>${esc(item.name)}</td><td>${item.lineIndex}.${item.part}</td><td>${item.segment}</td><td>${formatDistance(item.from)}</td><td>${formatDistance(item.to)}</td><td>${formatDistance(item.length)}</td><td>${item.bearing.toFixed(1)}°</td></tr>`).join(''); $('tableWrap').innerHTML = `<table><thead><tr><th>#</th><th>Línea</th><th>Parte</th><th>Tramo</th><th>Desde</th><th>Hasta</th><th>Longitud</th><th>Rumbo</th></tr></thead><tbody>${rows}</tbody></table>${state.segments.length > 500 ? `<p class="table-note">Se muestran 500 de ${state.segments.length.toLocaleString('es-ES')} tramos; la exportación incluye todos.</p>` : ''}`; }
  function popup(item) { return `<strong>${esc(item.name)}</strong><br>Tramo ${item.lineIndex}.${item.part}.${item.segment}<br>${formatDistance(item.from)}–${formatDistance(item.to)} · ${formatDistance(item.length)}<br>Rumbo: ${item.bearing.toFixed(1)}°`; }
  function initMap() { if (!window.L) { $('map').hidden = true; $('mapFallback').hidden = false; return; } state.map = L.map('map', { preferCanvas: true }).setView([40.4168, -3.7038], 13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(state.map); state.layer = L.layerGroup().addTo(state.map); }
  function renderMap() { if (!state.layer) return; state.layer.clearLayers(); const originals = L.geoJSON({ type: 'FeatureCollection', features: state.lines.map(item => item.feature) }, { style: { color: '#91a8bd', weight: 3, opacity: .45 } }).addTo(state.layer); state.segments.forEach((item, index) => { const hue = (index * 47) % 360; L.geoJSON({ type: 'Feature', properties: {}, geometry: item.geometry }, { style: { color: `hsl(${hue} 82% 68%)`, weight: 5, opacity: .9 } }).bindPopup(popup(item)).addTo(state.layer); }); const bounds = originals.getBounds(); if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [25, 25], maxZoom: 16 }); }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportCsv() { const lines = ['id,line_index,part_index,segment_index,from_m,to_m,length_m,bearing_deg,source_name']; state.segments.forEach(item => lines.push([item.id, item.lineIndex, item.part, item.segment, item.from.toFixed(3), item.to.toFixed(3), item.length.toFixed(3), item.bearing.toFixed(3), item.name].map(value => '"' + String(value).replace(/"/g, '""') + '"').join(','))); download('segmentos-lineales.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }
  function run() { try { calculate(normalize($('source').value)); } catch (error) { status(error.message || 'No se pudieron generar tramos.', true); } }
  $('calculateBtn').addEventListener('click', run); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('interval').value = 600; $('includeRemainder').checked = true; run(); }); $('clearBtn').addEventListener('click', () => { state.source = null; state.lines = []; state.segments = []; state.layer?.clearLayers(); $('tableWrap').innerHTML = '<p class="empty">Genera tramos para ver la tabla.</p>'; $('lineCount').textContent = '—'; $('lengthTotal').textContent = '—'; $('segmentCount').textContent = '—'; $('intervalReadout').textContent = '—'; $('segmentBadge').textContent = '0 tramos'; $('quality').textContent = 'Sin calcular'; $('quality').className = 'quality muted'; $('geojsonBtn').disabled = true; $('csvBtn').disabled = true; status('Carga una capa para empezar.'); }); $('interval').addEventListener('change', run); $('includeRemainder').addEventListener('change', run); $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 120 * 1024 * 1024) { status('El archivo supera 120 MB; no se abre en esta herramienta local.', true); return; } const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); run(); }; reader.onerror = () => status('No se pudo leer el archivo local.', true); reader.readAsText(file); }); $('geojsonBtn').addEventListener('click', () => download('segmentos-lineales.geojson', JSON.stringify(resultCollection(), null, 2), 'application/geo+json;charset=utf-8')); $('csvBtn').addEventListener('click', exportCsv); initMap(); run();
})();
