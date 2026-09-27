(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sample = $('source').value;
  const state = { features: [], plans: [], source: null, map: null, layer: null, bbox: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function finitePair(value) { return Array.isArray(value) && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])); }

  function eachCoordinate(geometry, visit) {
    if (!geometry) return;
    if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).forEach(item => eachCoordinate(item, visit));
    const walk = value => { if (finitePair(value)) visit([Number(value[0]), Number(value[1])]); else if (Array.isArray(value)) value.forEach(walk); };
    walk(geometry.coordinates);
  }

  function anchorFor(geometry) {
    const all = [];
    eachCoordinate(geometry, coordinate => all.push(coordinate));
    if (!all.length) return null;
    if (geometry.type === 'Point' && finitePair(geometry.coordinates)) return [Number(geometry.coordinates[0]), Number(geometry.coordinates[1])];
    return [all.reduce((sum, coordinate) => sum + coordinate[0], 0) / all.length, all.reduce((sum, coordinate) => sum + coordinate[1], 0) / all.length];
  }

  function parseSource(value) {
    const parsed = JSON.parse(value.trim());
    const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [{ type: 'Feature', properties: {}, geometry: parsed }];
    const normalized = features.map((feature, index) => {
      const geometry = feature.geometry || null;
      const anchor = anchorFor(geometry);
      if (!anchor) return null;
      return { feature, geometry, properties: feature.properties || {}, index, anchor };
    }).filter(Boolean);
    if (!normalized.length) throw new Error('No se encontraron geometrías con coordenadas válidas.');
    return { parsed, features: normalized };
  }

  function getProperty(properties, field) {
    if (!field) return undefined;
    if (Object.prototype.hasOwnProperty.call(properties, field)) return properties[field];
    const wanted = field.toLowerCase();
    const key = Object.keys(properties).find(candidate => candidate.toLowerCase() === wanted);
    return key ? properties[key] : undefined;
  }

  function labelFor(properties, field, index) {
    const value = getProperty(properties, field);
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    for (const fallback of ['nombre', 'name', 'title', 'id']) {
      const fallbackValue = getProperty(properties, fallback);
      if (fallbackValue !== undefined && fallbackValue !== null && String(fallbackValue).trim()) return String(fallbackValue).trim();
    }
    return `Entidad ${index + 1}`;
  }

  function priorityFor(properties, field) {
    const value = getProperty(properties, field);
    if (value === undefined || value === null || String(value).trim() === '') return 0;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function extent(features) {
    const values = features.map(item => item.anchor);
    const xs = values.map(pair => pair[0]), ys = values.map(pair => pair[1]);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    if (minX === maxX) { minX -= .001; maxX += .001; }
    if (minY === maxY) { minY -= .001; maxY += .001; }
    return { minX, maxX, minY, maxY };
  }

  function boxesOverlap(a, b, gap) { return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y; }

  function calculatePlans(features) {
    const field = $('labelField').value.trim(), priorityField = $('priorityField').value.trim();
    const maxLabels = Math.max(1, Math.min(5000, Number($('maxLabels').value) || 40));
    const gap = Math.max(0, Math.min(80, Number($('minGap').value) || 0));
    const canvas = $('preview'), width = canvas.width, height = canvas.height, margin = 10, boxHeight = 22;
    const bounds = extent(features), mapX = lon => margin + (lon - bounds.minX) / (bounds.maxX - bounds.minX) * (width - margin * 2), mapY = lat => height - margin - (lat - bounds.minY) / (bounds.maxY - bounds.minY) * (height - margin * 2);
    const candidates = [[14, -15], [-14, -15], [14, 9], [-14, 9], [0, -24], [0, 18], [22, -3], [-22, -3]];
    const ordered = features.map(item => ({ ...item, label: labelFor(item.properties, field, item.index), priority: priorityFor(item.properties, priorityField) })).sort((a, b) => b.priority - a.priority || a.index - b.index);
    const occupied = [], plans = [];
    ordered.forEach(item => {
      const x = mapX(item.anchor[0]), y = mapY(item.anchor[1]);
      const labelWidth = Math.max(46, Math.min(220, item.label.length * 7 + 16));
      let placed = null;
      if (plans.filter(plan => plan.status === 'colocada').length < maxLabels) {
        for (const [offsetX, offsetY] of candidates) {
          const box = { x: x + offsetX - labelWidth / 2, y: y + offsetY - boxHeight, width: labelWidth, height: boxHeight };
          if (box.x < margin || box.y < margin || box.x + box.width > width - margin || box.y + box.height > height - margin) continue;
          if (!occupied.some(other => boxesOverlap(box, other, gap))) { placed = { box, offsetX, offsetY }; break; }
        }
      }
      const status = placed ? 'colocada' : plans.filter(plan => plan.status === 'colocada').length >= maxLabels ? 'oculta-límite' : 'oculta-colisión';
      if (placed) occupied.push(placed.box);
      plans.push({ ...item, x, y, box: placed?.box || null, offsetX: placed?.offsetX || 0, offsetY: placed?.offsetY || 0, status });
    });
    plans.sort((a, b) => a.index - b.index);
    return { plans, bounds };
  }

  function initMap() {
    if (!window.L) return;
    state.map = L.map('map').setView([40.42, -3.70], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }

  function renderMap(plans) {
    if (!state.layer) return;
    state.layer.clearLayers();
    const bounds = [];
    plans.forEach(plan => {
      const marker = L.circleMarker([plan.anchor[1], plan.anchor[0]], { radius: plan.status === 'colocada' ? 6 : 5, color: plan.status === 'colocada' ? '#75d6c4' : '#ff9d9d', fillColor: plan.status === 'colocada' ? '#75d6c4' : '#ff9d9d', fillOpacity: .85, weight: 2 });
      marker.bindPopup(`<strong>${esc(plan.label)}</strong><br>Prioridad: ${format(plan.priority)}<br>Estado: ${esc(plan.status)}<br>${format(plan.anchor[0], 5)}, ${format(plan.anchor[1], 5)}`).addTo(state.layer);
      bounds.push([plan.anchor[1], plan.anchor[0]]);
    });
    if (bounds.length) state.map.fitBounds(bounds, { padding: [22, 22], maxZoom: 15 });
  }

  function renderPreview(plans, bounds) {
    const canvas = $('preview'), context = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
    context.clearRect(0, 0, width, height); context.fillStyle = '#07131c'; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#294456'; context.lineWidth = 1; context.strokeRect(10, 10, width - 20, height - 20);
    const x = lon => 10 + (lon - bounds.minX) / (bounds.maxX - bounds.minX) * (width - 20), y = lat => height - 10 - (lat - bounds.minY) / (bounds.maxY - bounds.minY) * (height - 20);
    plans.forEach(plan => {
      const px = x(plan.anchor[0]), py = y(plan.anchor[1]);
      context.beginPath(); context.arc(px, py, 4, 0, Math.PI * 2); context.fillStyle = plan.status === 'colocada' ? '#75d6c4' : '#ff9d9d'; context.fill();
      if (!plan.box) return;
      const box = plan.box, drawX = box.x, drawY = box.y;
      context.fillStyle = 'rgba(20,65,70,.96)'; context.strokeStyle = '#75d6c4'; context.lineWidth = 1; context.beginPath(); context.roundRect(drawX, drawY, box.width, box.height, 5); context.fill(); context.stroke();
      context.fillStyle = '#eef6f7'; context.font = '12px system-ui'; context.fillText(plan.label, drawX + 7, drawY + 15, box.width - 12);
      context.strokeStyle = 'rgba(117,214,196,.35)'; context.setLineDash([3, 3]); context.beginPath(); context.moveTo(px, py); context.lineTo(drawX + box.width / 2, drawY + box.height / 2); context.stroke(); context.setLineDash([]);
    });
    context.fillStyle = '#9db2bd'; context.font = '12px system-ui'; context.fillText(`${plans.length} anclajes · ${plans.filter(plan => plan.status === 'colocada').length} colocadas`, 20, height - 20);
  }

  function renderTable(plans) {
    const rows = plans.slice(0, 150);
    $('tableWrap').innerHTML = `<table><thead><tr><th>#</th><th>ETIQUETA</th><th>PRIORIDAD</th><th>ESTADO</th><th>LONGITUD</th><th>LATITUD</th></tr></thead><tbody>${rows.map(plan => `<tr><td>${plan.index + 1}</td><td>${esc(plan.label)}</td><td>${format(plan.priority)}</td><td><span class="row-status ${plan.status === 'colocada' ? 'is-placed' : 'is-hidden'}">${esc(plan.status)}</span></td><td>${format(plan.anchor[0], 5)}</td><td>${format(plan.anchor[1], 5)}</td></tr>`).join('')}</tbody></table><p class="table-foot">Se muestran ${rows.length.toLocaleString('es-ES')} de ${plans.length.toLocaleString('es-ES')} entidades.</p>`;
  }

  function calculate() {
    try {
      const parsed = parseSource($('source').value), result = calculatePlans(parsed.features), placed = result.plans.filter(plan => plan.status === 'colocada').length, hidden = result.plans.length - placed;
      state.features = parsed.features; state.plans = result.plans; state.source = parsed.parsed; state.bbox = result.bounds;
      renderMap(result.plans); renderPreview(result.plans, result.bounds); renderTable(result.plans);
      $('featureCount').textContent = result.plans.length.toLocaleString('es-ES'); $('placedCount').textContent = placed.toLocaleString('es-ES'); $('hiddenCount').textContent = hidden.toLocaleString('es-ES'); $('priorityReadout').textContent = format(Math.max(...result.plans.map(plan => plan.priority), 0)); $('sourceExtent').textContent = `${format(result.bounds.maxX - result.bounds.minX, 3)}° × ${format(result.bounds.maxY - result.bounds.minY, 3)}°`; $('placedBadge').textContent = `${placed}/${result.plans.length}`; $('quality').textContent = hidden ? 'Revisar conflictos' : 'Listo'; $('quality').style.background = hidden ? '#342c18' : '#143747'; $('quality').style.borderColor = hidden ? '#725c2a' : '#346275'; $('quality').style.color = hidden ? '#f4c56b' : 'var(--accent)'; $('geojsonBtn').disabled = false; $('csvBtn').disabled = false;
      setStatus(`${placed} etiquetas colocadas y ${hidden} ocultas. Todo el cálculo se ha ejecutado localmente.`);
    } catch (error) { setStatus(error.message || 'No se pudo calcular el etiquetado.', true); }
  }

  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function csvCell(value) { const text = String(value ?? ''); return `"${text.replace(/"/g, '""')}"`; }
  function exportCsv() { const lines = ['indice,etiqueta,prioridad,estado,longitud,latitud,desplazamiento_x,desplazamiento_y']; state.plans.forEach(plan => lines.push([plan.index + 1, plan.label, plan.priority, plan.status, plan.anchor[0], plan.anchor[1], plan.offsetX, plan.offsetY].map(csvCell).join(','))); download('plan-etiquetas.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }
  function exportGeoJSON() { const features = state.features.map(item => { const plan = state.plans.find(candidate => candidate.index === item.index); return { ...item.feature, properties: { ...(item.feature.properties || {}), _label: plan?.label || '', _label_status: plan?.status || 'sin-plan', _label_priority: plan?.priority || 0, _label_anchor: item.anchor } }; }); download('capa-etiquetada.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('source').value = sample; calculate(); });
  $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('source').value = String(reader.result || ''); calculate(); }; reader.onerror = () => setStatus('No se pudo leer el archivo local.', true); reader.readAsText(file); });
  $('geojsonBtn').addEventListener('click', exportGeoJSON); $('csvBtn').addEventListener('click', exportCsv);
  initMap(); calculate();
})();
