(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = { file: $('fileInput'), dropzone: $('dropzone'), loadDemo: $('loadDemo'), output: $('outputField'), operation: $('operation'), fieldA: $('fieldA'), fieldB: $('fieldB'), fieldBGroup: $('fieldBGroup'), value: $('valueInput'), valueGroup: $('valueGroup'), overwrite: $('overwrite'), apply: $('applyOperation'), undo: $('undo'), reset: $('reset'), features: $('metricFeatures'), fields: $('metricFields'), operationMetric: $('metricOperation'), history: $('metricHistory'), layerBadge: $('layerBadge'), map: $('map'), mapStatus: $('mapStatus'), mapEmpty: $('mapEmpty'), body: $('resultsBody'), summary: $('resultSummary'), exportCsv: $('exportCsv'), exportGeojson: $('exportGeojson') };
  let original = { type: 'FeatureCollection', features: [] };
  let working = { type: 'FeatureCollection', features: [] };
  let fields = [];
  let history = [];
  let map = null;
  let layer = null;

  const demo = { type: 'FeatureCollection', name: 'Muestra para Field Calculator', features: [
    feature('Prospección A', { finds: 84, area_m2: 1200, campaign: '2026' }, { type: 'Point', coordinates: [-3.72, 40.42] }),
    feature('Prospección B', { finds: 32, area_m2: 860, campaign: '2026' }, { type: 'Point', coordinates: [-3.61, 40.47] }),
    feature('Prospección C', { finds: 109, area_m2: 1730, campaign: '2025' }, { type: 'Point', coordinates: [-3.82, 40.38] }),
    feature('Transecto 1', { finds: 54, area_m2: 950, campaign: '2025' }, { type: 'LineString', coordinates: [[-4.05, 40.35], [-3.95, 40.43], [-3.86, 40.48]] }),
    feature('Área de control', { finds: 15, area_m2: 2500, campaign: '2024' }, { type: 'Polygon', coordinates: [[[-3.57, 40.34], [-3.43, 40.34], [-3.43, 40.43], [-3.57, 40.43], [-3.57, 40.34]]] })
  ] };

  function feature(name, properties, geometry) { return { type: 'Feature', properties: { name, ...properties }, geometry }; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalise(input) {
    if (!input || typeof input !== 'object') throw new Error('El JSON no contiene una capa reconocible.');
    if (input.type === 'FeatureCollection') return { type: 'FeatureCollection', features: (input.features || []).filter((item) => item && item.type === 'Feature' && item.geometry).map((item) => clone(item)) };
    if (input.type === 'Feature' && input.geometry) return { type: 'FeatureCollection', features: [clone(input)] };
    if (input.type && input.coordinates) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: clone(input) }] };
    throw new Error('Se esperaba un FeatureCollection, Feature o geometría GeoJSON.');
  }
  function fieldNames() { const names = new Set(); working.features.forEach((item) => Object.keys(item.properties || {}).forEach((name) => names.add(name))); return Array.from(names).sort((a, b) => a.localeCompare(b, 'es')); }
  function getValue(item, field) { return item.properties && Object.prototype.hasOwnProperty.call(item.properties, field) ? item.properties[field] : ''; }
  function numberValue(value) { const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.')); return Number.isFinite(parsed) ? parsed : null; }
  function coordinatesOf(geometry) { if (!geometry) return []; if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).flatMap(coordinatesOf); return Array.isArray(geometry.coordinates) ? flattenPositions(geometry.coordinates) : []; }
  function flattenPositions(value) { if (!Array.isArray(value)) return []; return typeof value[0] === 'number' ? [value] : value.flatMap(flattenPositions); }
  function centroid(geometry) { const positions = coordinatesOf(geometry); if (!positions.length) return [null, null]; return [positions.reduce((sum, position) => sum + position[0], 0) / positions.length, positions.reduce((sum, position) => sum + position[1], 0) / positions.length]; }
  function vertexCount(geometry) { return coordinatesOf(geometry).length; }
  function haversine(a, b) { const rad = Math.PI / 180; const lat1 = a[1] * rad; const lat2 = b[1] * rad; const dLat = (b[1] - a[1]) * rad; const dLon = (b[0] - a[0]) * rad; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }
  function pathsOf(geometry) { if (!geometry) return []; if (geometry.type === 'LineString' || geometry.type === 'Polygon') return geometry.coordinates || []; if (geometry.type === 'MultiLineString' || geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flat(); if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).flatMap(pathsOf); return []; }
  function lengthKm(geometry) { return pathsOf(geometry).reduce((total, path) => total + (path.length > 1 ? path.slice(1).reduce((sum, position, index) => sum + haversine(path[index], position), 0) : 0), 0); }
  function ringAreaM2(ring) { if (!ring || ring.length < 3) return 0; const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length; const metersLon = 111320 * Math.cos(meanLat * Math.PI / 180); const metersLat = 110540; let area = 0; for (let i = 0; i < ring.length; i += 1) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; area += (a[0] * metersLon) * (b[1] * metersLat) - (b[0] * metersLon) * (a[1] * metersLat); } return Math.abs(area / 2); }
  function areaHa(geometry) { if (!geometry) return 0; if (geometry.type === 'Polygon') { const rings = geometry.coordinates || []; return Math.max(0, (rings[0] ? ringAreaM2(rings[0]) : 0) - rings.slice(1).reduce((sum, ring) => sum + ringAreaM2(ring), 0)) / 10000; } if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).reduce((sum, polygon) => sum + areaHa({ type: 'Polygon', coordinates: polygon }), 0); if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).reduce((sum, item) => sum + areaHa(item), 0); return 0; }
  function parseConstant(value) { const text = String(value ?? '').trim(); if (text === '') return ''; if (text === 'true') return true; if (text === 'false') return false; const numeric = numberValue(text); return numeric === null ? text : numeric; }
  function formatNumber(value) { return Number.isFinite(value) ? Math.round(value * 10000) / 10000 : ''; }

  function createMap() {
    if (!window.L) { els.mapStatus.textContent = 'Mapa no disponible; el cálculo sigue funcionando.'; return; }
    map = L.map(els.map, { preferCanvas: true }).setView([40.4, -3.7], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    layer = L.geoJSON(null, { style: () => ({ color: '#59d9d2', weight: 2, fillColor: '#59d9d2', fillOpacity: .25 }), pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 7, color: '#071924', weight: 2, fillColor: '#5be0d8', fillOpacity: .9 }), onEachFeature: (item, leafletLayer) => { const name = item.properties?.name || 'Entidad'; leafletLayer.bindPopup(`<div class="popup-title">${esc(name)}</div><div class="popup-attrs">${esc(JSON.stringify(item.properties || {}, null, 2))}</div>`); } }).addTo(map);
  }
  function renderFields() {
    fields = fieldNames();
    const options = fields.length ? fields.map((field) => `<option value="${esc(field)}">${esc(field)}</option>`).join('') : '<option value="">Sin campos</option>';
    [els.fieldA, els.fieldB].forEach((select) => { const previous = select.value; select.innerHTML = options; if (fields.includes(previous)) select.value = previous; });
    els.features.textContent = working.features.length;
    els.fields.textContent = fields.length;
    els.layerBadge.textContent = working.features.length ? `${working.features.length} entidades` : 'Sin capa';
  }
  function renderOperationUI() {
    const operation = els.operation.value;
    const binary = ['sum', 'difference', 'product', 'ratio', 'concat'].includes(operation);
    const constant = operation === 'constant' || operation === 'concat';
    els.fieldBGroup.classList.toggle('hidden', !binary);
    els.valueGroup.classList.toggle('hidden', !constant);
    els.value.placeholder = operation === 'concat' ? 'Separador · ' : 'ej. 100';
    els.fieldAGroup.classList.toggle('hidden', ['geometry-type', 'centroid-lon', 'centroid-lat', 'vertex-count', 'length-km', 'area-ha', 'constant'].includes(operation));
  }
  function renderTable() {
    const output = String(els.output.value).trim() || 'calculo';
    if (!working.features.length) { els.body.innerHTML = '<tr><td colspan="5" class="empty-cell">Carga una capa para ver la previsualización.</td></tr>'; els.summary.textContent = '0 entidades'; return; }
    els.body.innerHTML = working.features.slice(0, 50).map((item, index) => { const properties = item.properties || {}; const name = properties.name || properties.nombre || properties.title || `Entidad ${index + 1}`; const value = Object.prototype.hasOwnProperty.call(properties, output) ? properties[output] : ''; const state = Object.prototype.hasOwnProperty.call(properties, output) ? (value === '' || value === null ? '<span class="status-empty">vacío</span>' : '<span class="status-ok">calculado</span>') : '<span class="muted">pendiente</span>'; return `<tr><td>${index + 1}</td><td><span class="entity-name">${esc(name)}</span></td><td><span class="value-pill">${esc(value)}</span></td><td><span class="geometry-pill">${esc(item.geometry?.type || 'Sin geometría')}</span></td><td>${state}</td></tr>`; }).join('');
    els.summary.textContent = `${working.features.length} ${working.features.length === 1 ? 'entidad' : 'entidades'}`;
  }
  function renderMap() {
    if (!map || !layer) return;
    layer.clearLayers(); layer.addData(working);
    if (working.features.length) { const bounds = layer.getBounds(); if (bounds.isValid()) map.fitBounds(bounds.pad(.12), { maxZoom: 15 }); els.mapEmpty.classList.add('hidden'); els.mapStatus.textContent = `${working.features.length} entidades visibles`; } else { els.mapEmpty.classList.remove('hidden'); els.mapStatus.textContent = 'Sin entidades'; }
  }
  function renderAll() { renderFields(); renderTable(); renderMap(); els.exportCsv.disabled = !working.features.length; els.exportGeojson.disabled = !working.features.length; els.undo.disabled = !history.length; els.reset.disabled = !original.features.length; }

  function calculate(item) {
    const operation = els.operation.value; const a = getValue(item, els.fieldA.value); const b = getValue(item, els.fieldB.value); const aNumber = numberValue(a); const bNumber = numberValue(b); const separator = els.value.value;
    if (operation === 'copy') return a; if (operation === 'constant') return parseConstant(els.value.value); if (operation === 'sum') return aNumber === null || bNumber === null ? '' : formatNumber(aNumber + bNumber); if (operation === 'difference') return aNumber === null || bNumber === null ? '' : formatNumber(aNumber - bNumber); if (operation === 'product') return aNumber === null || bNumber === null ? '' : formatNumber(aNumber * bNumber); if (operation === 'ratio') return aNumber === null || bNumber === null || bNumber === 0 ? '' : formatNumber(aNumber / bNumber); if (operation === 'concat') return `${a ?? ''}${separator}${b ?? ''}`; if (operation === 'geometry-type') return item.geometry?.type || ''; if (operation === 'centroid-lon') return formatNumber(centroid(item.geometry)[0]); if (operation === 'centroid-lat') return formatNumber(centroid(item.geometry)[1]); if (operation === 'vertex-count') return vertexCount(item.geometry); if (operation === 'length-km') return formatNumber(lengthKm(item.geometry)); if (operation === 'area-ha') return formatNumber(areaHa(item.geometry)); return '';
  }
  function applyOperation() {
    if (!working.features.length) { window.alert('Carga primero una capa GeoJSON o la demo.'); return; }
    const output = String(els.output.value).trim().replace(/[^A-Za-z0-9_áéíóúüñ-]/gi, '_'); if (!output) { window.alert('Indica un nombre de campo de salida.'); return; }
    if (!els.overwrite.checked && fields.includes(output)) { window.alert(`El campo “${output}” ya existe. Activa «Reemplazar si ya existe» o usa otro nombre.`); return; }
    history.push(clone(working)); working.features.forEach((item) => { item.properties = item.properties || {}; item.properties[output] = calculate(item); });
    els.operationMetric.textContent = els.operation.options[els.operation.selectedIndex].text; els.history.textContent = history.length; renderAll();
  }
  function loadData(input, label) { try { original = normalise(input); working = clone(original); history = []; els.operationMetric.textContent = '—'; els.mapStatus.textContent = `${working.features.length} entidades · ${label}`; renderAll(); } catch (error) { window.alert(error.message); } }
  function readFile(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { loadData(JSON.parse(reader.result), file.name); } catch { window.alert('No se ha podido leer el JSON del archivo.'); } }; reader.readAsText(file); }
  function download(filename, content, mime) { const url = URL.createObjectURL(new Blob([content], { type: mime })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function csvCell(value) { const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value); return `"${text.replace(/"/g, '""')}"`; }
  function exportGeoJSON() { download('geojson-field-calculator.geojson', JSON.stringify(working, null, 2), 'application/geo+json;charset=utf-8'); }
  function exportCSV() { const names = fieldNames(); const rows = [['feature_index', 'geometry_type', ...names], ...working.features.map((item, index) => [index + 1, item.geometry?.type || '', ...names.map((name) => getValue(item, name))])]; download('geojson-field-calculator.csv', '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8'); }

  els.file.addEventListener('change', (event) => readFile(event.target.files[0])); els.dropzone.addEventListener('click', () => els.file.click()); els.dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); els.file.click(); } }); ['dragenter', 'dragover'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.add('dragover'); })); ['dragleave', 'drop'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.remove('dragover'); })); els.dropzone.addEventListener('drop', (event) => readFile(event.dataTransfer.files[0])); els.loadDemo.addEventListener('click', () => loadData(demo, 'capa de demostración')); els.operation.addEventListener('change', renderOperationUI); els.apply.addEventListener('click', applyOperation); els.undo.addEventListener('click', () => { if (!history.length) return; working = history.pop(); els.history.textContent = history.length; renderAll(); }); els.reset.addEventListener('click', () => { if (!original.features.length) return; working = clone(original); history = []; els.operationMetric.textContent = '—'; renderAll(); }); els.exportCsv.addEventListener('click', exportCSV); els.exportGeojson.addEventListener('click', exportGeoJSON);
  createMap(); renderOperationUI(); renderAll();
})();
