(() => {
  const SOURCES = [
    {
      id: 'malaga-2026',
      label: 'Málaga · yacimientos arqueológicos 2026',
      publisher: 'Diputación Provincial de Málaga',
      format: 'JSON',
      urls: ['https://opendata.malaga.es/dataset/c396a724-769e-4298-9e4e-5da74e6236da/resource/fe819fb6-5a32-42d8-bc18-a15b6e2eda8f/download/yacimientos-arqueologicos_2026.json'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/l02000029-yacimientos-arqueologicos',
      license: 'CC BY 4.0',
      notes: 'Inventario provincial con registros publicados por el portal de datos abiertos de Málaga.'
    },
    {
      id: 'euskadi-restos',
      label: 'Euskadi · cuevas y restos arqueológicos',
      publisher: 'Gobierno Vasco · Open Data Euskadi',
      format: 'GeoJSON / JSON',
      urls: [
        'https://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/cuevas_restos_arqueologicos/opendata/cuevas.geojson',
        'https://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/cuevas_restos_arqueologicos/opendata/cuevas.json'
      ],
      catalogUrl: 'https://datos.gob.es/es/catalogo/a16003011-patrimonio-cultural-cuevas-y-restos-arqueologicos',
      license: 'CC BY 4.0',
      notes: 'Capa de cuevas y restos arqueológicos de Euskadi con descarga GeoJSON y actualización indicada como semanal.'
    },
    {
      id: 'navarra-bic',
      label: 'Navarra · yacimientos arqueológicos BIC',
      publisher: 'SITNA · Gobierno de Navarra',
      format: 'Shapefile ZIP',
      urls: ['https://idena.navarra.es/descargas/PATRIM_Pol_YaciArqueo.zip'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/a15002917-yacimientos-arqueologicos1',
      license: 'CC BY 4.0',
      notes: 'Capa de polígonos de yacimientos arqueológicos declarados Bien de Interés Cultural en Navarra.'
    }
  ];

  const DEMO = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { nombre: 'Ejemplo · asentamiento costero', periodo: 'Calcolítico', municipio: 'Registro didáctico', fuente: 'Ejemplo local', descripcion: 'Dato sintético para probar filtros y exportación.' }, geometry: { type: 'Point', coordinates: [-4.42, 36.72] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · necrópolis', periodo: 'Romano', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-3.70, 40.41] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · fortificación', periodo: 'Medieval', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-1.64, 42.82] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · cueva con arte rupestre', periodo: 'Paleolítico', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-2.67, 43.25] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · estructura hidráulica', periodo: 'No indicado', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Polygon', coordinates: [[[-0.38, 39.47], [-0.37, 39.47], [-0.37, 39.48], [-0.38, 39.48], [-0.38, 39.47]]] } }
    ]
  };

  const state = { records: [], selectedId: null, layer: null, photoCache: new Map(), loadedSources: new Map() };
  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput: $('fileInput'), sourceSelect: $('sourceSelect'), loadSourceBtn: $('loadSourceBtn'), exampleBtn: $('exampleBtn'), customName: $('customName'), customUrl: $('customUrl'), customLoadBtn: $('customLoadBtn'), sourceMeta: $('sourceMeta'), status: $('status'), filterText: $('filterText'), periodFilter: $('periodFilter'), loadedSourceFilter: $('loadedSourceFilter'), totalCount: $('totalCount'), visibleCount: $('visibleCount'), sourceCount: $('sourceCount'), namedCount: $('namedCount'), exportGeoBtn: $('exportGeoBtn'), exportCsvBtn: $('exportCsvBtn'), exportReportBtn: $('exportReportBtn'), clearBtn: $('clearBtn'), resultHint: $('resultHint'), resultTable: $('resultTable'), detailPanel: $('detailPanel'), detailTitle: $('detailTitle'), detailMeta: $('detailMeta'), detailProperties: $('detailProperties'), detailLinks: $('detailLinks'), closeDetailBtn: $('closeDetailBtn'), photoBtn: $('photoBtn'), photoStatus: $('photoStatus'), photoGrid: $('photoGrid')
  };

  let map;
  let placeSearch;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function normaliseKey(value) {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function stringValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  function pickValue(properties, aliases) {
    const entries = Object.entries(properties || {});
    const wanted = aliases.map(normaliseKey);
    for (const key of wanted) {
      const found = entries.find(([name, value]) => normaliseKey(name) === key && stringValue(value));
      if (found) return stringValue(found[1]);
    }
    for (const key of wanted) {
      const found = entries.find(([name, value]) => normaliseKey(name).includes(key) && stringValue(value));
      if (found) return stringValue(found[1]);
    }
    return '';
  }

  function parseNumber(value) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = stringValue(value).replace(',', '.');
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function pointFromGeometry(geometry) {
    if (!geometry || !Array.isArray(geometry.coordinates)) return null;
    if (geometry.type === 'Point' && geometry.coordinates.length >= 2) {
      const lng = parseNumber(geometry.coordinates[0]);
      const lat = parseNumber(geometry.coordinates[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    try {
      const points = [];
      const walk = (value) => {
        if (Array.isArray(value) && value.length >= 2 && value.every((item) => typeof item === 'number')) points.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
      };
      walk(geometry.coordinates);
      if (!points.length) return null;
      const lng = points.reduce((sum, point) => sum + point[0], 0) / points.length;
      const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
      return { lat, lng };
    } catch { return null; }
  }

  function pointFromRecord(record, properties) {
    const lat = parseNumber(pickValue(properties, ['lat', 'latitude', 'latitud', 'lat_wgs84', 'y_lat']));
    const lng = parseNumber(pickValue(properties, ['lon', 'lng', 'long', 'longitude', 'longitud', 'lon_wgs84', 'x_lon']));
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    const coordinates = pickValue(properties, ['coordinates', 'coordenadas', 'ubicacion']);
    if (coordinates) {
      const values = coordinates.split(/[;|\s]+/).map(parseNumber).filter((item) => Number.isFinite(item));
      if (values.length >= 2) return { lat: values[0], lng: values[1] };
    }
    return pointFromGeometry(record?.geometry);
  }

  function periodFor(properties, name) {
    const explicit = pickValue(properties, ['periodo', 'period', 'cronologia', 'chronology', 'epoca', 'era', 'datacion', 'fecha']);
    const context = `${explicit} ${name} ${pickValue(properties, ['descripcion', 'description', 'tipo', 'type'])}`;
    const text = context.toLowerCase();
    const categories = [
      ['Paleolítico', ['paleolit', 'musteriense', 'magdaleniense']],
      ['Neolítico / Calcolítico', ['neolit', 'calcolit', 'megalit']],
      ['Edad del Bronce', ['bronce', 'argari', 'talayot']],
      ['Edad del Hierro / Prerromano', ['hierro', 'iber', 'celt', 'protohist', 'prerroman']],
      ['Romano', ['roman', 'romano', 'hispanorrom', 'villa romana']],
      ['Tardoantiguo', ['tardoant', 'visigot', 'paleocrist']],
      ['Medieval', ['medieval', 'andalus', 'islam', 'altomedieval', 'castillo']],
      ['Moderno / Contemporáneo', ['moderno', 'contempor', 'industrial', 'siglo xix', 'siglo xx']]
    ];
    const match = categories.find(([, terms]) => terms.some((term) => text.includes(term)));
    return match ? match[0] : (explicit || 'No indicado');
  }

  function normalisePayload(payload) {
    if (!payload) return [];
    if (payload.type === 'FeatureCollection' && Array.isArray(payload.features)) return payload.features;
    if (payload.type === 'Feature') return [payload];
    if (payload.type && payload.coordinates) return [{ type: 'Feature', geometry: payload, properties: {} }];
    if (Array.isArray(payload)) return payload.flatMap((item) => item?.type === 'FeatureCollection' && Array.isArray(item.features) ? item.features : [item]);
    for (const key of ['features', 'data', 'items', 'results', 'records', 'yacimientos', 'sites']) {
      if (Array.isArray(payload[key])) return payload[key];
      if (payload[key]?.type === 'FeatureCollection') return payload[key].features;
    }
    const values = Object.values(payload).filter((value) => value && typeof value === 'object' && !Array.isArray(value));
    return values.length > 1 ? values : [];
  }

  function makeRecord(raw, source, index) {
    const incoming = raw?.type === 'Feature' ? raw : (raw?.geometry ? { type: 'Feature', geometry: raw.geometry, properties: raw.properties || raw } : { type: 'Feature', geometry: null, properties: raw || {} });
    const properties = { ...(incoming.properties || {}) };
    const name = pickValue(properties, ['nombre', 'name', 'denominacion', 'denominación', 'yacimiento', 'sitio', 'site', 'toponimo', 'topónimo', 'title']) || `Registro ${index + 1}`;
    const point = pointFromRecord(incoming, properties);
    let geometry = incoming.geometry || null;
    if (!geometry && point) geometry = { type: 'Point', coordinates: [point.lng, point.lat] };
    if (!geometry) return null;
    const meta = {
      id: `${source.id || 'source'}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      source: source.label,
      sourceId: source.id,
      sourceUrl: source.urls?.[0] || source.url || '',
      catalogUrl: source.catalogUrl || '',
      publisher: source.publisher || 'Fuente aportada por el usuario',
      license: source.license || 'Consultar fuente',
      period: periodFor(properties, name),
      municipality: pickValue(properties, ['municipio', 'municipality', 'localidad', 'poblacion', 'población', 'town', 'city']),
      province: pickValue(properties, ['provincia', 'province', 'territorio', 'territory']),
      region: pickValue(properties, ['comunidad', 'autonomia', 'autonomía', 'region', 'región']),
      code: pickValue(properties, ['codigo', 'código', 'code', 'id', 'referencia', 'reference', 'ref']),
      description: pickValue(properties, ['descripcion', 'descripción', 'description', 'observaciones', 'notes']),
      photoUrl: pickValue(properties, ['foto', 'fotografia', 'fotografía', 'imagen', 'image', 'imageurl', 'urlfoto', 'urlimagen'])
    };
    const feature = { type: 'Feature', geometry, properties };
    Object.defineProperty(feature, '__arqueoId', { value: meta.id, enumerable: false });
    return { feature, meta, point: point || pointFromGeometry(geometry) };
  }

  function sourceForCustom(name, url) {
    return { id: `custom-${Date.now()}`, label: name || 'Fuente personalizada', publisher: 'Aportada por el usuario', format: 'URL', urls: [url], catalogUrl: '', license: 'Consultar fuente', notes: 'Fuente añadida manualmente; conserva su ficha de procedencia.' };
  }

  function setStatus(message, kind = '') {
    els.status.textContent = message;
    els.status.className = `status ${kind}`.trim();
  }

  function initMap() {
    map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([40.25, -3.7], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    placeSearch = window.CartografiaPlaceSearch?.(map, { input: $('placeQuery'), button: $('placeSearchButton'), results: $('placeResults'), status: $('placeStatus'), zoom: 12, onLocate: ({ lat, lng, displayName }) => { map.setView([lat, lng], Math.max(map.getZoom(), 12)); L.popup().setLatLng([lat, lng]).setContent(`<strong>${escapeHtml(displayName)}</strong>`).openOn(map); } });
  }

  function colorFor(period) {
    const colors = { 'Paleolítico': '#e5a65e', 'Neolítico / Calcolítico': '#f0c36c', 'Edad del Bronce': '#df8669', 'Edad del Hierro / Prerromano': '#c979c9', Romano: '#73b7e8', Tardoantiguo: '#91c783', Medieval: '#8c9bea', 'Moderno / Contemporáneo': '#d2d8df' };
    return colors[period] || '#72dfba';
  }

  function recordCenter(record) {
    if (record.point && Number.isFinite(record.point.lat) && Number.isFinite(record.point.lng)) return [record.point.lat, record.point.lng];
    try { const bounds = L.geoJSON(record.feature).getBounds(); return bounds.isValid() ? [bounds.getCenter().lat, bounds.getCenter().lng] : null; } catch { return null; }
  }

  function filteredRecords() {
    const text = els.filterText.value.trim().toLowerCase();
    const period = els.periodFilter.value;
    const source = els.loadedSourceFilter.value;
    return state.records.filter((record) => {
      const haystack = [record.meta.name, record.meta.municipality, record.meta.province, record.meta.region, record.meta.code, record.meta.description, record.meta.source].join(' ').toLowerCase();
      return (!text || haystack.includes(text)) && (!period || record.meta.period === period) && (!source || record.meta.source === source);
    });
  }

  function renderMap(records) {
    state.layer?.remove();
    if (!records.length) { map.setView([40.25, -3.7], 5); return; }
    state.layer = L.geoJSON(records.map((record) => record.feature), {
      pointToLayer: (feature, latlng) => { const record = records.find((item) => item.feature === feature); const color = colorFor(record?.meta.period); return L.circleMarker(latlng, { radius: 7, color: '#082018', weight: 2, fillColor: color, fillOpacity: .9 }); },
      style: (feature) => { const record = records.find((item) => item.feature === feature); const color = colorFor(record?.meta.period); return { color, weight: 2, fillColor: color, fillOpacity: .28 }; },
      onEachFeature: (feature, layer) => { const record = records.find((item) => item.feature === feature); if (!record) return; layer.bindTooltip(record.meta.name, { sticky: true }); layer.on('click', () => selectRecord(record.meta.id, true)); }
    }).addTo(map);
    const bounds = state.layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(.12), { maxZoom: 14 });
  }

  function renderFilters() {
    const currentPeriod = els.periodFilter.value;
    const periods = [...new Set(state.records.map((record) => record.meta.period).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    els.periodFilter.innerHTML = '<option value="">Todos los periodos</option>' + periods.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    if (periods.includes(currentPeriod)) els.periodFilter.value = currentPeriod;
    const currentSource = els.loadedSourceFilter.value;
    const sources = [...new Set(state.records.map((record) => record.meta.source).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    els.loadedSourceFilter.innerHTML = '<option value="">Todas las fuentes</option>' + sources.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    if (sources.includes(currentSource)) els.loadedSourceFilter.value = currentSource;
  }

  function renderStats(records) {
    els.totalCount.textContent = state.records.length.toLocaleString('es-ES');
    els.visibleCount.textContent = records.length.toLocaleString('es-ES');
    els.sourceCount.textContent = state.loadedSources.size.toLocaleString('es-ES');
    els.namedCount.textContent = state.records.filter((record) => record.meta.name && !record.meta.name.startsWith('Registro ')).length.toLocaleString('es-ES');
    const enabled = state.records.length > 0;
    [els.exportGeoBtn, els.exportCsvBtn, els.exportReportBtn].forEach((button) => { button.disabled = !enabled; });
  }

  function renderTable(records) {
    const limit = 250;
    if (!records.length) { els.resultTable.innerHTML = '<tr><td colspan="5">No hay registros con los filtros actuales.</td></tr>'; els.resultHint.textContent = '0 resultados'; return; }
    els.resultTable.innerHTML = records.slice(0, limit).map((record) => {
      const coord = recordCenter(record);
      const location = coord ? `${coord[1].toFixed(4)}, ${coord[0].toFixed(4)}` : 'sin coordenada';
      return `<tr><td><button class="record-button" data-record-id="${escapeHtml(record.meta.id)}">${escapeHtml(record.meta.name)}<small>${escapeHtml(record.meta.code || record.meta.description || 'Abrir ficha')}</small></button></td><td>${escapeHtml(record.meta.period)}</td><td>${escapeHtml(record.meta.municipality || record.meta.province || '—')}</td><td>${escapeHtml(record.meta.source)}</td><td class="coord">${escapeHtml(location)}</td></tr>`;
    }).join('');
    els.resultHint.textContent = records.length > limit ? `${records.length.toLocaleString('es-ES')} resultados · mostrando ${limit}` : `${records.length.toLocaleString('es-ES')} resultados`;
  }

  function render() {
    const records = filteredRecords();
    renderFilters();
    renderStats(records);
    renderTable(records);
    renderMap(records);
  }

  function selectedRecord() { return state.records.find((record) => record.meta.id === state.selectedId) || null; }

  function selectRecord(id, flyTo = false) {
    const record = state.records.find((item) => item.meta.id === id);
    if (!record) return;
    state.selectedId = id;
    const coord = recordCenter(record);
    if (flyTo && coord) map.setView(coord, Math.max(map.getZoom(), 13), { animate: true });
    els.detailPanel.hidden = false;
    els.detailTitle.textContent = record.meta.name;
    els.detailMeta.innerHTML = [record.meta.period, record.meta.municipality || record.meta.province, record.meta.source].filter(Boolean).map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join('');
    const skip = new Set(['nombre', 'name', 'periodo', 'period', 'municipio', 'municipality', 'provincia', 'province']);
    const properties = Object.entries(record.feature.properties || {}).filter(([key, value]) => !skip.has(normaliseKey(key)) && value !== null && value !== undefined && stringValue(value));
    els.detailProperties.innerHTML = properties.slice(0, 28).map(([key, value]) => `<dl class="property"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value)}</dd></dl>`).join('') || '<p class="hint">La fuente no publica más atributos descriptivos.</p>';
    const links = [];
    if (record.meta.sourceUrl) links.push(`<a href="${escapeHtml(record.meta.sourceUrl)}" target="_blank" rel="noreferrer">Abrir descarga de la fuente ↗</a>`);
    if (record.meta.catalogUrl) links.push(`<a href="${escapeHtml(record.meta.catalogUrl)}" target="_blank" rel="noreferrer">Ver catálogo y condiciones ↗</a>`);
    if (record.meta.photoUrl) links.push(`<a href="${escapeHtml(record.meta.photoUrl)}" target="_blank" rel="noreferrer">Abrir fotografía publicada ↗</a>`);
    els.detailLinks.innerHTML = links.join('');
    els.photoGrid.replaceChildren();
    els.photoStatus.textContent = 'Se buscan imágenes por nombre y municipio; revisa siempre la relación, licencia y atribución.';
    els.photoBtn.disabled = false;
    if (record.meta.photoUrl) renderPhotos([{ thumburl: record.meta.photoUrl, url: record.meta.photoUrl, title: record.meta.name, license: 'Fuente del registro', artist: record.meta.publisher }], false);
    else if (state.photoCache.has(id)) renderPhotos(state.photoCache.get(id));
  }

  function stripMarkup(value) { return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

  function renderPhotos(items, append = false) {
    if (!append) els.photoGrid.replaceChildren();
    if (!items.length && !els.photoGrid.children.length) { els.photoStatus.textContent = 'No se encontraron imágenes relacionadas en Wikimedia Commons.'; return; }
    els.photoGrid.insertAdjacentHTML('beforeend', items.map((item) => `<figure class="photo-card"><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(item.thumburl || item.url)}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer"></a><figcaption><b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.artist || 'Autoría no indicada')} · ${escapeHtml(item.license || 'Licencia no indicada')}<br><a href="${escapeHtml(item.descriptionurl || item.url)}" target="_blank" rel="noreferrer">Ficha y licencia ↗</a></figcaption></figure>`).join(''));
  }

  async function searchPhotos() {
    const record = selectedRecord();
    if (!record) return;
    if (state.photoCache.has(record.meta.id)) { renderPhotos(state.photoCache.get(record.meta.id)); return; }
    const query = [record.meta.name, record.meta.municipality, record.meta.province].filter(Boolean).join(' ');
    if (!query) { els.photoStatus.textContent = 'El registro no tiene un nombre utilizable para buscar fotografías.'; return; }
    els.photoBtn.disabled = true;
    els.photoStatus.textContent = `Buscando imágenes para “${query}”…`;
    try {
      const queries = [...new Set([query, record.meta.name].filter(Boolean))];
      let items = [];
      for (const currentQuery of queries) {
        const url = new URL('https://commons.wikimedia.org/w/api.php');
        url.search = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: currentQuery, gsrnamespace: '6', gsrlimit: '12', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '520', format: 'json', origin: '*' });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        items = Object.values(json.query?.pages || {}).map((page) => {
          const info = page.imageinfo?.[0] || {};
          const meta = info.extmetadata || {};
          return { title: page.title?.replace(/^File:/, '') || 'Imagen de Commons', url: info.descriptionurl || info.url, descriptionurl: info.descriptionurl, thumburl: info.thumburl || info.url, artist: stripMarkup(meta.Artist?.value || meta.Credit?.value), license: stripMarkup(meta.LicenseShortName?.value || meta.License?.value) };
        }).filter((item) => item.url && item.thumburl);
        if (items.length) break;
      }
      state.photoCache.set(record.meta.id, items);
      renderPhotos(items);
      els.photoStatus.textContent = items.length ? `${items.length} resultado${items.length === 1 ? '' : 's'} relacionados. Comprueba la ficha antes de reutilizar una imagen.` : 'No se encontraron imágenes relacionadas en Wikimedia Commons.';
    } catch (error) {
      els.photoStatus.textContent = 'No se pudo consultar Wikimedia Commons. Revisa la conexión o abre la búsqueda manualmente.';
    } finally { els.photoBtn.disabled = false; }
  }

  function sourceDescription(source) {
    if (!source) { els.sourceMeta.textContent = 'Selecciona una fuente para ver su cobertura, licencia y enlace oficial.'; return; }
    els.sourceMeta.innerHTML = `<b>${escapeHtml(source.label)}</b><br>${escapeHtml(source.publisher)} · ${escapeHtml(source.format)}<br>${escapeHtml(source.notes || '')}<br><span>Licencia: ${escapeHtml(source.license)}</span><br><a href="${escapeHtml(source.catalogUrl || source.urls?.[0] || '#')}" target="_blank" rel="noreferrer">Abrir ficha oficial ↗</a>`;
  }

  function sourceById(id) { return SOURCES.find((source) => source.id === id); }

  async function parseResponse(response, url) {
    const isZip = url.toLowerCase().endsWith('.zip') || (response.headers.get('content-type') || '').includes('zip');
    if (isZip) {
      if (typeof window.shp !== 'function') throw new Error('No se ha cargado el lector Shapefile.');
      return window.shp(await response.arrayBuffer());
    }
    const text = await response.text();
    try { return JSON.parse(text); } catch { throw new Error('La respuesta no es JSON/GeoJSON válido.'); }
  }

  async function fetchSource(source) {
    const errors = [];
    for (const url of source.urls || []) {
      try {
        const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await parseResponse(response, url);
      } catch (error) { errors.push(`${url}: ${error.message}`); }
    }
    throw new Error(`No se pudo leer la fuente desde el navegador. ${errors.join(' · ')}`);
  }

  function addPayload(payload, source) {
    const incoming = normalisePayload(payload);
    const records = incoming.map((raw, index) => makeRecord(raw, source, index)).filter(Boolean);
    if (!records.length) throw new Error('La fuente no contiene entidades con geometría o coordenadas reconocibles.');
    state.records.push(...records);
    state.loadedSources.set(source.id, source);
    render();
    setStatus(`${source.label}: ${records.length.toLocaleString('es-ES')} registros añadidos al atlas.`, 'ok');
  }

  async function loadSource(source) {
    if (!source) return;
    sourceDescription(source);
    els.loadSourceBtn.disabled = true;
    setStatus(`Descargando ${source.label}…`);
    try { const payload = await fetchSource(source); addPayload(payload, source); }
    catch (error) { setStatus(`${error.message} Puedes descargar la fuente y abrirla como archivo local.`, 'error'); }
    finally { els.loadSourceBtn.disabled = false; }
  }

  async function loadFile(file) {
    const source = { id: `local-${Date.now()}`, label: `Archivo local · ${file.name}`, publisher: 'Archivo aportado por el usuario', format: file.name.toLowerCase().endsWith('.zip') ? 'Shapefile ZIP' : 'GeoJSON / JSON', urls: [], catalogUrl: '', license: 'Según el archivo', notes: 'Cargado localmente; no se ha transmitido a ningún servidor.' };
    setStatus(`Analizando ${file.name} en este navegador…`);
    try {
      let payload;
      if (file.name.toLowerCase().endsWith('.zip')) {
        if (typeof window.shp !== 'function') throw new Error('No se ha cargado el lector Shapefile.');
        payload = await window.shp(await file.arrayBuffer());
      } else payload = JSON.parse(await file.text());
      addPayload(payload, source);
    } catch (error) { setStatus(`No se pudo leer ${file.name}: ${error.message}`, 'error'); }
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportFeatures() {
    const records = filteredRecords();
    const features = records.map((record) => ({ ...record.feature, properties: { ...record.feature.properties, _arqueo_source: record.meta.source, _arqueo_source_url: record.meta.sourceUrl || undefined, _arqueo_catalog_url: record.meta.catalogUrl || undefined, _arqueo_period: record.meta.period } }));
    download('arqueo-atlas-seleccion.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json');
  }

  function exportCsv() {
    const rows = [['id', 'nombre', 'periodo', 'municipio', 'provincia', 'fuente', 'latitud', 'longitud', 'url_fuente']];
    filteredRecords().forEach((record) => { const coord = recordCenter(record); rows.push([record.meta.code || record.meta.id, record.meta.name, record.meta.period, record.meta.municipality, record.meta.province, record.meta.source, coord?.[0] ?? '', coord?.[1] ?? '', record.meta.sourceUrl]); });
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    download('arqueo-atlas-inventario.csv', `\ufeff${csv}`, 'text/csv;charset=utf-8');
  }

  function exportReport() {
    const records = filteredRecords();
    const report = { generatedAt: new Date().toISOString(), tool: 'Arqueo Atlas', totalLoaded: state.records.length, totalExported: records.length, filters: { text: els.filterText.value, period: els.periodFilter.value, source: els.loadedSourceFilter.value }, sources: [...state.loadedSources.values()].map((source) => ({ id: source.id, label: source.label, publisher: source.publisher, format: source.format, urls: source.urls, catalogUrl: source.catalogUrl, license: source.license, notes: source.notes, recordsLoaded: state.records.filter((record) => record.meta.sourceId === source.id).length })) };
    download('arqueo-atlas-procedencia.json', JSON.stringify(report, null, 2), 'application/json');
  }

  function clearAll() {
    state.records = []; state.loadedSources.clear(); state.selectedId = null; state.photoCache.clear(); state.layer?.remove(); state.layer = null; els.detailPanel.hidden = true; els.resultTable.innerHTML = '<tr><td colspan="5">Todavía no hay registros.</td></tr>'; els.resultHint.textContent = 'Carga una fuente pública o una capa local.'; renderFilters(); renderStats([]); map.setView([40.25, -3.7], 5); setStatus('Sin capas cargadas');
  }

  function init() {
    SOURCES.forEach((source) => els.sourceSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(source.id)}">${escapeHtml(source.label)}</option>`));
    sourceDescription(SOURCES[0]);
    els.sourceSelect.addEventListener('change', () => sourceDescription(sourceById(els.sourceSelect.value)));
    els.loadSourceBtn.addEventListener('click', () => loadSource(sourceById(els.sourceSelect.value)));
    els.exampleBtn.addEventListener('click', () => { addPayload(DEMO, { id: 'demo', label: 'Ejemplo didáctico local', publisher: 'Arqueo Atlas', format: 'GeoJSON', urls: [], catalogUrl: '', license: 'Datos sintéticos', notes: 'Registros ficticios para comprobar la herramienta.' }); });
    els.fileInput.addEventListener('change', () => { const [file] = els.fileInput.files || []; if (file) loadFile(file); els.fileInput.value = ''; });
    els.customLoadBtn.addEventListener('click', () => { const url = els.customUrl.value.trim(); if (!/^https?:\/\//i.test(url)) { setStatus('Introduce una URL HTTP(S) válida.', 'error'); return; } loadSource(sourceForCustom(els.customName.value.trim(), url)); });
    [els.filterText, els.periodFilter, els.loadedSourceFilter].forEach((element) => element.addEventListener('input', render));
    els.resultTable.addEventListener('click', (event) => { const button = event.target.closest('[data-record-id]'); if (button) selectRecord(button.dataset.recordId, true); });
    els.closeDetailBtn.addEventListener('click', () => { els.detailPanel.hidden = true; state.selectedId = null; });
    els.photoBtn.addEventListener('click', searchPhotos);
    els.exportGeoBtn.addEventListener('click', exportFeatures); els.exportCsvBtn.addEventListener('click', exportCsv); els.exportReportBtn.addEventListener('click', exportReport); els.clearBtn.addEventListener('click', clearAll);
    initMap(); render();
  }

  init();
})();
