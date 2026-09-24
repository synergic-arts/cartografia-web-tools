const $ = id => document.getElementById(id);
const state = { features: [], filtered: [], selected: null, hitAreas: [], source: 'ejemplo' };
const demo = { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { nombre: 'Villa del Arroyo', periodo: 'Medieval', uso: 'Asentamiento', estado: 'Consolidado' }, geometry: { type: 'Polygon', coordinates: [[[-4.74, 40.42], [-4.70, 40.44], [-4.67, 40.41], [-4.70, 40.38], [-4.74, 40.42]]] } },
  { type: 'Feature', properties: { nombre: 'Camino de la Sierra', periodo: 'Moderno', uso: 'Ruta histórica', estado: 'Parcial' }, geometry: { type: 'LineString', coordinates: [[-4.83, 40.34], [-4.78, 40.37], [-4.73, 40.4], [-4.67, 40.41], [-4.62, 40.46]] } },
  { type: 'Feature', properties: { nombre: 'Atalaya norte', periodo: 'Antigüedad', uso: 'Defensa', estado: 'Documentado' }, geometry: { type: 'Point', coordinates: [-4.79, 40.48] } },
  { type: 'Feature', properties: { nombre: 'Cantera de granito', periodo: 'Contemporáneo', uso: 'Patrimonio industrial', estado: 'En estudio' }, geometry: { type: 'Point', coordinates: [-4.61, 40.36] } },
  { type: 'Feature', properties: { nombre: 'Humedal protegido', periodo: 'Actual', uso: 'Medio natural', estado: 'Protegido' }, geometry: { type: 'MultiPolygon', coordinates: [[[[-4.64, 40.43], [-4.59, 40.45], [-4.56, 40.41], [-4.61, 40.4], [-4.64, 40.43]]]] } }
] };

