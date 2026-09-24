(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = { source: null, document: null, features: [], issues: [], map: null, layer: null, fileName: 'capa.geojson', vertexCount: 0, geometryCount: 0, typeCounts: {}, bbox: null, duplicateCount: 0, coordinateDimensions: new Map(), swapSuspectCount: 0, projectedLikeCount: 0, diagnosticKeys: new Set() };
  const geometryDepth = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 };

  function isObject(value) { return value !== null && typeof value === 'object'; }
  function isPosition(value) { return Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])); }
  function samePosition(a, b) { return isPosition(a) && isPosition(b) && Number(a[0]) === Number(b[0]) && Number(a[1]) === Number(b[1]); }
  function safeText(value) { return value === null || value === undefined ? '' : String(value); }
  function escapeCsv(value) { const text = safeText(value).replace(/"/g, '""'); return /[",\n]/.test(text) ? `"${text}"` : text; }
  function download(text, name, mime) { const url = URL.createObjectURL(new Blob([text], { type: mime })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

  function addIssue(severity, code, feature, path, message) {
    state.issues.push({ severity, code, feature: feature || '—', path: path || '—', message });
  }

  function addCoordinateDiagnostic(severity, code, feature, path, message, counter) {
    const key = `${code}:${feature || '—'}`;
    if (state.diagnosticKeys.has(key)) return;
    state.diagnosticKeys.add(key);
    state[counter] += 1;
    addIssue(severity, code, feature, path, message);
  }

  function updateBbox(position) {
    const lon = Number(position[0]), lat = Number(position[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    if (!state.bbox) state.bbox = [lon, lat, lon, lat];
    else state.bbox = [Math.min(state.bbox[0], lon), Math.min(state.bbox[1], lat), Math.max(state.bbox[2], lon), Math.max(state.bbox[3], lat)];
  }

  function validatePosition(position, feature, path, collect) {
    if (!isPosition(position)) { addIssue('error', 'invalid-coordinate', feature, path, 'La posición no contiene al menos longitud y latitud numéricas.'); return false; }
    const lon = Number(position[0]), lat = Number(position[1]);
    state.coordinateDimensions.set(position.length, (state.coordinateDimensions.get(position.length) || 0) + 1);
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) addIssue('error', 'out-of-range', feature, path, `Coordenada fuera de WGS84: ${lon}, ${lat}.`);
    if (Math.abs(lon) <= 90 && Math.abs(lat) > 90 && Math.abs(lat) <= 180) addCoordinateDiagnostic('warning', 'possible-lat-lon-swap', feature, path, 'El patrón parece latitud, longitud; GeoJSON espera longitud, latitud. No se corrige automáticamente.', 'swapSuspectCount');
    const maximum = Math.max(Math.abs(lon), Math.abs(lat));
    if ((Math.abs(lon) > 180 || Math.abs(lat) > 90) && maximum >= 1000 && maximum <= 100000000) addCoordinateDiagnostic('warning', 'possible-projected-crs', feature, path, 'Los valores parecen coordenadas proyectadas (por ejemplo UTM/Web Mercator), no WGS84 lon/lat. Reproyecta antes de usar esta capa.', 'projectedLikeCount');
    if (position.length > 2 && !position.slice(2).every((value) => Number.isFinite(Number(value)))) addIssue('warning', 'invalid-extra-coordinate', feature, path, 'La coordenada adicional no es numérica; revisa la altitud o medidas.');
    state.vertexCount += 1; updateBbox(position); collect?.push(position); return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  }

  function inspectCoordinates(node, depth, feature, path, collect) {
    if (depth === 0) { validatePosition(node, feature, path, collect); return; }
    if (!Array.isArray(node)) { addIssue('error', 'invalid-structure', feature, path, 'La estructura de coordenadas no coincide con el tipo de geometría.'); return; }
    if (!node.length) addIssue('warning', 'empty-coordinates', feature, path, 'El nivel de coordenadas está vacío.');
    node.forEach((child, index) => inspectCoordinates(child, depth - 1, feature, `${path}[${index}]`, collect));
  }

  function lineArrays(geometry) {
    if (geometry.type === 'LineString' || geometry.type === 'Polygon') return Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
    if (geometry.type === 'MultiLineString') return Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
    if (geometry.type === 'MultiPolygon') return Array.isArray(geometry.coordinates) ? geometry.coordinates.flatMap((polygon) => Array.isArray(polygon) ? polygon : []) : [];
    return [];
  }

  function inspectGeometry(geometry, feature, path = 'geometry') {
    if (geometry === null) { addIssue('warning', 'empty-geometry', feature, path, 'La entidad no tiene geometría.'); return; }
    if (!isObject(geometry) || typeof geometry.type !== 'string') { addIssue('error', 'invalid-geometry', feature, path, 'La geometría no es un objeto GeoJSON válido.'); return; }
    state.geometryCount += 1; state.typeCounts[geometry.type] = (state.typeCounts[geometry.type] || 0) + 1;
    if (geometry.type === 'GeometryCollection') {
      if (!Array.isArray(geometry.geometries) || !geometry.geometries.length) addIssue('warning', 'empty-collection', feature, `${path}.geometries`, 'La colección de geometrías está vacía.');
      (geometry.geometries || []).forEach((child, index) => inspectGeometry(child, feature, `${path}.geometries[${index}]`)); return;
    }
    const depth = geometryDepth[geometry.type];
    if (depth === undefined) { addIssue('error', 'unsupported-type', feature, `${path}.type`, `Tipo de geometría no soportado: ${geometry.type}.`); return; }
    const positions = [];
    inspectCoordinates(geometry.coordinates, depth, feature, `${path}.coordinates`, positions);
    const arrays = lineArrays(geometry);
    arrays.forEach((line, index) => {
      const valid = Array.isArray(line) ? line.filter(isPosition) : [];
      if (geometry.type.includes('Line') && valid.length < 2) addIssue('error', 'short-line', feature, `${path}.coordinates[${index}]`, 'Una línea necesita al menos dos posiciones.');
      if (geometry.type.includes('Polygon') && valid.length < 4) addIssue('error', 'short-ring', feature, `${path}.coordinates[${index}]`, 'Un anillo necesita al menos cuatro posiciones.');
      for (let i = 1; i < valid.length; i += 1) if (samePosition(valid[i - 1], valid[i])) addIssue('warning', 'duplicate-vertex', feature, `${path}.coordinates[${index}][${i}]`, 'Hay dos vértices consecutivos idénticos.');
      if (geometry.type.includes('Polygon') && valid.length >= 3 && !samePosition(valid[0], valid[valid.length - 1])) addIssue('warning', 'open-ring', feature, `${path}.coordinates[${index}]`, 'El primer y último vértice del anillo no coinciden.');
    });
  }

  function normalise(input) {
    if (!isObject(input)) throw new Error('El documento no es un objeto JSON.');
    if (input.type === 'FeatureCollection') {
      if (!Array.isArray(input.features)) throw new Error('FeatureCollection sin un array de features.');
      return { source: input, features: input.features };
    }
    if (input.type === 'Feature') return { source: input, features: [input] };
    if (typeof input.type === 'string' && (geometryDepth[input.type] !== undefined || input.type === 'GeometryCollection')) {
      return { source: input, features: [{ type: 'Feature', properties: {}, geometry: input }] };
    }
    throw new Error('El documento no es FeatureCollection, Feature ni una geometría GeoJSON reconocible.');
  }

  function canonicalGeometry(feature) { try { return JSON.stringify(feature?.geometry ?? null); } catch { return ''; } }

  function analyse(input, fileName) {
    const normal = normalise(input); state.source = input; state.document = normal.source; state.features = normal.features; state.issues = []; state.vertexCount = 0; state.geometryCount = 0; state.typeCounts = {}; state.bbox = null; state.duplicateCount = 0; state.coordinateDimensions = new Map(); state.swapSuspectCount = 0; state.projectedLikeCount = 0; state.diagnosticKeys = new Set(); state.fileName = fileName || 'capa.geojson';
    if (!state.features.length) addIssue('warning', 'empty-collection', '—', 'features', 'La capa no contiene entidades.');
    const seen = new Map();
    state.features.forEach((feature, index) => {
      const number = index + 1;
      if (!isObject(feature) || feature.type !== 'Feature') { addIssue('error', 'invalid-feature', number, `features[${index}]`, 'La entidad no tiene type: Feature.'); return; }
      if (feature.properties !== undefined && !isObject(feature.properties)) addIssue('warning', 'invalid-properties', number, `features[${index}].properties`, 'Las propiedades deberían ser un objeto.');
      inspectGeometry(feature.geometry, number);
      const key = canonicalGeometry(feature);
      if (key && key !== 'null') { if (seen.has(key)) { state.duplicateCount += 1; addIssue('warning', 'duplicate-feature', number, `features[${index}].geometry`, `Geometría repetida; también aparece en la feature ${seen.get(key)}.`); } else seen.set(key, number); }
    });
    if (state.coordinateDimensions.size > 1) addIssue('warning', 'mixed-coordinate-dimensions', '—', 'coordinates', `La capa mezcla dimensiones de coordenada: ${[...state.coordinateDimensions.keys()].sort((a, b) => a - b).join(', ')} valores.`);
    render(); drawMap();
  }

  function formatBbox() { return state.bbox ? `${state.bbox[0].toFixed(4)}, ${state.bbox[1].toFixed(4)} → ${state.bbox[2].toFixed(4)}, ${state.bbox[3].toFixed(4)}` : '—'; }
  function render() {
    $('summary').hidden = false; $('featureCount').textContent = state.features.length.toLocaleString('es-ES'); $('vertexCount').textContent = state.vertexCount.toLocaleString('es-ES'); $('errorCount').textContent = state.issues.filter((item) => item.severity === 'error').length; $('warningCount').textContent = state.issues.filter((item) => item.severity === 'warning').length; $('duplicateCount').textContent = state.duplicateCount; $('bbox').textContent = formatBbox(); $('issueCount').textContent = `${state.issues.length} hallazgo${state.issues.length === 1 ? '' : 's'}`;
    const types = $('types'); types.replaceChildren(); Object.entries(state.typeCounts).forEach(([type, count]) => { const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = `${type} · ${count}`; types.appendChild(chip); });
    const dimensions = [...state.coordinateDimensions.entries()].sort((a, b) => a[0] - b[0]).map(([size, count]) => `${size}D (${count.toLocaleString('es-ES')})`).join(', ') || '—';
    const diagnosticParts = [`Dimensiones: ${dimensions}`];
    if (state.swapSuspectCount) diagnosticParts.push(`posible orden lat/lon en ${state.swapSuspectCount} feature${state.swapSuspectCount === 1 ? '' : 's'}`);
    if (state.projectedLikeCount) diagnosticParts.push(`posible CRS proyectado en ${state.projectedLikeCount} feature${state.projectedLikeCount === 1 ? '' : 's'}`);
    if (state.coordinateDimensions.size > 1) diagnosticParts.push('dimensiones mixtas');
    $('coordinateDiagnostics').hidden = false; $('coordinateDiagnostics').textContent = diagnosticParts.join(' · ');
    const tbody = $('issueTable'); tbody.replaceChildren(); if (!state.issues.length) { const row = tbody.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = 'No se han encontrado problemas con estas reglas.'; } else state.issues.slice(0, 300).forEach((item) => { const row = tbody.insertRow(); const level = row.insertCell(); level.className = `severity ${item.severity}`; level.textContent = item.severity === 'error' ? 'Error' : item.severity === 'warning' ? 'Aviso' : 'Info'; row.insertCell().textContent = item.feature; row.insertCell().textContent = item.code; const detail = row.insertCell(); detail.className = 'detail'; detail.textContent = `${item.message} · ${item.path}`; });
    $('status').textContent = `${state.fileName}: ${state.features.length} features revisadas, ${state.issues.length} hallazgos.`;
    ['reportBtn', 'csvBtn', 'cleanBtn'].forEach((id) => { $(id).disabled = false; });
  }

  function geometryCanMap(geometry) {
    if (!geometry) return false; if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).some(geometryCanMap);
    let valid = true; const depth = geometryDepth[geometry.type]; if (depth === undefined) return false;
    const check = (node, level) => { if (level === 0) { valid = valid && isPosition(node) && Number(node[0]) >= -180 && Number(node[0]) <= 180 && Number(node[1]) >= -90 && Number(node[1]) <= 90; return; } if (!Array.isArray(node)) { valid = false; return; } node.forEach((child) => check(child, level - 1)); };
    check(geometry.coordinates, depth); return valid;
  }

  function initMap() {
    if (!window.L) { $('mapFallback').hidden = false; return; }
    state.map = L.map('map', { preferCanvas: true }).setView([40.4, -3.7], 6); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(state.map);
    CartografiaPlaceSearch(state.map, { input: $('placeQuery'), button: $('placeSearchButton'), results: $('placeResults'), status: $('placeStatus') });
  }

  function drawMap() {
    if (!state.map) return; state.layer?.remove(); const features = state.features.filter((feature) => feature?.type === 'Feature' && geometryCanMap(feature.geometry)); if (!features.length) return;
    try { state.layer = L.geoJSON({ type: 'FeatureCollection', features }, { style: { color: '#5bd6a5', weight: 2, fillColor: '#5bd6a5', fillOpacity: .22 }, pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { radius: 6, color: '#ffbf69', fillColor: '#ffbf69', fillOpacity: .9, weight: 2 }) }).addTo(state.map); const bounds = state.layer.getBounds(); if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 }); } catch { $('status').textContent += ' El mapa no pudo dibujar alguna geometría; el informe sigue disponible.'; }
  }

  function closeRings(geometry) {
    if (!geometry || typeof geometry !== 'object') return;
    if (geometry.type === 'GeometryCollection') { (geometry.geometries || []).forEach(closeRings); return; }
    if (!geometry.type?.includes('Polygon')) return;
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : (geometry.coordinates || []).flatMap((polygon) => polygon || []);
    rings.forEach((ring) => { if (Array.isArray(ring) && ring.length >= 3 && isPosition(ring[0]) && isPosition(ring[ring.length - 1]) && !samePosition(ring[0], ring[ring.length - 1])) ring.push([...ring[0]]); });
  }

  function revisedDocument() {
    const copy = JSON.parse(JSON.stringify(state.source)); const normal = normalise(copy); let features = normal.features;
    if ($('removeEmpty').checked) features = features.filter((feature) => feature?.geometry);
    if ($('removeDuplicates').checked) { const seen = new Set(); features = features.filter((feature) => { const key = canonicalGeometry(feature); if (!key || key === 'null' || seen.has(key)) return false; seen.add(key); return true; }); }
    if ($('closeRings').checked) features.forEach((feature) => closeRings(feature.geometry));
    return { type: 'FeatureCollection', features };
  }

  async function readFile(file) { if (!file) return; if (file.size > 120 * 1024 * 1024) { $('status').textContent = 'El archivo supera 120 MB; no se abre en esta herramienta local.'; return; } try { analyse(JSON.parse(await file.text()), file.name); } catch (error) { $('summary').hidden = true; $('status').textContent = error.message || 'No se pudo leer el GeoJSON.'; } }

  const example = { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { name: 'Anillo abierto' }, geometry: { type: 'Polygon', coordinates: [[[-3.72, 40.40], [-3.68, 40.40], [-3.68, 40.43], [-3.72, 40.43]]] } },
    { type: 'Feature', properties: { name: 'Geometría repetida' }, geometry: { type: 'Polygon', coordinates: [[[-3.72, 40.40], [-3.68, 40.40], [-3.68, 40.43], [-3.72, 40.43]]] } },
    { type: 'Feature', properties: { name: 'Coordenada fuera de rango' }, geometry: { type: 'Point', coordinates: [-181, 40.42] } },
    { type: 'Feature', properties: { name: 'Sin geometría' }, geometry: null }
  ] };

  $('fileInput').addEventListener('change', () => readFile($('fileInput').files?.[0])); $('exampleBtn').addEventListener('click', () => analyse(example, 'ejemplo-geojson-qa.geojson')); $('clearBtn').addEventListener('click', () => { state.source = null; state.features = []; state.issues = []; state.coordinateDimensions = new Map(); state.swapSuspectCount = 0; state.projectedLikeCount = 0; state.diagnosticKeys = new Set(); state.layer?.remove(); $('summary').hidden = true; $('coordinateDiagnostics').hidden = true; $('issueTable').replaceChildren(); $('status').textContent = 'Sin capa cargada'; ['reportBtn', 'csvBtn', 'cleanBtn'].forEach((id) => { $(id).disabled = true; }); });
  $('reportBtn').addEventListener('click', () => download(JSON.stringify({ tool: 'GeoJSON QA', file: state.fileName, checkedAt: new Date().toISOString(), summary: { features: state.features.length, vertices: state.vertexCount, errors: state.issues.filter((item) => item.severity === 'error').length, warnings: state.issues.filter((item) => item.severity === 'warning').length, bbox: state.bbox }, coordinateDiagnostics: { dimensions: Object.fromEntries([...state.coordinateDimensions.entries()].map(([size, count]) => [String(size), count])), possibleLatLonSwapFeatures: state.swapSuspectCount, possibleProjectedCrsFeatures: state.projectedLikeCount, mixedDimensions: state.coordinateDimensions.size > 1 }, geometryTypes: state.typeCounts, issues: state.issues }, null, 2), `${state.fileName.replace(/\.[^.]+$/, '')}-qa.json`, 'application/json'));
  $('csvBtn').addEventListener('click', () => { const rows = [['nivel', 'regla', 'feature', 'ruta', 'detalle'], ...state.issues.map((item) => [item.severity, item.code, item.feature, item.path, item.message])]; download(rows.map((row) => row.map(escapeCsv).join(',')).join('\n'), `${state.fileName.replace(/\.[^.]+$/, '')}-hallazgos.csv`, 'text/csv;charset=utf-8'); });
  $('cleanBtn').addEventListener('click', () => download(JSON.stringify(revisedDocument(), null, 2), `${state.fileName.replace(/\.[^.]+$/, '')}-revisado.geojson`, 'application/geo+json'));
  initMap();
})();
