(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const palettes = {
    viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
    blueRed: ['#2166ac', '#67a9cf', '#d1e5f0', '#fddbc7', '#ef8a62', '#b2182b'],
    earth: ['#543005', '#8c510a', '#d8b365', '#f6e8c3', '#c7eae5', '#5ab4ac'],
    single: ['#d9f0ff', '#add8f0', '#81bfe0', '#559fca', '#2f7da9', '#155174']
  };
  const demo = {
    type: 'FeatureCollection',
    features: [
      ['Valeria', -2.891, 39.792, 84, 'romano'], ['Vega Baja', -4.031, 39.854, 112, 'visigodo'],
      ['Labitolosa', 0.154, 42.141, 67, 'romano'], ['Cástulo', -3.631, 38.039, 138, 'ibero'],
      ['Clunia', -3.358, 41.805, 96, 'romano'], ['Acinipo', -5.235, 36.832, 58, 'romano'],
      ['Numancia', -2.445, 41.806, 121, 'celtibero'], ['Coaña', -6.745, 43.512, 35, 'castreño']
    ].map(([name, lon, lat, finds, period], index) => ({ type: 'Feature', id: index + 1, properties: { name, finds, period }, geometry: { type: 'Point', coordinates: [lon, lat] } }))
  };
  const state = { source: null, features: [], styled: [], fileName: 'capa.geojson', field: '', fieldType: 'number', mode: 'quantile', classes: 5, palette: 'viridis', opacity: .78, radius: 7, map: null, layer: null, base: null, model: null };

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function isFeature(value) { return value && typeof value === 'object' && value.type === 'Feature' && value.geometry; }
  function normalise(input) {
    if (!input || typeof input !== 'object') throw new Error('El documento no es JSON.');
    if (input.type === 'FeatureCollection' && Array.isArray(input.features)) return input;
    if (input.type === 'Feature') return { type: 'FeatureCollection', features: [input] };
    if (typeof input.type === 'string' && input.coordinates) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: input }] };
    throw new Error('Carga un FeatureCollection, Feature o geometría GeoJSON.');
  }
  function numeric(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const text = String(value).trim().replace(/\s/g, '').replace(',', '.');
    const result = Number(text);
    return Number.isFinite(result) ? result : null;
  }
  function fields() {
    const names = new Set();
    state.features.forEach((feature) => Object.keys(feature.properties || {}).forEach((name) => names.add(name)));
    return [...names].map((name) => {
      const values = state.features.map((feature) => feature.properties?.[name]).filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
      const numbers = values.map(numeric).filter((value) => value !== null);
      return { name, type: values.length && numbers.length === values.length ? 'number' : 'category', values, numbers, unique: new Set(values.map(String)).size };
    }).sort((left, right) => Number(right.type === 'number') - Number(left.type === 'number') || left.name.localeCompare(right.name, 'es'));
  }
  function quantile(values, fraction) {
    if (!values.length) return 0;
    const ordered = [...values].sort((a, b) => a - b);
    const index = (ordered.length - 1) * fraction;
    const lower = Math.floor(index), upper = Math.ceil(index);
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower);
  }
  function formatNumber(value) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 }); }
  function thresholds(values, mode, count) {
    const min = Math.min(...values), max = Math.max(...values);
    if (mode === 'equal') return Array.from({ length: count - 1 }, (_, index) => min + ((index + 1) / count) * (max - min));
    return Array.from({ length: count - 1 }, (_, index) => quantile(values, (index + 1) / count));
  }
  function classification() {
    const selected = fields().find((field) => field.name === state.field);
    if (!selected) return { type: 'category', categories: [], colors: palettes[state.palette], classOf: () => -1, labelOf: () => '' };
    const colors = palettes[state.palette];
    if (selected.type !== 'number' || state.mode === 'categorical') {
      const categories = [...new Set(selected.values.map((value) => String(value || 'Sin valor')))].sort((a, b) => a.localeCompare(b, 'es')).slice(0, 24);
      const index = new Map(categories.map((value, position) => [value, position]));
      return { type: 'category', categories, colors, classOf: (value) => index.has(String(value || 'Sin valor')) ? index.get(String(value || 'Sin valor')) : 0, labelOf: (value) => String(value || 'Sin valor') };
    }
    const limits = thresholds(selected.numbers, state.mode, state.classes);
    return { type: 'number', limits, colors, classOf: (value) => { const number = numeric(value); if (number === null) return -1; return limits.findIndex((limit) => number <= limit) + 1; }, labelOf: (value) => numeric(value) === null ? 'Sin valor' : Number(numeric(value)).toLocaleString('es-ES', { maximumFractionDigits: 2 }) };
  }
  function legendItems(model) {
    if (!model || !model.colors) return [];
    if (model.type === 'category') return model.categories.map((label, index) => ({ label, color: model.colors[index % model.colors.length] }));
    const labels = ['≤ ' + formatNumber(model.limits[0]), ...model.limits.slice(1).map((limit, index) => `${formatNumber(model.limits[index])} – ${formatNumber(limit)}`), '> ' + formatNumber(model.limits[model.limits.length - 1])];
    return labels.map((label, index) => ({ label, color: model.colors[index % model.colors.length] }));
  }
  function styledFeature(feature, model) {
    const value = feature.properties?.[state.field];
    const classIndex = model.classOf(value);
    const color = classIndex < 0 ? '#94a3b8' : model.colors[classIndex % model.colors.length];
    return { ...feature, properties: { ...(feature.properties || {}), _style_field: state.field, _style_class: classIndex < 0 ? 'Sin valor' : classIndex + 1, _style_color: color } };
  }
  function popup(feature) {
    const entries = Object.entries(feature.properties || {}).filter(([key]) => !key.startsWith('_')).slice(0, 18).map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    return `<strong>${escapeHtml(feature.properties?.name || feature.properties?.title || 'Entidad')}</strong><table class="popup-table">${entries}</table>`;
  }
  function renderMap() {
    if (!state.map) return;
    state.layer?.remove();
    state.layer = L.geoJSON({ type: 'FeatureCollection', features: state.styled }, {
      style: (feature) => ({ color: feature.properties?._style_color || '#94a3b8', fillColor: feature.properties?._style_color || '#94a3b8', fillOpacity: state.opacity, weight: 1.5 }),
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: state.radius, color: '#f8fafc', weight: 1.2, fillColor: feature.properties?._style_color || '#94a3b8', fillOpacity: state.opacity }),
      onEachFeature: (feature, layer) => layer.bindPopup(popup(feature))
    }).addTo(state.map);
    const bounds = state.layer.getBounds();
    if (bounds.isValid()) state.map.fitBounds(bounds.pad(.12), { maxZoom: 14 });
  }
  function renderLegend(model) {
    $('legend').innerHTML = legendItems(model).map((item) => `<div class="legend-item"><i style="background:${item.color}"></i><span>${escapeHtml(item.label)}</span></div>`).join('') || '<span class="muted">No hay clases calculables.</span>';
    $('legendTitle').textContent = state.field ? `Leyenda · ${state.field}` : 'Leyenda';
  }
  function renderTable(model) {
    const items = legendItems(model);
    $('classTable').innerHTML = items.map((item, index) => `<tr><td><span class="swatch" style="background:${item.color}"></span></td><td>${escapeHtml(item.label)}</td><td>${state.styled.filter((feature) => Number(feature.properties?._style_class) === index + 1).length}</td></tr>`).join('') || '<tr><td colspan="3">No hay clases para mostrar.</td></tr>';
  }
  function updateControls() {
    const available = fields();
    const selected = available.find((field) => field.name === state.field) || available[0];
    state.field = selected?.name || '';
    state.fieldType = selected?.type || 'category';
    $('field').innerHTML = available.map((item) => `<option value="${escapeHtml(item.name)}" ${item.name === state.field ? 'selected' : ''}>${escapeHtml(item.name)} · ${item.type === 'number' ? 'numérico' : 'categoría'}</option>`).join('') || '<option value="">Sin atributos</option>';
    $('mode').value = state.fieldType === 'number' ? state.mode : 'categorical';
    $('mode').disabled = state.fieldType !== 'number';
    $('classes').disabled = state.fieldType !== 'number' || state.mode === 'categorical';
    $('sourceName').textContent = `${state.features.length.toLocaleString('es-ES')} entidades · ${available.length} atributos`;
  }
  function applyStyle() {
    state.model = classification();
    state.styled = state.features.map((feature) => styledFeature(feature, state.model));
    renderMap(); renderLegend(state.model); renderTable(state.model);
    $('status').textContent = `Simbología aplicada a ${state.styled.length.toLocaleString('es-ES')} entidades.`;
    $('exportGeo').disabled = !state.styled.length; $('exportSpec').disabled = !state.styled.length;
  }
  function load(input, fileName = 'ejemplo.geojson') {
    const normal = normalise(input); state.source = normal; state.features = normal.features.filter(isFeature); state.fileName = fileName; updateControls(); applyStyle();
  }
  function download(name, content) { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 900); }
  function slug() { return (state.fileName.replace(/\.[^.]+$/, '').replace(/[^\wáéíóúüñ-]+/gi, '-') || 'capa').slice(0, 55); }
  function exportGeoJSON() { download(`${slug()}-simbologia.geojson`, JSON.stringify({ type: 'FeatureCollection', features: state.styled }, null, 2)); }
  function exportSpec() {
    const model = state.model || classification();
    const spec = { format: 'cartografia-web-tools-style', generatedAt: new Date().toISOString(), source: state.fileName, field: state.field, classification: state.mode, classes: state.classes, palette: state.palette, colors: model.colors, opacity: state.opacity, pointRadius: state.radius, legend: legendItems(model), mapLibrePaint: { 'fill-color': ['coalesce', ['get', '_style_color'], '#94a3b8'], 'fill-opacity': state.opacity, 'circle-color': ['coalesce', ['get', '_style_color'], '#94a3b8'], 'circle-radius': state.radius } };
    download(`${slug()}-style-spec.json`, JSON.stringify(spec, null, 2));
  }
  function initMap() { if (!window.L) { $('map').innerHTML = '<div class="map-fallback">Leaflet no está disponible. La clasificación y las exportaciones siguen funcionando localmente.</div>'; return; } state.map = L.map('map', { zoomControl: true }).setView([40.25, -3.7], 5); state.base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map); }

  initMap(); load(demo); $('file').addEventListener('change', async () => { const file = $('file').files[0]; if (!file) return; try { load(JSON.parse(await file.text()), file.name); } catch (error) { $('status').textContent = `No se pudo leer la capa: ${error.message}`; } });
  $('demo').addEventListener('click', () => load(demo)); $('field').addEventListener('change', (event) => { state.field = event.target.value; updateControls(); applyStyle(); }); $('mode').addEventListener('change', (event) => { state.mode = event.target.value; applyStyle(); }); $('classes').addEventListener('input', (event) => { state.classes = Number(event.target.value); $('classesValue').textContent = state.classes; applyStyle(); }); $('palette').addEventListener('change', (event) => { state.palette = event.target.value; applyStyle(); }); $('opacity').addEventListener('input', (event) => { state.opacity = Number(event.target.value) / 100; $('opacityValue').textContent = `${event.target.value}%`; renderMap(); }); $('radius').addEventListener('input', (event) => { state.radius = Number(event.target.value); $('radiusValue').textContent = state.radius; renderMap(); }); $('apply').addEventListener('click', applyStyle); $('exportGeo').addEventListener('click', exportGeoJSON); $('exportSpec').addEventListener('click', exportSpec);
})();
