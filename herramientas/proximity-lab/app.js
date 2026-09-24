(() => {
  'use strict';

  const state = { origins: [], destinations: [], matches: [], output: null, map: null, originLayer: null, destinationLayer: null, lineLayer: null, searchMarker: null };
  const $ = (id) => document.getElementById(id);
  const els = { originsFile: $('originsFile'), destinationsFile: $('destinationsFile'), originsName: $('originsName'), destinationsName: $('destinationsName'), destinationKey: $('destinationKey'), maxDistance: $('maxDistance'), exampleBtn: $('exampleBtn'), clearBtn: $('clearBtn'), runBtn: $('runBtn'), status: $('status'), originCount: $('originCount'), destinationCount: $('destinationCount'), matchedCount: $('matchedCount'), unmatchedCount: $('unmatchedCount'), averageDistance: $('averageDistance'), geojsonBtn: $('geojsonBtn'), csvBtn: $('csvBtn'), resultBody: $('resultBody'), tableHint: $('tableHint'), placeQuery: $('placeQuery'), placeBtn: $('placeBtn'), map: $('map'), mapFallback: $('mapFallback') };

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function round(value, digits = 2) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
  function setStatus(message, error = false) { els.status.textContent = message; els.status.classList.toggle('error', error); }
  function featureCollection(input) {
    if (!input || typeof input !== 'object') throw new Error('El contenido no es JSON válido.');
    if (input.type === 'FeatureCollection') return input.features.filter((feature) => feature && feature.type === 'Feature');
    if (input.type === 'Feature') return [input];
    if (input.type && input.coordinates) return [{ type: 'Feature', properties: {}, geometry: input }];
    throw new Error('Se esperaba un FeatureCollection, Feature o geometría GeoJSON.');
  }
  function positionsOf(value, output = []) {
    if (!Array.isArray(value)) return output;
    if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) { output.push([Number(value[0]), Number(value[1])]); return output; }
    value.forEach((child) => positionsOf(child, output));
    return output;
  }
  function representative(feature) {
    const geometry = feature && feature.geometry;
    if (!geometry) return null;
    const points = positionsOf(geometry.coordinates);
    const valid = points.filter(([lon, lat]) => lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90);
    if (!valid.length) return null;
    if (geometry.type === 'Point') return valid[0];
    return [valid.reduce((sum, point) => sum + point[0], 0) / valid.length, valid.reduce((sum, point) => sum + point[1], 0) / valid.length];
  }
  function haversine(a, b) {
    const rad = Math.PI / 180; const lat1 = a[1] * rad; const lat2 = b[1] * rad; const dLat = (b[1] - a[1]) * rad; const dLon = (b[0] - a[0]) * rad;
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371008.8 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }
  function destinationName(feature, index) {
    const properties = feature.properties || {}; const preferred = els.destinationKey.value.trim() || 'name';
    const value = properties[preferred] ?? properties.name ?? properties.label ?? properties.title ?? feature.id;
    return value === undefined || value === null || value === '' ? `Destino ${index + 1}` : String(value);
  }
  function readFile(file, role) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result); const features = featureCollection(parsed);
        state[role] = features; $(role === 'origins' ? 'originsName' : 'destinationsName').textContent = `${file.name} · ${features.length} entidades`;
        updateReady(); setStatus(`${role === 'origins' ? 'Orígenes' : 'Destinos'} cargados: ${features.length} entidades.`);
      } catch (error) { setStatus(error.message, true); }
    };
    reader.onerror = () => setStatus(`No se pudo leer ${file.name}.`, true); reader.readAsText(file);
  }
  function updateReady() { els.runBtn.disabled = !(state.origins.length && state.destinations.length); }
  function clearLayers() { [state.originLayer, state.destinationLayer, state.lineLayer].forEach((layer) => { if (layer && state.map) state.map.removeLayer(layer); }); state.originLayer = state.destinationLayer = state.lineLayer = null; }
  function initMap() {
    if (!window.L) { els.map.hidden = true; els.mapFallback.hidden = false; return; }
    try { state.map = L.map(els.map, { zoomControl: true }).setView([40.4168, -3.7038], 6); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(state.map); } catch (error) { els.map.hidden = true; els.mapFallback.hidden = false; setStatus('El análisis funciona, pero el mapa no pudo inicializarse.', true); }
  }
  function popup(title, properties) { return `<div class="popup-title">${escapeHtml(title)}</div><div class="popup-data">${escapeHtml(JSON.stringify(properties || {}, null, 2))}</div>`; }
  function renderMap() {
    if (!state.map) return; clearLayers();
    state.originLayer = L.layerGroup(); state.destinationLayer = L.layerGroup();
    const bounds = [];
    state.matches.forEach((match, index) => {
      if (!match.originPoint) return;
      const color = match.matched ? '#69e1b1' : '#ff8e8e'; const marker = L.circleMarker([match.originPoint[1], match.originPoint[0]], { radius: 7, color: '#fff', weight: 1, fillColor: color, fillOpacity: .92 });
      marker.bindPopup(popup(`Origen ${index + 1}${match.matched ? ` → ${match.destinationName}` : ''}`, match.origin.properties)); marker.addTo(state.originLayer); bounds.push([match.originPoint[1], match.originPoint[0]]);
      if (match.matched) { const line = L.polyline([[match.originPoint[1], match.originPoint[0]], [match.destinationPoint[1], match.destinationPoint[0]]], { color: '#ffca79', weight: 2, opacity: .8 }); line.bindPopup(`${escapeHtml(match.destinationName)} · ${round(match.distanceMeters / 1000, 3)} km`); (state.lineLayer || (state.lineLayer = L.layerGroup())).addLayer(line); }
    });
    state.destinations.forEach((feature, index) => { const point = representative(feature); if (!point) return; const marker = L.circleMarker([point[1], point[0]], { radius: 8, color: '#fff', weight: 1, fillColor: '#76aef8', fillOpacity: .95 }); marker.bindPopup(popup(destinationName(feature, index), feature.properties)); marker.addTo(state.destinationLayer); bounds.push([point[1], point[0]]); });
    if (state.lineLayer) state.lineLayer.addTo(state.map); state.destinationLayer.addTo(state.map); state.originLayer.addTo(state.map);
    if (bounds.length) state.map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
  }
  function runAnalysis() {
    if (!state.origins.length || !state.destinations.length) return;
    const destinations = state.destinations.map((feature, index) => ({ feature, index, point: representative(feature), name: destinationName(feature, index) })).filter((item) => item.point);
    const maxInput = Number(els.maxDistance.value); const maxMeters = Number.isFinite(maxInput) && maxInput > 0 ? maxInput * 1000 : Infinity;
    state.matches = state.origins.map((feature, index) => {
      const originPoint = representative(feature); let nearest = null;
      if (originPoint) destinations.forEach((destination) => { const distanceMeters = haversine(originPoint, destination.point); if (!nearest || distanceMeters < nearest.distanceMeters) nearest = { ...destination, distanceMeters }; });
      const matched = Boolean(nearest && nearest.distanceMeters <= maxMeters);
      return { origin: feature, index, originPoint, matched, destinationIndex: matched ? nearest.index : null, destinationName: matched ? nearest.name : '', destinationPoint: matched ? nearest.point : null, distanceMeters: nearest?.distanceMeters ?? null, nearestDistanceMeters: nearest?.distanceMeters ?? null };
    });
    state.output = { type: 'FeatureCollection', features: state.matches.map((match) => { const properties = { ...(match.origin.properties || {}), proximity: match.matched ? { matched: true, destination_index: match.destinationIndex + 1, destination_name: match.destinationName, distance_m: round(match.distanceMeters, 2), distance_km: round(match.distanceMeters / 1000, 3) } : { matched: false, nearest_distance_km: match.nearestDistanceMeters === null ? null : round(match.nearestDistanceMeters / 1000, 3), max_distance_km: Number.isFinite(maxMeters) ? round(maxMeters / 1000, 3) : null } }; return { ...match.origin, properties }; }) };
    const matched = state.matches.filter((item) => item.matched); const distances = matched.map((item) => item.distanceMeters); const average = distances.length ? distances.reduce((sum, value) => sum + value, 0) / distances.length : null;
    els.originCount.textContent = state.origins.length; els.destinationCount.textContent = state.destinations.length; els.matchedCount.textContent = matched.length; els.unmatchedCount.textContent = state.matches.length - matched.length; els.averageDistance.textContent = average === null ? '—' : `${round(average / 1000, 2)} km`; els.geojsonBtn.disabled = els.csvBtn.disabled = false; els.tableHint.textContent = `${state.matches.length} relaciones calculadas · ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    els.resultBody.innerHTML = state.matches.map((match, index) => `<tr><td>Origen ${index + 1}</td><td>${escapeHtml(match.matched ? match.destinationName : '—')}</td><td>${match.distanceMeters === null ? '—' : `${round(match.distanceMeters / 1000, 3)} km`}</td><td class="${match.matched ? 'state-ok' : 'state-no'}">${match.matched ? 'Asignado' : 'Sin asignar'}</td></tr>`).join('');
    renderMap(); setStatus(`Análisis completado: ${matched.length} de ${state.matches.length} orígenes asignados.`);
  }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  function csvValue(value) { const text = value === null || value === undefined ? '' : String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
  function downloadCsv() { const rows = [['origin_index', 'destination_name', 'distance_m', 'distance_km', 'matched', 'nearest_distance_km']]; state.matches.forEach((match) => rows.push([match.index + 1, match.matched ? match.destinationName : '', match.matched ? round(match.distanceMeters, 2) : '', match.matched ? round(match.distanceMeters / 1000, 3) : '', match.matched, match.nearestDistanceMeters === null ? '' : round(match.nearestDistanceMeters / 1000, 3)])); download('proximity-relations.csv', rows.map((row) => row.map(csvValue).join(',')).join('\n'), 'text/csv;charset=utf-8'); }
  function loadExample() { state.origins = [{ type: 'Feature', properties: { codigo: 'O-01', tipo: 'sondeo' }, geometry: { type: 'Point', coordinates: [-3.706, 40.418] } }, { type: 'Feature', properties: { codigo: 'O-02', tipo: 'hallazgo' }, geometry: { type: 'Point', coordinates: [-3.693, 40.409] } }, { type: 'Feature', properties: { codigo: 'O-03', tipo: 'prospección' }, geometry: { type: 'Point', coordinates: [-3.675, 40.43] } }, { type: 'Feature', properties: { codigo: 'O-04', tipo: 'control' }, geometry: { type: 'Point', coordinates: [-3.75, 40.4] } }]; state.destinations = [{ type: 'Feature', properties: { name: 'Museo Arqueológico Nacional' }, geometry: { type: 'Point', coordinates: [-3.688, 40.423] } }, { type: 'Feature', properties: { name: 'Yacimiento de referencia' }, geometry: { type: 'Point', coordinates: [-3.704, 40.417] } }]; els.originsName.textContent = 'Ejemplo · 4 entidades'; els.destinationsName.textContent = 'Ejemplo · 2 entidades'; els.maxDistance.value = ''; updateReady(); runAnalysis(); }
  function clearAll() { state.origins = []; state.destinations = []; state.matches = []; state.output = null; els.originsFile.value = ''; els.destinationsFile.value = ''; els.originsName.textContent = 'Ningún archivo seleccionado'; els.destinationsName.textContent = 'Ningún archivo seleccionado'; ['originCount', 'destinationCount', 'matchedCount', 'unmatchedCount', 'averageDistance'].forEach((id) => $(id).textContent = '—'); els.geojsonBtn.disabled = els.csvBtn.disabled = true; els.resultBody.innerHTML = '<tr><td colspan="4" class="empty">Todavía no hay resultados.</td></tr>'; els.tableHint.textContent = 'Ejecuta un análisis para ver el detalle.'; clearLayers(); updateReady(); setStatus('Carga las dos capas o usa el ejemplo.'); }
  async function searchPlace() { const query = els.placeQuery.value.trim(); if (!query || !state.map) return; els.placeBtn.disabled = true; setStatus('Buscando lugar…'); try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language': 'es' } }); if (!response.ok) throw new Error('El servicio de búsqueda no respondió.'); const results = await response.json(); if (!results.length) throw new Error('No se encontró ese lugar.'); const result = results[0]; const lat = Number(result.lat); const lon = Number(result.lon); if (state.searchMarker) state.map.removeLayer(state.searchMarker); state.searchMarker = L.marker([lat, lon]).addTo(state.map).bindPopup(escapeHtml(result.display_name)).openPopup(); state.map.setView([lat, lon], 13); setStatus(`Lugar localizado: ${result.display_name}`); } catch (error) { setStatus(error.message, true); } finally { els.placeBtn.disabled = false; } }

  els.originsFile.addEventListener('change', (event) => { const file = event.target.files[0]; if (file) readFile(file, 'origins'); }); els.destinationsFile.addEventListener('change', (event) => { const file = event.target.files[0]; if (file) readFile(file, 'destinations'); }); els.runBtn.addEventListener('click', runAnalysis); els.exampleBtn.addEventListener('click', loadExample); els.clearBtn.addEventListener('click', clearAll); els.geojsonBtn.addEventListener('click', () => download('proximity-origins-enriched.geojson', JSON.stringify(state.output, null, 2), 'application/geo+json;charset=utf-8')); els.csvBtn.addEventListener('click', downloadCsv); els.placeBtn.addEventListener('click', searchPlace); els.placeQuery.addEventListener('keydown', (event) => { if (event.key === 'Enter') searchPlace(); });
  initMap();
})();
