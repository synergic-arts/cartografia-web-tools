(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { network: null, map: null, layer: null };
  const colors = ['#75d6c4', '#8ab4f8', '#f7c86b', '#f28f6b', '#bd9bf1', '#83c7e8', '#ef9bbb', '#9bd37b'];

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }

  function parseLines(value) {
    const parsed = JSON.parse(value.trim());
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [parsed];
    const lines = [];
    features.forEach((feature, featureIndex) => {
      const geometry = feature.geometry || feature;
      if (geometry.type === 'LineString') addLine(geometry.coordinates, feature.properties || {}, featureIndex);
      else if (geometry.type === 'MultiLineString') geometry.coordinates.forEach((coordinates, partIndex) => addLine(coordinates, feature.properties || {}, featureIndex + '-' + partIndex));
    });
    if (!lines.length) throw new Error('No se encontraron geometrías LineString o MultiLineString.');
    return lines;

    function addLine(coordinates, properties, id) {
      const clean = (coordinates || []).map(pair => [Number(pair[0]), Number(pair[1])]).filter(pair => Number.isFinite(pair[0]) && Number.isFinite(pair[1]) && pair[0] >= -180 && pair[0] <= 180 && pair[1] >= -90 && pair[1] <= 90);
      if (clean.length >= 2) lines.push({ coordinates: clean, properties, source: String(id) });
    }
  }

  function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b[1] - a[1]) * rad;
    const dLon = (b[0] - a[0]) * rad;
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
    return 6371008.8 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  }

  function lineLength(coordinates) {
    return coordinates.slice(1).reduce((sum, point, index) => sum + distance(coordinates[index], point), 0);
  }

  function nodeFor(coordinate, tolerance, nodes, buckets) {
    const lonStep = tolerance / 111320;
    const latStep = tolerance / 110540;
    const bx = Math.floor(coordinate[0] / lonStep);
    const by = Math.floor(coordinate[1] / latStep);
    let best = null;
    for (let x = bx - 1; x <= bx + 1; x += 1) {
      for (let y = by - 1; y <= by + 1; y += 1) {
        (buckets.get(x + '|' + y) || []).forEach(id => {
          const current = distance(coordinate, nodes[id].coordinates);
          if (current <= tolerance && (!best || current < best.distance)) best = { id, distance: current };
        });
      }
    }
    if (best) return best.id;
    const id = nodes.length;
    nodes.push({ id, coordinates: coordinate, snapped: 0 });
    const key = bx + '|' + by;
    buckets.set(key, [...(buckets.get(key) || []), id]);
    return id;
  }

  function buildNetwork(lines, tolerance) {
    const nodes = [], buckets = new Map(), edges = [];
    lines.forEach((line, index) => {
      const from = nodeFor(line.coordinates[0], tolerance, nodes, buckets);
      const to = nodeFor(line.coordinates.at(-1), tolerance, nodes, buckets);
      nodes[from].snapped += 1;
      nodes[to].snapped += 1;
      edges.push({ id: index + 1, from, to, coordinates: line.coordinates, length: lineLength(line.coordinates), properties: line.properties, source: line.source, component: null });
    });
    const adjacency = nodes.map(() => []);
    edges.forEach(edge => { adjacency[edge.from].push(edge); if (edge.to !== edge.from) adjacency[edge.to].push(edge); });
    const visited = new Set(), components = [];
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      const component = [], queue = [node.id];
      visited.add(node.id);
      while (queue.length) {
        const id = queue.shift(); component.push(id);
        adjacency[id].forEach(edge => {
          const next = edge.from === id ? edge.to : edge.from;
          if (!visited.has(next)) { visited.add(next); queue.push(next); }
        });
      }
      components.push(component);
    });
    const componentByNode = new Map();
    components.forEach((component, index) => component.forEach(id => componentByNode.set(id, index + 1)));
    edges.forEach(edge => { edge.component = componentByNode.get(edge.from); });
    nodes.forEach(node => {
      const neighbors = new Set();
      adjacency[node.id].forEach(edge => neighbors.add(edge.from === node.id ? edge.to : edge.from));
      node.degree = neighbors.size;
      node.type = node.degree === 0 ? 'aislado' : node.degree === 1 ? 'extremo' : node.degree >= 3 ? 'unión' : 'paso';
      node.component = componentByNode.get(node.id);
    });
    return { nodes, edges, components, adjacency, tolerance };
  }

  function initMap() {
    if (!window.L) { $('map').hidden = true; $('mapFallback').hidden = false; return; }
    state.map = L.map('map').setView([40.41, -3.70], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }

  function renderMap(network) {
    if (!state.layer) return;
    state.layer.clearLayers();
    const bounds = [];
    network.edges.forEach(edge => {
      const line = L.polyline(edge.coordinates.map(pair => [pair[1], pair[0]]), { color: colors[(edge.component - 1) % colors.length], weight: 4, opacity: .84 }).bindPopup(`<strong>Tramo ${edge.id}</strong><br>Componente: ${edge.component}<br>Longitud: ${format(edge.length / 1000)} km<br>${esc(edge.properties?.nombre || edge.properties?.name || '')}`);
      line.addTo(state.layer); edge.coordinates.forEach(pair => bounds.push([pair[1], pair[0]]));
    });
    network.nodes.forEach(node => L.circleMarker([node.coordinates[1], node.coordinates[0]], { radius: node.degree >= 3 ? 7 : 5, color: '#10232d', weight: 1, fillColor: node.degree >= 3 ? '#f7c86b' : '#eff7ff', fillOpacity: .95 }).bindPopup(`<strong>Nodo ${node.id + 1}</strong><br>${node.type}<br>Grado: ${node.degree}<br>Componente: ${node.component}`).addTo(state.layer));
    if (bounds.length) state.map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
  }

  function renderTable(network) {
    const rows = network.nodes.slice().sort((a, b) => b.degree - a.degree || a.id - b.id);
    $('tableWrap').innerHTML = `<table><thead><tr><th>NODO</th><th>LONGITUD</th><th>LATITUD</th><th>GRADO</th><th>TIPO</th><th>COMPONENTE</th></tr></thead><tbody>${rows.map(node => `<tr><td><strong>${node.id + 1}</strong></td><td>${format(node.coordinates[0], 6)}</td><td>${format(node.coordinates[1], 6)}</td><td>${node.degree}</td><td>${node.type}</td><td>${node.component}</td></tr>`).join('')}</tbody></table><p class="table-foot">Se muestran ${rows.length.toLocaleString('es-ES')} nodos; los tramos se exportan por separado.</p>`;
  }

  function calculate() {
    try {
      const tolerance = Number($('tolerance').value);
      if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1000) throw new Error('La tolerancia debe estar entre 0 y 1000 metros.');
      if (tolerance === 0) throw new Error('Usa una tolerancia mayor que cero para ajustar extremos.');
      const network = buildNetwork(parseLines($('source').value), tolerance);
      state.network = network;
      renderMap(network); renderTable(network);
      const total = network.edges.reduce((sum, edge) => sum + edge.length, 0);
      const deadEnds = network.nodes.filter(node => node.type === 'extremo').length;
      const junctions = network.nodes.filter(node => node.type === 'unión').length;
      $('edgeCount').textContent = network.edges.length.toLocaleString('es-ES');
      $('nodeCount').textContent = network.nodes.length.toLocaleString('es-ES');
      $('componentCount').textContent = network.components.length.toLocaleString('es-ES');
      $('totalLength').textContent = format(total / 1000) + ' km';
      $('deadEndCount').textContent = deadEnds.toLocaleString('es-ES');
      $('junctionCount').textContent = junctions.toLocaleString('es-ES');
      $('componentBadge').textContent = network.components.length + ' componentes';
      $('quality').textContent = 'Listo'; $('quality').style.background = '#143747'; $('quality').style.borderColor = '#346275'; $('quality').style.color = 'var(--accent)';
      ['nodesBtn', 'edgesBtn', 'csvBtn'].forEach(id => $(id).disabled = false);
      setStatus(`${network.edges.length} tramos y ${network.nodes.length} nodos ajustados con tolerancia de ${format(tolerance, 0)} m.`);
    } catch (error) { setStatus(error.message || 'No se pudo analizar la red.', true); }
  }

  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function nodesGeoJSON() { return { type: 'FeatureCollection', features: state.network.nodes.map(node => ({ type: 'Feature', properties: { node_id: node.id + 1, degree: node.degree, type: node.type, component: node.component, snapped_endpoints: node.snapped }, geometry: { type: 'Point', coordinates: node.coordinates } })) }; }
  function edgesGeoJSON() { return { type: 'FeatureCollection', features: state.network.edges.map(edge => ({ type: 'Feature', properties: { edge_id: edge.id, from_node: edge.from + 1, to_node: edge.to + 1, component: edge.component, length_m: Number(edge.length.toFixed(3)), ...edge.properties }, geometry: { type: 'LineString', coordinates: edge.coordinates } })) }; }
  function exportCsv() { const lines = ['node_id,lon,lat,degree,type,component,snapped_endpoints']; state.network.nodes.forEach(node => lines.push([node.id + 1, node.coordinates[0], node.coordinates[1], node.degree, node.type, node.component, node.snapped].join(','))); download('resumen-red.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate);
  $('sampleBtn').addEventListener('click', () => { $('source').value = sample; $('tolerance').value = 10; calculate(); });
  $('tolerance').addEventListener('change', calculate);
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('nodesBtn').addEventListener('click', () => download('nodos-red.geojson', JSON.stringify(nodesGeoJSON(), null, 2), 'application/geo+json;charset=utf-8'));
  $('edgesBtn').addEventListener('click', () => download('tramos-red.geojson', JSON.stringify(edgesGeoJSON(), null, 2), 'application/geo+json;charset=utf-8'));
  $('csvBtn').addEventListener('click', exportCsv);
  initMap(); calculate();
})();
