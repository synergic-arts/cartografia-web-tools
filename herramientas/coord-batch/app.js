(() => {
  const $ = id => document.getElementById(id);
  const sample = 'id,nombre,latitud,longitud,tipo\n1,Puerta del Sol,40.4168,-3.7038,control\n2,Alcazaba,36.5101,-4.8825,yacimiento\n3,Teatro Romano,37.3858,-5.9933,patrimonio\n4,Castro de Baroña,42.6433,-9.0358,arqueologia';
  const state = { headers: [], rows: [], valid: [], invalid: [], map: null, markers: null };
  const number = value => {
    if (value === null || value === undefined) return NaN;
    let text = String(value).trim().replace(/\s/g, '');
    if (!text) return NaN;
    if (text.includes(',') && !text.includes('.')) text = text.replace(',', '.');
    return Number(text);
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function parseDelimited(text, separator) {
    const rows = []; let row = []; let cell = ''; let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i], next = text[i + 1];
      if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === separator && !quoted) { row.push(cell); cell = ''; continue; }
      if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some(value => value.trim() !== '')) rows.push(row);
        row = []; continue;
      }
      cell += char;
    }
    row.push(cell); if (row.some(value => value.trim() !== '')) rows.push(row);
    return rows;
  }
  function detectSeparator(text) {
    const first = text.split(/\r?\n/).find(line => line.trim()) || '';
    const choices = [',', ';', '\t']; return choices.sort((a, b) => first.split(b).length - first.split(a).length)[0];
  }
  function fieldScore(header, words) { const value = header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return words.some(word => value.includes(word)) ? 1 : 0; }
  function populate(fields) {
    ['latField','lonField','nameField'].forEach(id => {
      const select = $(id); const current = select.value; select.innerHTML = id === 'nameField' ? '<option value="">Sin nombre</option>' : '';
      state.headers.forEach((header, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = header || 'columna ' + (index + 1); select.appendChild(option); });
      const picked = fields[id] ?? current; if (picked !== undefined && picked !== '') select.value = String(picked);
      select.disabled = state.headers.length === 0;
    });
  }
  function parseInput() {
    const text = $('sourceText').value.trim(); if (!text) { setStatus('Pega datos o abre un archivo antes de validar.', true); return; }
    const separator = $('delimiter').value === 'auto' ? detectSeparator(text) : $('delimiter').value;
    const raw = parseDelimited(text, separator); if (raw.length < 2) { setStatus('Se necesita una cabecera y al menos un registro.', true); return; }
    state.headers = raw[0].map((value, index) => value.trim() || 'columna ' + (index + 1));
    state.rows = raw.slice(1).map(row => Object.fromEntries(state.headers.map((header, index) => [header, (row[index] ?? '').trim()])));
    const guess = {
      latField: state.headers.findIndex(header => fieldScore(header, ['lat','latitude','latitud','y']) > 0),
      lonField: state.headers.findIndex(header => fieldScore(header, ['lon','lng','long','longitude','longitud','x']) > 0),
      nameField: state.headers.findIndex(header => fieldScore(header, ['name','nombre','site','lugar','id']) > 0)
    };
    populate(guess);
    buildFeatures();
  }
  function buildFeatures() {
    const latIndex = Number($('latField').value), lonIndex = Number($('lonField').value), nameIndex = $('nameField').value === '' ? -1 : Number($('nameField').value);
    if (!Number.isInteger(latIndex) || !Number.isInteger(lonIndex)) { setStatus('Selecciona las columnas de latitud y longitud.', true); return; }
    state.valid = []; state.invalid = [];
    state.rows.forEach((row, index) => {
      const values = state.headers.map(header => row[header] ?? ''); const lat = number(values[latIndex]), lon = number(values[lonIndex]);
      const valid = Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
      const record = { index: index + 2, values, properties: Object.fromEntries(state.headers.map((header, i) => [header, values[i]])), lat, lon, valid, name: nameIndex >= 0 ? values[nameIndex] : 'Punto ' + (index + 1) };
      if (valid) state.valid.push(record); else state.invalid.push(record);
    });
    renderResults(); renderMap(); setStatus(state.valid.length + ' puntos válidos listos para exportar' + (state.invalid.length ? '; ' + state.invalid.length + ' registros requieren revisión.' : '.'));
  }
  function setStatus(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
  function renderResults() {
    const all = state.valid.concat(state.invalid); $('totalStat').textContent = all.length; $('validStat').textContent = state.valid.length; $('invalidStat').textContent = state.invalid.length; $('countBadge').textContent = state.valid.length + ' punto' + (state.valid.length === 1 ? '' : 's');
    const badge = $('validBadge'); badge.textContent = state.invalid.length ? 'Revisar registros' : (state.valid.length ? 'Válido para exportar' : 'Sin puntos válidos'); badge.className = 'valid-badge ' + (state.invalid.length ? 'warn' : state.valid.length ? '' : 'muted');
    if (state.valid.length) { const lats = state.valid.map(item => item.lat), lons = state.valid.map(item => item.lon); $('extentStat').textContent = Math.min(...lons).toFixed(3) + '…' + Math.max(...lons).toFixed(3); } else $('extentStat').textContent = '—';
    const columns = state.headers.slice(0, 5); let html = '<table><thead><tr><th>#</th>' + columns.map(escapeHtml).map(value => '<th>' + value + '</th>').join('') + '<th>Estado</th></tr></thead><tbody>';
    all.slice(0, 80).forEach(item => { html += '<tr><td>' + item.index + '</td>' + columns.map(header => '<td>' + escapeHtml(item.properties[header]) + '</td>').join('') + '<td class="' + (item.valid ? 'ok' : 'bad') + '">' + (item.valid ? 'válido' : 'coordenadas inválidas') + '</td></tr>'; });
    html += '</tbody></table>'; if (!all.length) html = '<p class="empty">No hay registros para mostrar.</p>'; $('tableWrap').innerHTML = html;
    const enabled = state.valid.length > 0; ['geojsonBtn','gpxBtn','kmlBtn','csvBtn'].forEach(id => $(id).disabled = !enabled);
  }
  function initMap() {
    if (!window.L) { $('map').hidden = true; $('mapFallback').hidden = false; return; }
    state.map = L.map('map', { zoomControl: true, attributionControl: true }).setView([40.4, -3.7], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map); state.markers = L.layerGroup().addTo(state.map);
  }
  function renderMap() {
    if (!state.markers) return; state.markers.clearLayers(); const bounds = [];
    state.valid.forEach(item => { const marker = L.marker([item.lat, item.lon], { icon: L.divIcon({ className: '', html: '<span class="point-marker"></span>', iconSize: [14,14], iconAnchor: [7,7] }) }).bindPopup('<strong>' + escapeHtml(item.name) + '</strong><br>Lat ' + item.lat.toFixed(6) + ' · Lon ' + item.lon.toFixed(6)); marker.addTo(state.markers); bounds.push([item.lat, item.lon]); });
    if (bounds.length) state.map.fitBounds(bounds, { padding: [24,24], maxZoom: 16 });
  }
  function download(name, content, type) { const blob = new Blob([content], { type }), url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  function exportGeoJson() { download('puntos.geojson', JSON.stringify({ type:'FeatureCollection', features: state.valid.map(item => ({ type:'Feature', geometry:{ type:'Point', coordinates:[item.lon,item.lat] }, properties:item.properties })) }, null, 2), 'application/geo+json'); }
  function xml(value) { return escapeHtml(value); }
  function exportGpx() { const body = state.valid.map(item => '  <wpt lat="' + item.lat + '" lon="' + item.lon + '"><name>' + xml(item.name) + '</name></wpt>').join('\n'); download('puntos.gpx', '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Coord Batch" xmlns="http://www.topografix.com/GPX/1/1">\n' + body + '\n</gpx>', 'application/gpx+xml'); }
  function exportKml() { const body = state.valid.map(item => '  <Placemark><name>' + xml(item.name) + '</name><Point><coordinates>' + item.lon + ',' + item.lat + ',0</coordinates></Point></Placemark>').join('\n'); download('puntos.kml', '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n' + body + '\n</Document></kml>', 'application/vnd.google-earth.kml+xml'); }
  function csvValue(value) { const text = String(value ?? ''); return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; }
  function exportCsv() { const headers = state.headers.concat(['latitud_normalizada','longitud_normalizada']); const lines = [headers.map(csvValue).join(',')].concat(state.valid.map(item => item.values.concat([item.lat,item.lon]).map(csvValue).join(','))); download('puntos-limpios.csv', lines.join('\n'), 'text/csv;charset=utf-8'); }
  $('sampleBtn').addEventListener('click', () => { $('sourceText').value = sample; parseInput(); });
  $('parseBtn').addEventListener('click', parseInput); $('delimiter').addEventListener('change', parseInput); ['latField','lonField'].forEach(id => $(id).addEventListener('change', buildFeatures)); $('nameField').addEventListener('change', buildFeatures);
  $('fileInput').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; $('sourceText').value = await file.text(); parseInput(); });
  $('geojsonBtn').addEventListener('click', exportGeoJson); $('gpxBtn').addEventListener('click', exportGpx); $('kmlBtn').addEventListener('click', exportKml); $('csvBtn').addEventListener('click', exportCsv);
  initMap(); $('sampleBtn').click();
})();