function escapeHtml(value) {
  return String(value == null ? '—' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}
function normalize(input) {
  if (input && input.type === 'FeatureCollection') return input.features.filter(feature => feature && feature.geometry);
  if (input && input.type === 'Feature' && input.geometry) return [input];
  if (input && input.type && input.coordinates) return [{ type: 'Feature', properties: {}, geometry: input }];
  if (Array.isArray(input)) return input.map(item => item.type === 'Feature' ? item : ({ type: 'Feature', properties: {}, geometry: item })).filter(feature => feature.geometry);
  throw new Error('El archivo no contiene una FeatureCollection, una Feature o una geometría válida.');
}
function coordinatesOf(geometry) {
  const output = [];
  const walk = value => {
    if (Array.isArray(value) && typeof value[0] === 'number') output.push([value[0], value[1]]);
    else if (Array.isArray(value)) value.forEach(walk);
  };
  walk(geometry && geometry.coordinates);
  return output.filter(point => Number.isFinite(point[0]) && Number.isFinite(point[1]));
}
function geometryType(feature) { return feature.geometry && feature.geometry.type || 'Sin geometría'; }
function labelOf(feature, index) {
  const props = feature.properties || {};
  const key = Object.keys(props).find(name => /^(name|nombre|title|label|id|codigo|code)$/i.test(name));
  return key ? String(props[key]) : 'Entidad ' + (index + 1);
}
function summary() {
  const types = state.filtered.reduce((counts, feature) => { const type = geometryType(feature); counts[type] = (counts[type] || 0) + 1; return counts; }, {});
  const vertices = state.filtered.reduce((total, feature) => total + coordinatesOf(feature.geometry).length, 0);
  const values = [['Visibles', state.filtered.length], ['Vértices', vertices], ['Puntos', (types.Point || 0) + (types.MultiPoint || 0)], ['Líneas', (types.LineString || 0) + (types.MultiLineString || 0)], ['Áreas', (types.Polygon || 0) + (types.MultiPolygon || 0)]];
  $('metrics').innerHTML = values.map(item => '<div class="metric"><b>' + item[1].toLocaleString('es-ES') + '</b><span>' + item[0] + '</span></div>').join('');
}
function bounds() {
  const points = state.filtered.flatMap(feature => coordinatesOf(feature.geometry));
  if (!points.length) return [-1, -1, 1, 1];
  const xs = points.map(point => point[0]); const ys = points.map(point => point[1]);
  const dx = Math.max((Math.max(...xs) - Math.min(...xs)) * .08, .001); const dy = Math.max((Math.max(...ys) - Math.min(...ys)) * .08, .001);
  return [Math.min(...xs) - dx, Math.min(...ys) - dy, Math.max(...xs) + dx, Math.max(...ys) + dy];
}
function drawPath(context, geometry, project) {
  const drawLine = coordinates => { coordinates.forEach((coordinate, index) => { const pair = project(coordinate); index ? context.lineTo(pair[0], pair[1]) : context.moveTo(pair[0], pair[1]); }); };
  const drawPolygon = coordinates => { coordinates.forEach((ring, index) => { context.beginPath(); drawLine(ring); context.closePath(); index ? context.stroke() : context.fill(); }); };
  if (geometry.type === 'Point') { const pair = project(geometry.coordinates); context.beginPath(); context.arc(pair[0], pair[1], 6, 0, Math.PI * 2); context.fill(); context.stroke(); return; }
  if (geometry.type === 'MultiPoint') { geometry.coordinates.forEach(coordinate => drawPath(context, { type: 'Point', coordinates: coordinate }, project)); return; }
  context.beginPath();
  if (geometry.type === 'LineString') drawLine(geometry.coordinates);
  if (geometry.type === 'MultiLineString') geometry.coordinates.forEach(drawLine);
  if (geometry.type === 'Polygon') drawPolygon(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(drawPolygon);
  if (geometry.type.indexOf('Polygon') !== -1) { context.fill(); context.stroke(); } else context.stroke();
}
function draw() {
  const canvas = $('map'); const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, rect.width); const height = Math.max(240, width * .62);
  canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.height = String(height) + 'px';
  const context = canvas.getContext('2d'); context.setTransform(dpr, 0, 0, dpr, 0, 0); context.clearRect(0, 0, width, height);
  context.fillStyle = '#0a202b'; context.fillRect(0, 0, width, height);
  const extent = bounds(); const minX = extent[0]; const minY = extent[1]; const maxX = extent[2]; const maxY = extent[3]; const pad = 30;
  const project = coordinate => [pad + ((coordinate[0] - minX) / (maxX - minX)) * (width - pad * 2), height - pad - ((coordinate[1] - minY) / (maxY - minY)) * (height - pad * 2)];
  context.strokeStyle = '#1e4553'; context.lineWidth = 1; context.font = '11px system-ui'; context.fillStyle = '#78a6b5';
  for (let i = 0; i < 5; i += 1) { const x = pad + i * (width - pad * 2) / 4; const y = pad + i * (height - pad * 2) / 4; context.beginPath(); context.moveTo(x, pad); context.lineTo(x, height - pad); context.moveTo(pad, y); context.lineTo(width - pad, y); context.stroke(); context.fillText((minX + i * (maxX - minX) / 4).toFixed(3) + '°', x - 19, height - 10); context.fillText((maxY - i * (maxY - minY) / 4).toFixed(3) + '°', 3, y + 4); }
  state.hitAreas = [];
  state.filtered.forEach((feature, index) => {
    const coords = coordinatesOf(feature.geometry); if (!coords.length) return;
    const screen = coords.map(project); const xs = screen.map(point => point[0]); const ys = screen.map(point => point[1]); const type = geometryType(feature); const selected = state.selected === feature;
    context.save(); context.lineWidth = selected ? 4 : type.indexOf('Polygon') !== -1 ? 1.5 : 2.5; context.strokeStyle = selected ? '#ffc978' : type.indexOf('Polygon') !== -1 ? '#8dccff' : type.indexOf('Line') !== -1 ? '#62e5c1' : '#ffc978'; context.fillStyle = selected ? '#ffc97840' : type.indexOf('Polygon') !== -1 ? '#8dccff20' : '#62e5c118'; drawPath(context, feature.geometry, project); context.restore();
    state.hitAreas.push({ feature, index, minX: Math.min(...xs) - 12, maxX: Math.max(...xs) + 12, minY: Math.min(...ys) - 12, maxY: Math.max(...ys) + 12 });
  });
}
function renderDetails() {
  const feature = state.selected; $('selection').textContent = feature ? labelOf(feature, state.filtered.indexOf(feature)) : 'Sin selección';
  if (!feature) { $('details').innerHTML = '<p class="empty">Selecciona una entidad en el mapa o en la tabla.</p>'; return; }
  const props = Object.entries(feature.properties || {});
  $('details').innerHTML = '<dl>' + (props.length ? props.map(item => '<div class="property"><dt>' + escapeHtml(item[0]) + '</dt><dd>' + escapeHtml(typeof item[1] === 'object' ? JSON.stringify(item[1]) : item[1]) + '</dd></div>').join('') : '<p class="empty">Esta entidad no tiene propiedades.</p>') + '</dl><p class="hint">Geometría: ' + escapeHtml(geometryType(feature)) + ' · ' + coordinatesOf(feature.geometry).length + ' vértices</p>';
}
function renderTable() {
  $('table').innerHTML = state.filtered.length ? state.filtered.map((feature, index) => '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(geometryType(feature)) + '</td><td>' + escapeHtml(labelOf(feature, index)) + '</td><td>' + Object.keys(feature.properties || {}).length + '</td><td><button type="button" class="table-select" data-index="' + index + '">' + (state.selected === feature ? 'Seleccionada' : 'Inspeccionar') + '</button></td></tr>').join('') : '<tr><td colspan="5">No hay entidades que coincidan con el filtro.</td></tr>';
  document.querySelectorAll('.table-select').forEach(button => button.addEventListener('click', () => { state.selected = state.filtered[Number(button.dataset.index)]; renderDetails(); draw(); renderTable(); }));
  $('tableHint').textContent = state.filtered.length + ' de ' + state.features.length + ' entidades visibles.';
}
function applyFilter() {
  const query = $('search').value.trim().toLocaleLowerCase();
  state.filtered = state.features.filter(feature => !query || JSON.stringify(feature.properties || {}).toLocaleLowerCase().includes(query));
  if (state.selected && !state.filtered.includes(state.selected)) state.selected = null;
  summary(); draw(); renderDetails(); renderTable(); $('exportGeo').disabled = !state.filtered.length; $('exportCsv').disabled = !state.filtered.length;
}
function load(input, source) { state.features = normalize(input); state.source = source || 'capa local'; $('status').textContent = state.features.length + ' entidades cargadas desde ' + state.source + '.'; $('search').value = ''; state.selected = null; applyFilter(); }
function download(name, type, content) { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500); }
function csv() { const keys = [...new Set(state.filtered.flatMap(feature => Object.keys(feature.properties || {})))]; return [keys.join(','), ...state.filtered.map(feature => keys.map(key => JSON.stringify(feature.properties && feature.properties[key] != null ? feature.properties[key] : '')).join(','))].join('\n'); }
$('demo').addEventListener('click', () => load(demo, 'ejemplo incorporado'));
$('clear').addEventListener('click', () => { state.features = []; state.filtered = []; state.selected = null; $('file').value = ''; $('status').textContent = 'Capa vacía. Carga un archivo o usa el ejemplo.'; applyFilter(); });
$('clearSelection').addEventListener('click', () => { state.selected = null; renderDetails(); draw(); renderTable(); });
$('search').addEventListener('input', applyFilter);
$('file').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { load(JSON.parse(reader.result), file.name); } catch (error) { $('status').textContent = 'No se pudo leer la capa: ' + error.message; } }; reader.readAsText(file); });
$('exportGeo').addEventListener('click', () => download('geojson-workbench-filtrado.geojson', 'application/geo+json', JSON.stringify({ type: 'FeatureCollection', features: state.filtered }, null, 2)));
$('exportCsv').addEventListener('click', () => download('geojson-workbench-propiedades.csv', 'text/csv', csv()));
$('map').addEventListener('pointerdown', event => { if (!state.hitAreas.length) return; const rect = $('map').getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; const hit = [...state.hitAreas].reverse().find(area => x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY); if (hit) { state.selected = hit.feature; renderDetails(); draw(); renderTable(); } });
window.addEventListener('resize', draw);
load(demo);
