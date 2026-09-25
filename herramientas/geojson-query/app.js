(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    file: $('fileInput'),
    dropzone: $('dropzone'),
    loadDemo: $('loadDemo'),
    geometryType: $('geometryType'),
    combineMode: $('combineMode'),
    rules: $('rules'),
    addRule: $('addRule'),
    clearRules: $('clearRules'),
    applyFilter: $('applyFilter'),
    metricTotal: $('metricTotal'),
    metricSelected: $('metricSelected'),
    metricExcluded: $('metricExcluded'),
    metricFields: $('metricFields'),
    queryBadge: $('queryBadge'),
    mapStatus: $('mapStatus'),
    map: $('map'),
    mapEmpty: $('mapEmpty'),
    resultsBody: $('resultsBody'),
    resultSummary: $('resultSummary'),
    exportCsv: $('exportCsv'),
    exportGeojson: $('exportGeojson')
  };

  let source = { type: 'FeatureCollection', features: [] };
  let selected = [];
  let fields = [];
  let rules = [];
  let map = null;
  let resultLayer = null;

  const operators = [
    ['contains', 'Contiene'],
    ['equals', 'Igual a'],
    ['not-equals', 'Distinto de'],
    ['gte', '≥ (número)'],
    ['lte', '≤ (número)'],
    ['is-empty', 'Está vacío'],
    ['is-not-empty', 'No está vacío']
  ];

  const demo = {
    type: 'FeatureCollection',
    name: 'Arqueología de demostración',
    features: [
      point('Valeria', -2.891, 39.792, { finds: 84, period: 'romano', status: 'documentado' }),
      point('Vega Baja', -4.045, 39.866, { finds: 112, period: 'visigodo', status: 'documentado' }),
      point('Labitolosa', 0.125, 42.117, { finds: 67, period: 'romano', status: 'candidato' }),
      point('Cástulo', -3.633, 38.055, { finds: 138, period: 'ibero', status: 'documentado' }),
      point('Clunia', -3.356, 41.762, { finds: 96, period: 'romano', status: 'documentado' }),
      point('Numancia', -2.447, 41.806, { finds: 121, period: 'celtibero', status: 'documentado' }),
      polygon('Área de estudio', [[-3.2, 40.0], [-2.7, 40.0], [-2.7, 40.35], [-3.2, 40.35], [-3.2, 40.0]], { finds: 12, period: 'medieval', status: 'candidato' })
    ]
  };

  function point(name, lon, lat, properties) {
    return { type: 'Feature', properties: { name, ...properties }, geometry: { type: 'Point', coordinates: [lon, lat] } };
  }

  function polygon(name, coordinates, properties) {
    return { type: 'Feature', properties: { name, ...properties }, geometry: { type: 'Polygon', coordinates: [coordinates] } };
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function normalise(input) {
    if (!input || typeof input !== 'object') throw new Error('El JSON no contiene una capa reconocible.');
    if (input.type === 'FeatureCollection') return { type: 'FeatureCollection', features: (input.features || []).filter((feature) => feature && feature.type === 'Feature' && feature.geometry) };
    if (input.type === 'Feature' && input.geometry) return { type: 'FeatureCollection', features: [input] };
    if (input.type && input.coordinates) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: input }] };
    throw new Error('Se esperaba un FeatureCollection, Feature o geometría GeoJSON.');
  }

  function getFields() {
    const set = new Set();
    source.features.forEach((feature) => Object.keys(feature.properties || {}).forEach((field) => set.add(field)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }

  function fieldValue(feature, field) {
    return feature.properties && Object.prototype.hasOwnProperty.call(feature.properties, field) ? feature.properties[field] : '';
  }

  function isEmpty(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function matchesRule(feature, rule) {
    const current = fieldValue(feature, rule.field);
    const input = String(rule.value ?? '').trim();
    const leftNumber = typeof current === 'number' ? current : Number(String(current).replace(',', '.'));
    const rightNumber = Number(input.replace(',', '.'));
    if (rule.operator === 'is-empty') return isEmpty(current);
    if (rule.operator === 'is-not-empty') return !isEmpty(current);
    if (rule.operator === 'contains') return String(current).toLocaleLowerCase().includes(input.toLocaleLowerCase());
    if (rule.operator === 'equals') return String(current).toLocaleLowerCase() === input.toLocaleLowerCase();
    if (rule.operator === 'not-equals') return String(current).toLocaleLowerCase() !== input.toLocaleLowerCase();
    if (rule.operator === 'gte') return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber >= rightNumber;
    if (rule.operator === 'lte') return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber <= rightNumber;
    return true;
  }

  function isRuleActive(rule) {
    return ['is-empty', 'is-not-empty'].includes(rule.operator) || String(rule.value ?? '').trim() !== '';
  }

  function createMap() {
    if (!window.L) {
      els.mapStatus.textContent = 'Mapa no disponible; el resto de la consulta sí funciona.';
      return;
    }
    map = L.map(els.map, { zoomControl: true, preferCanvas: true }).setView([40.1, -3.7], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    resultLayer = L.geoJSON(null, {
      style: () => ({ color: '#55d6d0', weight: 2, fillColor: '#55d6d0', fillOpacity: .25 }),
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 7, color: '#071924', weight: 2, fillColor: '#5be0d8', fillOpacity: .9 }),
      onEachFeature: (feature, layer) => {
        const title = feature.properties?.name || feature.properties?.nombre || 'Entidad';
        layer.bindPopup(`<div class="popup-title">${esc(title)}</div><div class="popup-attrs">${esc(JSON.stringify(feature.properties || {}, null, 2))}</div>`);
      }
    }).addTo(map);
  }

  function renderRuleRows() {
    if (!rules.length) {
      els.rules.innerHTML = '<div class="empty-rules">Sin reglas: se muestran todas las entidades del tipo elegido.</div>';
      return;
    }
    els.rules.innerHTML = rules.map((rule, index) => {
      const fieldOptions = fields.length ? fields.map((field) => `<option value="${esc(field)}" ${field === rule.field ? 'selected' : ''}>${esc(field)}</option>`).join('') : '<option value="">Sin campos</option>';
      const operatorOptions = operators.map(([value, label]) => `<option value="${value}" ${value === rule.operator ? 'selected' : ''}>${label}</option>`).join('');
      const needsValue = !['is-empty', 'is-not-empty'].includes(rule.operator);
      return `<div class="rule-row" data-rule="${index}"><select class="rule-field" aria-label="Campo de la regla">${fieldOptions}</select><select class="rule-operator" aria-label="Operador de la regla">${operatorOptions}</select><input class="rule-value" aria-label="Valor de la regla" value="${esc(rule.value)}" placeholder="Valor" ${needsValue ? '' : 'disabled'}><button class="remove-rule" type="button" title="Eliminar regla" aria-label="Eliminar regla">×</button></div>`;
    }).join('');
    els.rules.querySelectorAll('.rule-row').forEach((row) => {
      const index = Number(row.dataset.rule);
      row.querySelector('.rule-field').addEventListener('change', (event) => { rules[index].field = event.target.value; applyFilter(); });
      row.querySelector('.rule-operator').addEventListener('change', (event) => { rules[index].operator = event.target.value; renderRuleRows(); applyFilter(); });
      row.querySelector('.rule-value').addEventListener('input', (event) => { rules[index].value = event.target.value; applyFilter(); });
      row.querySelector('.remove-rule').addEventListener('click', () => { rules.splice(index, 1); renderRuleRows(); applyFilter(); });
    });
  }

  function renderTable() {
    if (!selected.length) {
      els.resultsBody.innerHTML = `<tr><td colspan="4" class="empty-cell">Ninguna entidad cumple el filtro actual.</td></tr>`;
      return;
    }
    els.resultsBody.innerHTML = selected.map(({ feature, index }) => {
      const properties = feature.properties || {};
      const name = properties.name || properties.nombre || properties.title || `Entidad ${index + 1}`;
      return `<tr><td>${index + 1}</td><td><span class="geometry-pill">${esc(feature.geometry?.type || 'Sin geometría')}</span></td><td><span class="entity-name">${esc(name)}</span></td><td><code class="attribute-code">${esc(JSON.stringify(properties, null, 2))}</code></td></tr>`;
    }).join('');
  }

  function renderMap() {
    if (!map || !resultLayer) return;
    resultLayer.clearLayers();
    resultLayer.addData({ type: 'FeatureCollection', features: selected.map((item) => item.feature) });
    if (selected.length) {
      const bounds = resultLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds.pad(.12), { maxZoom: 15 });
      els.mapEmpty.classList.add('hidden');
      els.mapStatus.textContent = `${selected.length} entidades visibles`;
    } else {
      els.mapEmpty.classList.remove('hidden');
      els.mapStatus.textContent = 'Sin entidades para este filtro';
    }
  }

  function applyFilter() {
    const type = els.geometryType.value;
    const activeRules = rules.filter((rule) => rule.field && rule.operator && isRuleActive(rule));
    selected = source.features.map((feature, index) => ({ feature, index })).filter(({ feature }) => {
      const geometryMatches = type === 'all' || feature.geometry?.type === type;
      const rulesMatch = !activeRules.length || (els.combineMode.value === 'all' ? activeRules.every((rule) => matchesRule(feature, rule)) : activeRules.some((rule) => matchesRule(feature, rule)));
      return geometryMatches && rulesMatch;
    });
    els.metricTotal.textContent = source.features.length;
    els.metricSelected.textContent = selected.length;
    els.metricExcluded.textContent = Math.max(0, source.features.length - selected.length);
    els.metricFields.textContent = fields.length;
    const conditionCount = activeRules.length + (type === 'all' ? 0 : 1);
    els.queryBadge.textContent = conditionCount ? `${conditionCount} ${conditionCount === 1 ? 'condición' : 'condiciones'}` : 'Sin filtro';
    els.resultSummary.textContent = `${selected.length} ${selected.length === 1 ? 'entidad visible' : 'entidades visibles'}`;
    els.exportCsv.disabled = !selected.length;
    els.exportGeojson.disabled = !selected.length;
    renderTable();
    renderMap();
  }

  function loadData(input, label) {
    try {
      source = normalise(input);
      fields = getFields();
      rules = fields.length ? [{ field: fields[0], operator: 'contains', value: '' }] : [];
      renderRuleRows();
      applyFilter();
      els.mapStatus.textContent = `${source.features.length} entidades · ${label}`;
      els.mapEmpty.classList.toggle('hidden', Boolean(source.features.length));
    } catch (error) {
      window.alert(error.message);
    }
  }

  function readFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { loadData(JSON.parse(reader.result), file.name); } catch { window.alert('No se ha podido leer el JSON del archivo.'); }
    };
    reader.readAsText(file);
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportGeoJSON() {
    download('geojson-query-selection.geojson', JSON.stringify({ type: 'FeatureCollection', features: selected.map((item) => item.feature) }, null, 2), 'application/geo+json;charset=utf-8');
  }

  function csvCell(value) {
    const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCSV() {
    const exportFields = Array.from(new Set(selected.flatMap(({ feature }) => Object.keys(feature.properties || {}))));
    const rows = [['feature_index', 'geometry_type', ...exportFields], ...selected.map(({ feature, index }) => [index + 1, feature.geometry?.type || '', ...exportFields.map((field) => fieldValue(feature, field))])];
    const csv = '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\n');
    download('geojson-query-selection.csv', csv, 'text/csv;charset=utf-8');
  }

  els.file.addEventListener('change', (event) => readFile(event.target.files[0]));
  els.dropzone.addEventListener('click', () => els.file.click());
  els.dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); els.file.click(); } });
  ['dragenter', 'dragover'].forEach((eventName) => els.dropzone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach((eventName) => els.dropzone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropzone.classList.remove('dragover'); }));
  els.dropzone.addEventListener('drop', (event) => readFile(event.dataTransfer.files[0]));
  els.loadDemo.addEventListener('click', () => loadData(demo, 'capa de demostración'));
  els.addRule.addEventListener('click', () => { if (!fields.length) return; rules.push({ field: fields[0], operator: 'contains', value: '' }); renderRuleRows(); applyFilter(); });
  els.clearRules.addEventListener('click', () => { rules = []; renderRuleRows(); applyFilter(); });
  els.applyFilter.addEventListener('click', applyFilter);
  els.geometryType.addEventListener('change', applyFilter);
  els.combineMode.addEventListener('change', applyFilter);
  els.exportGeojson.addEventListener('click', exportGeoJSON);
  els.exportCsv.addEventListener('click', exportCSV);

  createMap();
  renderRuleRows();
})();
