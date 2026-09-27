(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { source: null, output: null, map: null, layer: null };
  const R = 6378137;

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function cleanGeometry(value) { return value && value.type && value.coordinates ? value : null; }
  function parseGeoJSON(value) {
    const parsed = JSON.parse(value.trim());
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [{ type: 'Feature', properties: {}, geometry: parsed }];
    const clean = features.map((feature, index) => ({ type: 'Feature', properties: feature.properties || {}, geometry: cleanGeometry(feature.geometry || feature), sourceIndex: index })).filter(feature => feature.geometry);
    if (!clean.length) throw new Error('No se encontraron geometrías GeoJSON válidas.');
    return { type: 'FeatureCollection', features: clean };
  }

  function forEachCoordinate(node, callback) {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') callback(node);
    else node.forEach(child => forEachCoordinate(child, callback));
  }

  function mapCoordinates(node, mapper) {
    if (typeof node[0] === 'number' && typeof node[1] === 'number') return mapper(node);
    return node.map(child => mapCoordinates(child, mapper));
  }

  function bbox(collection, projected = false) {
    const values = [];
    collection.features.forEach(feature => forEachCoordinate(feature.geometry.coordinates, coordinate => values.push(projected ? coordinate : [coordinate[0], coordinate[1]])));
    if (!values.length) throw new Error('La capa no contiene coordenadas.');
    return { minX: Math.min(...values.map(point => point[0])), minY: Math.min(...values.map(point => point[1])), maxX: Math.max(...values.map(point => point[0])), maxY: Math.max(...values.map(point => point[1])), count: values.length };
  }

  function projectionInfo(source) {
    const kind = $('projection').value;
    if (kind === 'mercator') return { kind, name: 'Web Mercator', crs: 'EPSG:3857', units: 'metros', zone: null, map: point => mercator(point) };
    if (kind === 'equirectangular') return { kind, name: 'Equirectangular', crs: 'EPSG:4087 (aprox.)', units: 'metros', zone: null, map: point => equirectangular(point) };
    const sourceBox = bbox(source);
    const centerLon = (sourceBox.minX + sourceBox.maxX) / 2;
    const zone = $('zoneMode').value === 'auto' ? Math.max(1, Math.min(60, Math.floor((centerLon + 180) / 6) + 1)) : Number($('zone').value);
    if (!Number.isInteger(zone) || zone < 1 || zone > 60) throw new Error('La zona UTM debe estar entre 1 y 60.');
    const south = (sourceBox.minY + sourceBox.maxY) / 2 < 0;
    return { kind, name: 'UTM WGS84', crs: 'EPSG:' + ((south ? 32700 : 32600) + zone), units: 'metros', zone, south, map: point => utm(point, zone, south) };
  }

  function mercator(point) { const lon = point[0] * Math.PI / 180; const lat = Math.max(-85.05112878, Math.min(85.05112878, point[1])) * Math.PI / 180; return [R * lon, R * Math.log(Math.tan(Math.PI / 4 + lat / 2))]; }
  function equirectangular(point) { return [R * point[0] * Math.PI / 180, R * point[1] * Math.PI / 180]; }
  function utm(point, zone, south) {
    const a = 6378137, eccSquared = 0.00669438, k0 = 0.9996, lat = point[1] * Math.PI / 180, lon = point[0] * Math.PI / 180;
    const lonOrigin = (zone - 1) * 6 - 180 + 3, origin = lonOrigin * Math.PI / 180, eccPrimeSquared = eccSquared / (1 - eccSquared);
    const N = a / Math.sqrt(1 - eccSquared * Math.sin(lat) ** 2), T = Math.tan(lat) ** 2, C = eccPrimeSquared * Math.cos(lat) ** 2, A = Math.cos(lat) * (lon - origin);
    const M = a * ((1 - eccSquared / 4 - 3 * eccSquared ** 2 / 64 - 5 * eccSquared ** 3 / 256) * lat - (3 * eccSquared / 8 + 3 * eccSquared ** 2 / 32 + 45 * eccSquared ** 3 / 1024) * Math.sin(2 * lat) + (15 * eccSquared ** 2 / 256 + 45 * eccSquared ** 3 / 1024) * Math.sin(4 * lat) - (35 * eccSquared ** 3 / 3072) * Math.sin(6 * lat));
    const easting = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * eccPrimeSquared) * A ** 5 / 120) + 500000;
    const northing = k0 * (M + N * Math.tan(lat) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * eccPrimeSquared) * A ** 6 / 720)) + (south ? 10000000 : 0);
    return [easting, northing];
  }

  function transform(source, info) {
    return { type: 'FeatureCollection', features: source.features.map(feature => ({ type: 'Feature', properties: { ...feature.properties, projection: info.name, source_crs: 'EPSG:4326', target_crs: info.crs }, geometry: { ...feature.geometry, coordinates: mapCoordinates(feature.geometry.coordinates, coordinate => info.map([Number(coordinate[0]), Number(coordinate[1])])) } })), crs: { type: 'name', properties: { name: info.crs } } };
  }

  function countFeatures(collection) { return collection.features.length; }
  function featureStats(feature) { const values = []; forEachCoordinate(feature.geometry.coordinates, coordinate => values.push(coordinate)); return { vertices: values.length, minX: Math.min(...values.map(point => point[0])), minY: Math.min(...values.map(point => point[1])), maxX: Math.max(...values.map(point => point[0])), maxY: Math.max(...values.map(point => point[1])) }; }

  function initMap() {
    if (!window.L) return;
    state.map = L.map('map').setView([40.416775, -3.70379], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }

  function renderMap(source) {
    if (!state.layer) return;
    state.layer.clearLayers();
    const layer = L.geoJSON(source, { style: { color: '#f7c86b', weight: 3, fillColor: '#f7c86b', fillOpacity: .12 }, pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 5, color: '#f7c86b', fillColor: '#f7c86b', fillOpacity: .9 }) }).bindPopup(layerFeature => '<strong>' + String(layerFeature.feature.properties?.nombre || layerFeature.feature.properties?.name || 'Entidad') + '</strong>');
    layer.addTo(state.layer);
    if (layer.getBounds().isValid()) state.map.fitBounds(layer.getBounds(), { padding: [22, 22], maxZoom: 15 });
  }

  function renderPreview(collection) {
    const canvas = $('preview'), context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#07131c'; context.fillRect(0, 0, canvas.width, canvas.height);
    const box = bbox(collection, true), pad = 32, width = Math.max(1, box.maxX - box.minX), height = Math.max(1, box.maxY - box.minY), scale = Math.min((canvas.width - pad * 2) / width, (canvas.height - pad * 2) / height);
    const project = point => [pad + (point[0] - box.minX) * scale, canvas.height - pad - (point[1] - box.minY) * scale];
    const drawNode = node => {
      if (typeof node[0] === 'number') return project(node);
      const paths = node.map(drawNode); return paths;
    };
    function drawGeometry(node) {
      if (typeof node[0] === 'number') return;
      if (Array.isArray(node[0]) && typeof node[0][0] === 'number') {
        context.beginPath(); node.map(drawNode).forEach((point, index) => index ? context.lineTo(point[0], point[1]) : context.moveTo(point[0], point[1]));
        context.stroke(); if (node.length > 2) { context.fillStyle = 'rgba(117,214,196,.12)'; context.fill(); }
      } else node.forEach(drawGeometry);
    }
    context.strokeStyle = '#75d6c4'; context.fillStyle = 'rgba(117,214,196,.12)'; context.lineWidth = 2;
    collection.features.forEach(feature => drawGeometry(feature.geometry.coordinates));
    context.fillStyle = '#8aa3af'; context.font = '12px system-ui'; context.fillText('x: ' + format(box.minX, 0) + ' → ' + format(box.maxX, 0), 12, 18); context.fillText('y: ' + format(box.minY, 0) + ' → ' + format(box.maxY, 0), 12, canvas.height - 9);
  }

  function renderTable(source, output, info) {
    $('tableWrap').innerHTML = `<table><thead><tr><th>ENTIDAD</th><th>TIPO</th><th>VÉRTICES</th><th>ANCHO SALIDA</th><th>ALTO SALIDA</th></tr></thead><tbody>${output.features.map((feature, index) => { const stats = featureStats(feature); return `<tr><td>${esc(source.features[index].properties?.nombre || source.features[index].properties?.name || 'Entidad ' + (index + 1))}</td><td>${feature.geometry.type}</td><td>${stats.vertices}</td><td>${format(stats.maxX - stats.minX, 1)}</td><td>${format(stats.maxY - stats.minY, 1)}</td></tr>`; }).join('')}</tbody></table><p class="table-foot">La tabla resume la geometría proyectada en ${info.units}.</p>`;
  }

  function calculate() {
    try {
      const source = parseGeoJSON($('source').value);
      const sourceBox = bbox(source);
      const info = projectionInfo(source);
      const output = transform(source, info);
      const targetBox = bbox(output, true);
      const center = [(sourceBox.minX + sourceBox.maxX) / 2, (sourceBox.minY + sourceBox.maxY) / 2];
      state.source = source; state.output = output;
      renderMap(source); renderPreview(output); renderTable(source, output, info);
      $('featureCount').textContent = countFeatures(source).toLocaleString('es-ES'); $('vertexCount').textContent = sourceBox.count.toLocaleString('es-ES'); $('sourceSize').textContent = format(sourceBox.maxX - sourceBox.minX, 4) + '°'; $('targetSize').textContent = format(targetBox.maxX - targetBox.minX, 0) + ' m'; $('centerPoint').textContent = format(center[1], 3) + ', ' + format(center[0], 3); $('units').textContent = info.units; $('epsgBadge').textContent = info.crs; $('quality').textContent = 'Listo'; $('quality').style.background = '#17334e'; $('quality').style.borderColor = '#36577d'; $('quality').style.color = 'var(--accent)'; $('geojsonBtn').disabled = false; $('csvBtn').disabled = false; $('previewLabel').textContent = info.name + ' · ' + info.crs;
      setStatus(`${sourceBox.count.toLocaleString('es-ES')} vértices transformados a ${info.crs} localmente.`);
    } catch (error) { setStatus(error.message || 'No se pudo transformar la capa.', true); }
  }

  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportCsv() { const info = projectionInfo(state.source); const lines = ['feature_index,geometry_type,x,y']; state.output.features.forEach((feature, index) => forEachCoordinate(feature.geometry.coordinates, point => lines.push([index + 1, feature.geometry.type, point[0], point[1]].join(',')))); download('vertices-proyectados.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }

  $('projection').addEventListener('change', () => { $('utmOptions').hidden = $('projection').value !== 'utm'; calculate(); });
  $('zoneMode').addEventListener('change', calculate); $('zone').addEventListener('change', calculate);
  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('projection').value = 'mercator'; $('utmOptions').hidden = true; calculate(); });
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('geojsonBtn').addEventListener('click', () => download('capa-proyectada.geojson', JSON.stringify(state.output, null, 2), 'application/geo+json;charset=utf-8'));
  $('csvBtn').addEventListener('click', exportCsv);
  $('utmOptions').hidden = true;
  initMap(); calculate();
})();
