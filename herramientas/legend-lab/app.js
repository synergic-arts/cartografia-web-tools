(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { parsed: null, features: [], classes: [], map: null, layer: null, field: '', type: '', method: '', palette: [] };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const paletteMap = {
    teal: ['#d7f4ef','#a5e5da','#75d6c4','#39acaa','#14787e','#074c5c','#052f40','#021e2d','#011621'],
    sunset: ['#fff0d9','#ffd09a','#f7a46b','#e97460','#c64d68','#963d68','#6e356d','#482c5d','#2b244b'],
    viridis: ['#f1f8a9','#b7df8a','#6bc483','#35a77d','#218d8d','#276c8e','#35558c','#443983','#440154'],
    mono: ['#e7f0f3','#c8d8df','#a8c0ca','#89a8b6','#6b8f9e','#4d7688','#315d72','#17465d','#062f49']
  };

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function formatValue(value) { return Number.isFinite(Number(value)) ? format(Number(value), 2) : String(value ?? 'sin valor'); }
  function getProperty(properties, field) { if (Object.prototype.hasOwnProperty.call(properties, field)) return properties[field]; const wanted = field.toLowerCase(); const key = Object.keys(properties).find(candidate => candidate.toLowerCase() === wanted); return key ? properties[key] : undefined; }
  function parseNumber(value) { if (value === null || value === undefined || String(value).trim() === '') return null; const number = Number(String(value).replace(',', '.')); return Number.isFinite(number) ? number : null; }

  function parseSource(value) {
    const parsed = JSON.parse(value.trim());
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [{ type: 'Feature', properties: {}, geometry: parsed }];
    const valid = features.filter(feature => feature && feature.geometry && feature.geometry.type);
    if (!valid.length) throw new Error('No se encontraron entidades GeoJSON válidas.');
    return { parsed, features: valid };
  }

  function fieldsFor(features) { const fields = new Set(); features.forEach(feature => Object.keys(feature.properties || {}).forEach(field => fields.add(field))); return [...fields]; }
  function refreshFields(features) {
    const fields = fieldsFor(features); const current = $('field').value; $('field').innerHTML = fields.map(field => `<option value="${esc(field)}">${esc(field)}</option>`).join('');
    const preferred = fields.find(field => field === current) || fields.find(field => /valor|value|score|cantidad|count|indice/i.test(field)) || fields[0];
    if (preferred) $('field').value = preferred;
  }
  function detectedType(features, field) {
    const values = features.map(feature => getProperty(feature.properties || {}, field)).filter(value => value !== undefined && value !== null && String(value).trim() !== '');
    return values.length && values.every(value => parseNumber(value) !== null) ? 'numeric' : 'categorical';
  }
  function palette() { const colors = paletteMap[$('palette').value] || paletteMap.teal; return colors.slice().reverse(); }

  function numericClasses(values, count, method, colors) {
    const sorted = values.slice().sort((a, b) => a - b), min = sorted[0], max = sorted[sorted.length - 1];
    let edges = [];
    if (method === 'equal' && max > min) { const step = (max - min) / count; edges = Array.from({ length: count + 1 }, (_, index) => index === count ? max : min + step * index); }
    else { edges = Array.from({ length: count + 1 }, (_, index) => index === 0 ? min : index === count ? max : sorted[Math.min(sorted.length - 1, Math.floor(index / count * sorted.length))]); }
    const classes = [];
    for (let index = 0; index < count; index++) { const low = edges[index], high = edges[index + 1]; classes.push({ index, color: colors[Math.min(index, colors.length - 1)], min: low, max: high, label: `${formatValue(low)} – ${formatValue(high)}`, count: 0 }); }
    return { classes, classify: value => { const number = parseNumber(value); if (number === null) return -1; let index = classes.findIndex((item, position) => position === classes.length - 1 ? number <= item.max : number >= item.min && number <= item.max); if (index < 0) index = number < classes[0].min ? 0 : classes.length - 1; return index; } };
  }

  function categoricalClasses(values, count, colors) {
    const frequency = new Map(); values.forEach(value => frequency.set(String(value), (frequency.get(String(value)) || 0) + 1));
    const ordered = [...frequency.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
    const chosen = ordered.slice(0, Math.max(1, count - (ordered.length > count ? 1 : 0))), other = ordered.slice(chosen.length), classes = chosen.map((item, index) => ({ index, color: colors[Math.min(index, colors.length - 1)], label: item[0], count: item[1], value: item[0] }));
    if (other.length) classes.push({ index: classes.length, color: colors[Math.min(classes.length, colors.length - 1)], label: 'Otros', count: other.reduce((sum, item) => sum + item[1], 0), value: other.map(item => item[0]) });
    const lookup = new Map(); classes.forEach(item => (Array.isArray(item.value) ? item.value : [item.value]).forEach(value => lookup.set(String(value), item.index)));
    return { classes, classify: value => lookup.has(String(value)) ? lookup.get(String(value)) : -1 };
  }

  function classifyFeatures(features) {
    const field = $('field').value, detected = detectedType(features, field), type = $('dataMode').value === 'auto' ? detected : $('dataMode').value, method = $('method').value, count = Math.max(2, Math.min(9, Number($('classCount').value) || 5)), colors = palette();
    const rawValues = features.map(feature => getProperty(feature.properties || {}, field)), values = rawValues.filter(value => value !== undefined && value !== null && String(value).trim() !== '');
    const numericValues = values.map(parseNumber).filter(value => value !== null);
    const result = type === 'numeric' && numericValues.length ? numericClasses(numericValues, count, method, colors) : categoricalClasses(values, count, colors);
    result.classes.forEach(item => { item.count = 0; });
    const assignments = features.map(feature => { const value = getProperty(feature.properties || {}, field), index = result.classify(value); if (index >= 0 && result.classes[index]) result.classes[index].count += 1; return { value, index }; });
    return { ...result, assignments, field, type: type === 'numeric' && numericValues.length ? 'numeric' : 'categorical', method, detected, colors };
  }

  function initMap() {
    if (!window.L) return;
    state.map = L.map('map').setView([40.418, -3.703], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }
  function renderMap(result) {
    if (!state.layer) return;
    state.layer.clearLayers(); const bounds = []; const source = { type: 'FeatureCollection', features: state.features.map((feature, index) => ({ ...feature, properties: { ...(feature.properties || {}), _legend_index: result.assignments[index].index } })) };
    const layer = L.geoJSON(source, { style: feature => { const index = feature.properties?._legend_index; const item = result.classes[index]; return { color: item?.color || '#9db2bd', fillColor: item?.color || '#9db2bd', fillOpacity: .58, weight: 2 }; }, pointToLayer: (feature, latlng) => { const item = result.classes[feature.properties?._legend_index]; return L.circleMarker(latlng, { radius: 8, color: item?.color || '#9db2bd', fillColor: item?.color || '#9db2bd', fillOpacity: .86, weight: 2 }); }, onEachFeature: (feature, leafletLayer) => { const index = feature.properties?._legend_index, item = result.classes[index], value = getProperty(feature.properties || {}, result.field); leafletLayer.bindPopup(`<strong>${esc(feature.properties?.nombre || feature.properties?.name || 'Entidad')}</strong><br>${esc(result.field)}: ${esc(formatValue(value))}<br>Clase: ${esc(item?.label || 'sin clase')}`); } });
    layer.addTo(state.layer); layer.eachLayer(item => { if (item.getBounds) item.getBounds().isValid() && bounds.push(item.getBounds()); else if (item.getLatLng) bounds.push(L.latLngBounds(item.getLatLng(), item.getLatLng())); });
    const merged = bounds.reduce((acc, item) => acc ? acc.extend(item) : item, null); if (merged?.isValid()) state.map.fitBounds(merged, { padding: [22, 22], maxZoom: 15 });
  }

  function renderLegend(result) {
    $('legend').innerHTML = `<div class="legend-title"><strong>${esc(result.field)}</strong><span>${result.type === 'numeric' ? esc(result.method === 'quantile' ? 'Cuantiles' : 'Intervalos iguales') : 'Categorías'}</span></div>${result.classes.map(item => `<div class="legend-row"><span class="swatch" style="background:${esc(item.color)}"></span><span class="legend-label">${esc(item.label)}</span><span class="legend-count">${item.count}</span></div>`).join('')}`;
    $('classTable').innerHTML = `<table><thead><tr><th>#</th><th>CLASE</th><th>COLOR</th><th>ENTIDADES</th></tr></thead><tbody>${result.classes.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item.label)}</td><td><span class="color-chip" style="background:${esc(item.color)}"></span><code>${esc(item.color)}</code></td><td>${item.count}</td></tr>`).join('')}</tbody></table>`;
  }

  function calculate() {
    try {
      const parsed = parseSource($('source').value); refreshFields(parsed.features); const result = classifyFeatures(parsed.features); state.parsed = parsed.parsed; state.features = parsed.features; state.classes = result.classes; state.field = result.field; state.type = result.type; state.method = result.method; state.palette = result.colors; state.assignments = result.assignments; renderMap(result); renderLegend(result);
      const missing = result.assignments.filter(item => item.index < 0).length; $('featureCount').textContent = parsed.features.length.toLocaleString('es-ES'); $('valueType').textContent = result.type === 'numeric' ? 'numérico' : 'categórico'; $('classCountReadout').textContent = result.classes.length; $('missingCount').textContent = missing; $('fieldReadout').textContent = result.field; $('classBadge').textContent = `${result.classes.length} clases`; $('quality').textContent = missing ? 'Revisar valores' : 'Listo'; $('quality').style.background = missing ? '#342c18' : '#143747'; $('quality').style.borderColor = missing ? '#725c2a' : '#346275'; $('quality').style.color = missing ? '#f4c56b' : 'var(--accent)'; $('geojsonBtn').disabled = false; $('styleBtn').disabled = false; $('svgBtn').disabled = false;
      setStatus(`${parsed.features.length} entidades clasificadas localmente en ${result.classes.length} clases.`);
    } catch (error) { setStatus(error.message || 'No se pudo generar la leyenda.', true); }
  }

  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportGeoJSON() { const features = state.features.map((feature, index) => { const assignment = state.assignments[index], item = state.classes[assignment.index]; return { ...feature, properties: { ...(feature.properties || {}), _legend_field: state.field, _legend_class: item?.label || 'sin clase', _legend_index: assignment.index, _legend_color: item?.color || null } }; }); download('capa-simbolizada.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json;charset=utf-8'); }
  function exportStyle() { const specification = { type: 'cartografia-web-tools-legend', field: state.field, dataType: state.type, method: state.method, palette: $('palette').value, classes: state.classes }; download('especificacion-leyenda.json', JSON.stringify(specification, null, 2), 'application/json;charset=utf-8'); }
  function xmlText(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[char])); }
  function exportSvg() { const width = 430, rowHeight = 34, height = 58 + state.classes.length * rowHeight; const rows = state.classes.map((item, index) => `<rect x="18" y="${45 + index * rowHeight}" width="22" height="22" rx="4" fill="${item.color}"/><text x="52" y="${61 + index * rowHeight}" fill="#1d2935" font-family="system-ui, sans-serif" font-size="14">${xmlText(item.label)} (${item.count})</text>`).join(''); const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><text x="18" y="25" fill="#102030" font-family="system-ui, sans-serif" font-size="17" font-weight="700">${xmlText(state.field)}</text>${rows}</svg>`; download('leyenda.svg', svg, 'image/svg+xml;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; calculate(); }); $('field').addEventListener('change', () => { if (state.features.length) calculate(); });
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('geojsonBtn').addEventListener('click', exportGeoJSON); $('styleBtn').addEventListener('click', exportStyle); $('svgBtn').addEventListener('click', exportSvg);
  initMap(); calculate();
})();
