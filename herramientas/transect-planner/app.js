(() => {
  const $ = id => document.getElementById(id);
  const map = L.map('map', { zoomControl: true }).setView([40.401, -3.703], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  const planLayer = L.layerGroup().addTo(map);
  let collection = null;

  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const number = id => Number($(id).value);
  const rad = degrees => degrees * Math.PI / 180;
  const toLatLng = (x, y, centerLat, centerLng) => [centerLat + y / 111320, centerLng + x / (111320 * Math.cos(rad(centerLat)))];
  const rotate = (point, angle) => { const a = rad(angle); return [point[0] * Math.cos(a) - point[1] * Math.sin(a), point[0] * Math.sin(a) + point[1] * Math.cos(a)]; };
  const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const setStatus = (message, error = false) => { $('status').textContent = message; $('status').style.color = error ? 'var(--danger)' : 'var(--lime)'; };

  function validate() {
    const values = { centerLat: number('lat'), centerLng: number('lng'), width: number('width') * 1000, height: number('height') * 1000, spacing: number('spacing'), angle: number('angle'), pointSpacing: number('pointSpacing') };
    if (![values.centerLat, values.centerLng, values.width, values.height, values.spacing, values.angle, values.pointSpacing].every(Number.isFinite) || values.centerLat < -90 || values.centerLat > 90 || values.centerLng < -180 || values.centerLng > 180 || values.width < 100 || values.height < 100 || values.spacing < 10 || values.pointSpacing < 10) throw new Error('Revisa coordenadas y parámetros: usa un área de 0,1–50 km y distancias positivas.');
    const transects = Math.ceil(values.height / values.spacing) + 1;
    const estimatedPoints = Math.ceil((transects * values.width + (transects - 1) * values.spacing) / values.pointSpacing) + 1;
    if (transects > 500 || estimatedPoints > 5000) throw new Error('El plan supera el límite de 500 transectos o 5.000 puntos. Aumenta las separaciones.');
    return values;
  }

  function samplesBetween(start, end, interval) {
    const length = distance(start, end); const count = Math.max(1, Math.ceil(length / interval));
    return Array.from({ length: count + 1 }, (_, index) => { const t = index / count; return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]; });
  }

  function buildPlan(params) {
    const halfW = params.width / 2; const halfH = params.height / 2;
    const ys = []; for (let y = -halfH; y < halfH; y += params.spacing) ys.push(y); if (!ys.length || ys[ys.length - 1] !== halfH) ys.push(halfH);
    const boundaryLocal = [[-halfW, -halfH], [halfW, -halfH], [halfW, halfH], [-halfW, halfH], [-halfW, -halfH]];
    const boundary = boundaryLocal.map(point => toLatLng(...rotate(point, params.angle), params.centerLat, params.centerLng));
    const transects = []; const routeLocal = []; const waypointsLocal = [];
    ys.forEach((y, index) => {
      const start = index % 2 ? [halfW, y] : [-halfW, y]; const end = index % 2 ? [-halfW, y] : [halfW, y];
      if (routeLocal.length) routeLocal.push([routeLocal[routeLocal.length - 1][0], start[1]]);
      const linePoints = samplesBetween(start, end, params.pointSpacing); routeLocal.push(...linePoints); waypointsLocal.push(...linePoints);
      transects.push([toLatLng(...rotate(start, params.angle), params.centerLat, params.centerLng), toLatLng(...rotate(end, params.angle), params.centerLat, params.centerLng)]);
    });
    const route = routeLocal.map(point => toLatLng(...rotate(point, params.angle), params.centerLat, params.centerLng));
    const waypoints = waypointsLocal.map((point, index) => ({ coord: toLatLng(...rotate(point, params.angle), params.centerLat, params.centerLng), sequence: index + 1 }));
    const routeDistance = routeLocal.reduce((total, point, index) => index ? total + distance(point, routeLocal[index - 1]) : 0, 0);
    const features = [{ type: 'Feature', properties: { kind: 'boundary', name: 'Área de campaña', width_m: params.width, height_m: params.height, orientation_deg: params.angle }, geometry: { type: 'Polygon', coordinates: [boundary.map(([lat, lng]) => [lng, lat])] } }, { type: 'Feature', properties: { kind: 'route', name: 'Recorrido completo', distance_m: routeDistance }, geometry: { type: 'LineString', coordinates: route.map(([lat, lng]) => [lng, lat]) } }];
    transects.forEach((line, index) => features.push({ type: 'Feature', properties: { kind: 'transect', id: `T${String(index + 1).padStart(3, '0')}`, distance_m: distance(line[0], line[1]) }, geometry: { type: 'LineString', coordinates: line.map(([lat, lng]) => [lng, lat]) } }));
    waypoints.forEach(point => features.push({ type: 'Feature', properties: { kind: 'waypoint', id: `P${String(point.sequence).padStart(4, '0')}`, sequence: point.sequence }, geometry: { type: 'Point', coordinates: [point.coord[1], point.coord[0]] } }));
    return { type: 'FeatureCollection', features, summary: { transects: transects.length, points: waypoints.length, distance: routeDistance, area: params.width * params.height, params } };
  }

  function render(plan) {
    planLayer.clearLayers();
    const layer = L.geoJSON(plan, { style: feature => { const kind = feature.properties.kind; if (kind === 'boundary') return { className: 'boundary-line', color: '#ffc76d', weight: 2, fillColor: '#ffc76d', fillOpacity: .07 }; if (kind === 'route') return { className: 'route-line', color: '#d0f780', weight: 4, opacity: .95 }; return { className: 'transect-line', color: '#55d8e8', weight: 2, opacity: .75 }; }, pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 5, color: '#5d3a1d', weight: 2, fillColor: '#ffc76d', fillOpacity: 1, interactive: false }), onEachFeature: (feature, item) => { const p = feature.properties; if (p.kind === 'waypoint') item.bindTooltip(p.id, { direction: 'top', offset: [0, -5] }).bindPopup(`<b>${safe(p.id)}</b><br>Punto de muestreo ${p.sequence}`); if (p.kind === 'transect') item.bindPopup(`<b>${safe(p.id)}</b><br>${Math.round(p.distance_m)} m de recorrido`); } }).addTo(planLayer);
    if (layer.getBounds().isValid()) map.fitBounds(layer.getBounds(), { padding: [18, 18] });
    const s = plan.summary; $('state').textContent = 'plan listo'; $('transectCount').textContent = s.transects; $('pointCount').textContent = s.points; $('distance').textContent = `${(s.distance / 1000).toFixed(2)} km`; $('area').textContent = `${(s.area / 1000000).toFixed(2)} km²`; $('geoBtn').disabled = false; $('csvBtn').disabled = false; $('routeSummary').innerHTML = `<b>${s.transects} transectos</b> · ${s.points} puntos · ${(s.distance / 1000).toFixed(2)} km de recorrido · orientación ${((s.params.angle % 360) + 360) % 360}°.`; setStatus('Plan generado. Pulsa un transecto o punto para consultar sus datos.');
  }

  function generate() { try { collection = buildPlan(validate()); render(collection); } catch (error) { collection = null; planLayer.clearLayers(); $('state').textContent = 'revisar'; $('geoBtn').disabled = true; $('csvBtn').disabled = true; setStatus(error.message, true); } }
  function download(name, data, type) { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([data], { type })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 600); }
  function geojson() { const copy = { type: collection.type, features: collection.features }; return JSON.stringify(copy, null, 2); }
  function csv() { const points = collection.features.filter(feature => feature.properties.kind === 'waypoint'); return ['id,sequence,longitude,latitude', ...points.map(feature => { const p = feature.properties; const [lng, lat] = feature.geometry.coordinates; return `${p.id},${p.sequence},${lng.toFixed(7)},${lat.toFixed(7)}`; })].join('\n'); }

  $('planForm').addEventListener('submit', event => { event.preventDefault(); generate(); });
  $('clearBtn').addEventListener('click', () => { collection = null; planLayer.clearLayers(); $('state').textContent = 'sin ruta'; ['transectCount', 'pointCount', 'distance', 'area'].forEach(id => $(id).textContent = '—'); $('routeSummary').textContent = ''; $('geoBtn').disabled = true; $('csvBtn').disabled = true; setStatus('Plan limpiado.'); });
  $('geoBtn').addEventListener('click', () => collection && download('transectos-campana.geojson', geojson(), 'application/geo+json'));
  $('csvBtn').addEventListener('click', () => collection && download('puntos-muestreo.csv', csv(), 'text/csv;charset=utf-8'));
  $('locateBtn').addEventListener('click', () => { if (!navigator.geolocation) return setStatus('Este navegador no ofrece geolocalización.', true); $('locateBtn').disabled = true; setStatus('Solicitando posición…'); navigator.geolocation.getCurrentPosition(position => { $('lat').value = position.coords.latitude.toFixed(6); $('lng').value = position.coords.longitude.toFixed(6); map.setView([position.coords.latitude, position.coords.longitude], 14); $('locateBtn').disabled = false; setStatus(`Centro actualizado con precisión aproximada de ${Math.round(position.coords.accuracy)} m.`); }, () => { $('locateBtn').disabled = false; setStatus('No se pudo obtener la posición. Comprueba el permiso.', true); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); });
  CartografiaPlaceSearch(map, { input: $('placeQuery'), button: $('placeSearchButton'), results: $('placeResults'), status: $('placeStatus'), zoom: 14, onLocate(place) { $('lat').value = place.lat.toFixed(6); $('lng').value = place.lng.toFixed(6); } });
  generate();
})();
