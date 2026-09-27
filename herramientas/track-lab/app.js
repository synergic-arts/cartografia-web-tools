(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { tracks: [], segments: [], map: null, layer: null, profile: [] };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function distance(a, b) { const r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r, q = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2; return 6371008.8 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); }
  function parseTracks(value) {
    const parsed = JSON.parse(value.trim());
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [{ geometry: parsed, properties: {} }];
    const tracks = [];
    features.forEach((feature, featureIndex) => {
      const geometry = feature.geometry || feature;
      const parts = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
      parts.forEach((coordinates, partIndex) => {
        const clean = (coordinates || []).map(coordinate => [Number(coordinate[0]), Number(coordinate[1]), Number(coordinate[2])]).filter(coordinate => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]) && coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90);
        if (clean.length >= 2) {
          const properties = feature.properties || {};
          const rawTimes = Array.isArray(properties.timestamps) ? properties.timestamps : Array.isArray(properties.times) ? properties.times : [];
          tracks.push({ coordinates: clean, properties, name: properties.nombre || properties.name || 'Track ' + (featureIndex + 1), part: partIndex + 1, times: rawTimes.map(value => new Date(value)).map(date => Number.isNaN(date.getTime()) ? null : date.getTime()) });
        }
      });
    });
    if (!tracks.length) throw new Error('No se encontraron geometrías LineString o MultiLineString válidas.');
    return tracks;
  }

  function colorFor(slope, maxSlope) { const ratio = maxSlope ? Math.min(1, Math.abs(slope) / maxSlope) : 0; const r = Math.round(138 + (247 - 138) * ratio), g = Math.round(180 + (200 - 180) * ratio), b = Math.round(248 - 143 * ratio); return `rgb(${r},${g},${b})`; }

  function analyze(tracks) {
    const segments = [], profile = [], allPoints = [];
    let chainage = 0, ascent = 0, descent = 0, minElevation = Infinity, maxElevation = -Infinity, duration = 0;
    tracks.forEach(track => {
      track.coordinates.forEach((coordinate, index) => { allPoints.push(coordinate); if (Number.isFinite(coordinate[2])) { minElevation = Math.min(minElevation, coordinate[2]); maxElevation = Math.max(maxElevation, coordinate[2]); } });
      const startChainage = chainage;
      track.coordinates.forEach((coordinate, index) => {
        if (Number.isFinite(coordinate[2])) profile.push({ chainage, elevation: coordinate[2] });
        if (index === 0) return;
        const previous = track.coordinates[index - 1];
        const length = distance(previous, coordinate);
        const delta = Number.isFinite(previous[2]) && Number.isFinite(coordinate[2]) ? coordinate[2] - previous[2] : null;
        if (delta != null) { if (delta > 0) ascent += delta; if (delta < 0) descent += Math.abs(delta); }
        const fromTime = track.times[index - 1], toTime = track.times[index];
        if (fromTime != null && toTime != null && toTime > fromTime) duration += toTime - fromTime;
        chainage += length;
        segments.push({ index: segments.length + 1, track: track.name, part: track.part, from: previous, to: coordinate, length, delta, slope: delta == null || length === 0 ? null : delta / length * 100, speed: fromTime != null && toTime > fromTime ? length / ((toTime - fromTime) / 1000) * 3.6 : null, chainage });
      });
      if (profile.length && profile[profile.length - 1].chainage < chainage) profile.push({ chainage, elevation: track.coordinates.at(-1)[2] });
    });
    return { segments, profile, total: chainage, ascent, descent, minElevation, maxElevation, duration, points: allPoints };
  }

  function initMap() {
    if (!window.L) return;
    state.map = L.map('map').setView([40.42, -3.70], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }

  function renderMap(result) {
    if (!state.layer) return;
    state.layer.clearLayers();
    const maxSlope = Math.max(...result.segments.map(segment => Math.abs(segment.slope || 0)), 1), bounds = [];
    result.segments.forEach(segment => { const line = L.polyline([[segment.from[1], segment.from[0]], [segment.to[1], segment.to[0]]], { color: colorFor(segment.slope || 0, maxSlope), weight: 5, opacity: .9 }).bindPopup(`<strong>Segmento ${segment.index}</strong><br>${format(segment.length / 1000)} km<br>Pendiente: ${segment.slope == null ? 'sin elevación' : format(segment.slope) + '%'}<br>Desnivel: ${segment.delta == null ? '—' : format(segment.delta) + ' m'}`); line.addTo(state.layer); bounds.push([segment.from[1], segment.from[0]], [segment.to[1], segment.to[0]]); });
    if (bounds.length) state.map.fitBounds(bounds, { padding: [22, 22], maxZoom: 15 });
  }

  function renderProfile(profile) {
    const canvas = $('profile'), context = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
    context.clearRect(0, 0, width, height); context.fillStyle = '#07131c'; context.fillRect(0, 0, width, height);
    if (!profile.length) { context.fillStyle = '#9db2bd'; context.font = '14px system-ui'; context.fillText('Sin elevación en las coordenadas.', 18, 32); return; }
    const min = Math.min(...profile.map(point => point.elevation)), max = Math.max(...profile.map(point => point.elevation)), maxX = Math.max(...profile.map(point => point.chainage), 1), pad = 28, yScale = Math.max(1, max - min);
    const point = item => [pad + item.chainage / maxX * (width - pad * 2), height - pad - (item.elevation - min) / yScale * (height - pad * 2)];
    context.strokeStyle = '#294456'; context.lineWidth = 1; context.beginPath(); context.moveTo(pad, pad); context.lineTo(pad, height - pad); context.lineTo(width - pad, height - pad); context.stroke();
    context.beginPath(); profile.forEach((item, index) => { const p = point(item); index ? context.lineTo(p[0], p[1]) : context.moveTo(p[0], p[1]); }); context.lineTo(width - pad, height - pad); context.lineTo(pad, height - pad); context.closePath(); context.fillStyle = 'rgba(117,214,196,.17)'; context.fill();
    context.beginPath(); profile.forEach((item, index) => { const p = point(item); index ? context.lineTo(p[0], p[1]) : context.moveTo(p[0], p[1]); }); context.strokeStyle = '#75d6c4'; context.lineWidth = 2.5; context.stroke();
    context.fillStyle = '#9db2bd'; context.font = '12px system-ui'; context.fillText(format(min) + ' m', 5, height - pad + 4); context.fillText(format(max) + ' m', 5, pad + 4); context.fillText('0 km', pad, height - 7); context.fillText(format(maxX / 1000) + ' km', width - 72, height - 7);
  }

  function renderTable(segments) {
    const rows = segments.slice(0, 80);
    $('tableWrap').innerHTML = `<table><thead><tr><th>#</th><th>TRAMO</th><th>DISTANCIA</th><th>DESNIVEL</th><th>PENDIENTE</th><th>VELOCIDAD</th><th>CADENAJE</th></tr></thead><tbody>${rows.map(segment => `<tr><td>${segment.index}</td><td>${esc(segment.track)}</td><td>${format(segment.length)} m</td><td>${segment.delta == null ? '—' : format(segment.delta) + ' m'}</td><td>${segment.slope == null ? '—' : format(segment.slope) + '%'}</td><td>${segment.speed == null ? '—' : format(segment.speed) + ' km/h'}</td><td>${format(segment.chainage / 1000)} km</td></tr>`).join('')}</tbody></table><p class="table-foot">Se muestran ${rows.length.toLocaleString('es-ES')} de ${segments.length.toLocaleString('es-ES')} segmentos.</p>`;
  }

  function calculate() {
    try {
      const tracks = parseTracks($('source').value), result = analyze(tracks);
      state.tracks = tracks; state.segments = result.segments; state.profile = result.profile;
      renderMap(result); renderProfile(result.profile); renderTable(result.segments);
      $('distance').textContent = format(result.total / 1000) + ' km'; $('ascent').textContent = result.ascent ? '+' + format(result.ascent) + ' m' : '—'; $('descent').textContent = result.descent ? '-' + format(result.descent) + ' m' : '—'; $('elevationRange').textContent = Number.isFinite(result.minElevation) ? format(result.minElevation) + ' – ' + format(result.maxElevation) + ' m' : 'sin datos'; $('duration').textContent = result.duration ? format(result.duration / 3600000, 2) + ' h' : 'sin datos'; $('speed').textContent = result.duration ? format(result.total / 1000 / (result.duration / 3600000)) + ' km/h' : 'sin datos'; $('partBadge').textContent = tracks.length + ' tramo' + (tracks.length === 1 ? '' : 's'); $('quality').textContent = Number.isFinite(result.minElevation) ? 'Listo' : 'Distancia lista'; $('quality').style.background = '#143747'; $('quality').style.borderColor = '#346275'; $('quality').style.color = 'var(--accent)'; $('csvBtn').disabled = false; $('geojsonBtn').disabled = false;
      setStatus(`${tracks.length} geometría${tracks.length === 1 ? '' : 's'} y ${result.segments.length} segmentos analizados localmente.`);
    } catch (error) { setStatus(error.message || 'No se pudo analizar el track.', true); }
  }

  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportCsv() { const lines = ['segmento,track,parte,lon_inicio,lat_inicio,lon_fin,lat_fin,distancia_m,elevacion_delta_m,pendiente_pct,velocidad_kmh,cadenaje_m']; state.segments.forEach(segment => lines.push([segment.index, JSON.stringify(segment.track), segment.part, segment.from[0], segment.from[1], segment.to[0], segment.to[1], segment.length, segment.delta ?? '', segment.slope ?? '', segment.speed ?? '', segment.chainage].join(','))); download('segmentos-track.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }
  function exportGeoJSON() { const points = []; state.tracks.forEach(track => track.coordinates.forEach((coordinate, index) => points.push({ type: 'Feature', properties: { track: track.name, parte: track.part, orden: index + 1, elevacion: Number.isFinite(coordinate[2]) ? coordinate[2] : null }, geometry: { type: 'Point', coordinates: coordinate.slice(0, 3) } }))); download('puntos-track.geojson', JSON.stringify({ type: 'FeatureCollection', features: points }, null, 2), 'application/geo+json;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; calculate(); });
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('csvBtn').addEventListener('click', exportCsv); $('geojsonBtn').addEventListener('click', exportGeoJSON);
  initMap(); calculate();
})();
