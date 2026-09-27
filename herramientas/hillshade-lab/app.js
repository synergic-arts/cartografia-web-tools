(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { grid: null, output: [], canvas: null, map: null, overlay: null, points: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  function setStatus(text, error = false) {
    $('status').textContent = text;
    $('status').classList.toggle('error', error);
  }

  function format(value, digits = 2) {
    return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits });
  }

  function csvRows(value) {
    const clean = value.replace(/^\uFEFF/, '');
    const first = clean.split(/\r?\n/).find(line => line.trim()) || '';
    const delimiter = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = [];
    let row = [], cell = '', quote = false;
    for (let i = 0; i < clean.length; i += 1) {
      const char = clean[i], next = clean[i + 1];
      if (char === '"' && quote && next === '"') { cell += '"'; i += 1; }
      else if (char === '"') quote = !quote;
      else if (char === delimiter && !quote) { row.push(cell.trim()); cell = ''; }
      else if ((char === '\n' || char === '\r') && !quote) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = []; cell = '';
      } else cell += char;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function cleanHeader(header) {
    return String(header).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }

  function parsePoints(value) {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : parsed.coordinates ? [{ geometry: parsed, properties: {} }] : [];
      const field = $('valueField').value.trim();
      return features.map((feature, index) => {
        if (feature.geometry?.type !== 'Point') return null;
        const coords = feature.geometry.coordinates;
        return { x: Number(coords[0]), y: Number(coords[1]), z: Number(feature.properties?.[field]), name: feature.properties?.name || feature.properties?.nombre || 'Punto ' + (index + 1) };
      }).filter(validPoint);
    }
    const rows = csvRows(value);
    if (rows.length < 2) throw new Error('La malla necesita una cabecera y al menos cuatro puntos.');
    const headers = rows[0].map(cleanHeader);
    const find = aliases => headers.findIndex(header => aliases.includes(header));
    const xIndex = find(['x', 'lon', 'lng', 'longitude', 'longitud', 'coordx']);
    const yIndex = find(['y', 'lat', 'latitude', 'latitud', 'coordy']);
    const zIndex = find(['z', 'value', 'valor', 'elev', 'elevacion', 'altitud', 'height']);
    if (xIndex < 0 || yIndex < 0 || zIndex < 0) throw new Error('CSV no reconocido: necesita columnas x/lon, y/lat y z/elevacion.');
    return rows.slice(1).map((row, index) => ({
      x: Number(String(row[xIndex]).replace(',', '.')),
      y: Number(String(row[yIndex]).replace(',', '.')),
      z: Number(String(row[zIndex]).replace(',', '.')),
      name: row[0] || 'Punto ' + (index + 1)
    })).filter(validPoint);
  }

  function validPoint(point) {
    return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
  }

  function uniqueSorted(values) {
    return [...new Set(values.map(value => Number(value.toFixed(10))))].sort((a, b) => a - b);
  }

  function buildGrid(points) {
    const xs = uniqueSorted(points.map(point => point.x));
    const ys = uniqueSorted(points.map(point => point.y));
    if (xs.length < 3 || ys.length < 3) throw new Error('Se necesitan al menos tres columnas y tres filas de elevación.');
    if (points.length !== xs.length * ys.length) throw new Error('La malla no es rectangular: falta algún cruce x/y o hay puntos duplicados.');
    const byKey = new Map();
    points.forEach(point => {
      const key = point.x + '|' + point.y;
      if (byKey.has(key)) throw new Error('Hay coordenadas x/y duplicadas.');
      byKey.set(key, point);
    });
    const z = ys.map(y => xs.map(x => {
      const point = byKey.get(x + '|' + y);
      if (!point) throw new Error('Falta un punto en la malla regular.');
      return point.z;
    }));
    const dx = median(xs.slice(1).map((x, index) => x - xs[index]));
    const dy = median(ys.slice(1).map((y, index) => y - ys[index]));
    if (!(dx > 0) || !(dy > 0)) throw new Error('Las coordenadas x/y deben estar ordenadas y separadas.');
    const isWgs84 = xs[0] >= -180 && xs.at(-1) <= 180 && ys[0] >= -90 && ys.at(-1) <= 90;
    const meanLat = (ys[0] + ys.at(-1)) / 2 * Math.PI / 180;
    const stepX = isWgs84 ? dx * 111320 * Math.cos(meanLat) : dx;
    const stepY = isWgs84 ? dy * 110540 : dy;
    return { xs, ys, z, dx, dy, stepX, stepY, isWgs84, points, min: Math.min(...z.flat()), max: Math.max(...z.flat()) };
  }

  function median(values) {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered.length % 2 ? ordered[(ordered.length - 1) / 2] : (ordered[ordered.length / 2 - 1] + ordered[ordered.length / 2]) / 2;
  }

  function calculateDerivatives(grid) {
    const azimuth = Number($('azimuth').value);
    const altitude = Number($('altitude').value);
    const exaggeration = Number($('exaggeration').value);
    if (!Number.isFinite(azimuth) || !Number.isFinite(altitude) || !Number.isFinite(exaggeration) || altitude <= 0 || altitude > 90 || exaggeration <= 0) throw new Error('Revisa azimut, altura y exageración vertical.');
    const az = ((azimuth % 360) + 360) % 360 * Math.PI / 180;
    const sunAltitude = altitude * Math.PI / 180;
    const output = [];
    for (let row = 0; row < grid.ys.length; row += 1) {
      for (let col = 0; col < grid.xs.length; col += 1) {
        const left = grid.z[row][Math.max(0, col - 1)];
        const right = grid.z[row][Math.min(grid.xs.length - 1, col + 1)];
        const down = grid.z[Math.max(0, row - 1)][col];
        const up = grid.z[Math.min(grid.ys.length - 1, row + 1)][col];
        const dx = col === 0 || col === grid.xs.length - 1 ? grid.stepX : grid.stepX * 2;
        const dy = row === 0 || row === grid.ys.length - 1 ? grid.stepY : grid.stepY * 2;
        const dzdx = (right - left) / dx * exaggeration;
        const dzdy = (up - down) / dy * exaggeration;
        const slope = Math.atan(Math.sqrt(dzdx ** 2 + dzdy ** 2));
        let aspect = Math.atan2(dzdx, dzdy) * 180 / Math.PI;
        if (aspect < 0) aspect += 360;
        const normal = Math.sqrt(1 + dzdx ** 2 + dzdy ** 2);
        const light = (Math.sin(az) * -dzdx + Math.cos(az) * -dzdy + Math.sin(sunAltitude)) / normal;
        const shade = Math.round(Math.max(0, Math.min(255, (0.18 + 0.82 * Math.max(0, light)) * 255)));
        output.push({ x: grid.xs[col], y: grid.ys[row], z: grid.z[row][col], slope: slope * 180 / Math.PI, aspect, shade });
      }
    }
    return output;
  }

  function renderCanvas(grid, output) {
    const canvas = $('previewCanvas');
    canvas.width = grid.xs.length;
    canvas.height = grid.ys.length;
    const context = canvas.getContext('2d');
    const image = context.createImageData(canvas.width, canvas.height);
    output.forEach(point => {
      const col = grid.xs.indexOf(point.x);
      const row = grid.ys.length - 1 - grid.ys.indexOf(point.y);
      const offset = (row * canvas.width + col) * 4;
      image.data[offset] = point.shade;
      image.data[offset + 1] = point.shade;
      image.data[offset + 2] = point.shade;
      image.data[offset + 3] = 255;
    });
    context.putImageData(image, 0, 0);
    state.canvas = canvas;
  }

  function initMap() {
    if (!window.L) { $('map').hidden = true; $('mapFallback').hidden = false; return; }
    state.map = L.map('map').setView([40.4, -3.7], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
  }

  function renderMap(grid) {
    if (!state.map || !state.canvas) return;
    if (state.overlay) state.map.removeLayer(state.overlay);
    const wgs84 = grid.xs[0] >= -180 && grid.xs.at(-1) <= 180 && grid.ys[0] >= -90 && grid.ys.at(-1) <= 90;
    if (!wgs84) { $('map').hidden = true; $('mapFallback').hidden = false; return; }
    $('map').hidden = false;
    $('mapFallback').hidden = true;
    const bounds = [[grid.ys[0], grid.xs[0]], [grid.ys.at(-1), grid.xs.at(-1)]];
    state.overlay = L.imageOverlay(state.canvas.toDataURL('image/png'), bounds, { opacity: .88, interactive: false }).addTo(state.map);
    state.map.fitBounds(bounds, { padding: [22, 22], maxZoom: 16 });
  }

  function renderTable(output) {
    const sampleRows = output.filter((point, index) => index % Math.max(1, Math.ceil(output.length / 30)) === 0).slice(0, 30);
    $('tableWrap').innerHTML = `<table><thead><tr><th>X/LON</th><th>Y/LAT</th><th>Elevación</th><th>Pendiente °</th><th>Aspecto °</th><th>Sombra</th></tr></thead><tbody>${sampleRows.map(point => `<tr><td>${format(point.x, 6)}</td><td>${format(point.y, 6)}</td><td>${format(point.z)}</td><td>${format(point.slope)}</td><td>${format(point.aspect, 1)}</td><td>${point.shade}</td></tr>`).join('')}</tbody></table><p class="table-foot">Se muestran hasta 30 celdas representativas; la exportación incluye las ${output.length.toLocaleString('es-ES')} celdas.</p>`;
  }

  function calculate() {
    try {
      const points = parsePoints($('source').value);
      const grid = buildGrid(points);
      const output = calculateDerivatives(grid);
      state.grid = grid;
      state.output = output;
      renderCanvas(grid, output);
      renderMap(grid);
      renderTable(output);
      const meanSlope = output.reduce((sum, point) => sum + point.slope, 0) / output.length;
      const meanShade = output.reduce((sum, point) => sum + point.shade, 0) / output.length;
      $('cellCount').textContent = output.length.toLocaleString('es-ES');
      $('elevationRange').textContent = format(grid.min) + ' – ' + format(grid.max);
      $('slopeMean').textContent = format(meanSlope) + '°';
      $('shadeMean').textContent = format(meanShade, 0) + '/255';
      $('resultBadge').textContent = grid.xs.length + ' × ' + grid.ys.length;
      $('quality').textContent = 'Listo';
      $('quality').style.background = '#143747';
      $('quality').style.borderColor = '#346275';
      $('quality').style.color = 'var(--accent)';
      $('csvBtn').disabled = false;
      $('geojsonBtn').disabled = false;
      $('pngBtn').disabled = false;
      setStatus(`${output.length.toLocaleString('es-ES')} celdas derivadas localmente con luz a ${format(Number($('azimuth').value), 0)}°.`, false);
    } catch (error) {
      setStatus(error.message || 'No se pudo calcular el relieve.', true);
    }
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 700);
  }

  function exportCsv() {
    const lines = ['x,y,elevacion,pendiente_grados,aspecto_grados,sombreado_0_255'];
    state.output.forEach(point => lines.push([point.x, point.y, point.z, point.slope, point.aspect, point.shade].join(',')));
    download('relieve-derivados.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
  }

  function exportGeoJSON() {
    const features = state.output.map(point => ({ type: 'Feature', properties: { elevacion: point.z, pendiente_grados: Number(point.slope.toFixed(4)), aspecto_grados: Number(point.aspect.toFixed(4)), sombreado: point.shade }, geometry: { type: 'Point', coordinates: [point.x, point.y] } }));
    download('relieve-derivados.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json;charset=utf-8');
  }

  $('calculateBtn').addEventListener('click', calculate);
  $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('valueField').value = 'elevacion'; calculate(); });
  ['azimuth', 'altitude', 'exaggeration'].forEach(id => $(id).addEventListener('change', calculate));
  $('file').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); };
    reader.onerror = () => setStatus('No se pudo leer el archivo local.', true);
    reader.readAsText(file);
  });
  $('csvBtn').addEventListener('click', exportCsv);
  $('geojsonBtn').addEventListener('click', exportGeoJSON);
  $('pngBtn').addEventListener('click', () => state.canvas?.toBlob(blob => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'sombreado.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }, 'image/png'));
  initMap();
  calculate();
})();
