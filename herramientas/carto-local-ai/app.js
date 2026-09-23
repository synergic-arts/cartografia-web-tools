(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  const els = {
    runtimeBadge: $('runtimeBadge'), modelSelect: $('modelSelect'), prepareAiBtn: $('prepareAiBtn'), stopAiBtn: $('stopAiBtn'),
    modelProgress: $('modelProgress'), engineStatus: $('engineStatus'), fileInput: $('fileInput'), exampleBtn: $('exampleBtn'),
    clearBtn: $('clearBtn'), geojsonInput: $('geojsonInput'), loadTextBtn: $('loadTextBtn'), dataStatus: $('dataStatus'),
    taskSelect: $('taskSelect'), askBtn: $('askBtn'), mapStatus: $('mapStatus'), contextCards: $('contextCards'),
    answerMode: $('answerMode'), answerOutput: $('answerOutput'), copyBtn: $('copyBtn'), downloadBtn: $('downloadBtn'),
    placeQuery: $('placeQuery'), placeSearchButton: $('placeSearchButton'), placeResults: $('placeResults'), placeStatus: $('placeStatus')
  };
  const state = { map: null, layer: null, data: null, summary: null, engine: null, webllm: null, webgpu: false, searchPlace: null, report: '' };

  const exampleGeoJSON = {
    type: 'FeatureCollection',
    name: 'ejemplo-cartografia-local',
    features: [
      { type: 'Feature', properties: { name: 'Área de estudio', uso: 'muestra', fecha: 1853 }, geometry: { type: 'Polygon', coordinates: [[[-3.74, 40.40], [-3.66, 40.40], [-3.66, 40.45], [-3.74, 40.45], [-3.74, 40.40]]] } },
      { type: 'Feature', properties: { name: 'Punto de control', categoria: 'histórico', fecha: 1773 }, geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] } },
      { type: 'Feature', properties: { name: 'Eje de observación', categoria: 'lineal' }, geometry: { type: 'LineString', coordinates: [[-3.74, 40.405], [-3.70, 40.43], [-3.66, 40.445]] } }
    ]
  };

  function asFeatureCollection(value) {
    if (!value || typeof value !== 'object') throw new Error('El JSON está vacío o no es un objeto.');
    if (value.type === 'FeatureCollection' && Array.isArray(value.features)) return value;
    if (value.type === 'Feature') return { type: 'FeatureCollection', features: [value] };
    if (typeof value.type === 'string' && Array.isArray(value.coordinates)) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: value }] };
    throw new Error('Se esperaba un FeatureCollection, Feature o geometría GeoJSON.');
  }

  function walkCoordinates(value, output = []) {
    if (!Array.isArray(value)) return output;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') output.push(value);
    else value.forEach((child) => walkCoordinates(child, output));
    return output;
  }

  function finiteCoordinate(coord) {
    return Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]);
  }

  function inspectGeoJSON(data) {
    const features = data.features;
    const coordinates = [];
    let invalidCoordinates = 0;
    let nullGeometry = 0;
    const geometryTypes = {};
    const propertyCounts = {};
    const names = [];
    const samples = [];

    features.forEach((feature) => {
      const geometry = feature?.geometry;
      const type = geometry?.type || 'Sin geometría';
      geometryTypes[type] = (geometryTypes[type] || 0) + 1;
      if (!geometry) nullGeometry++;
      const rawCoordinates = walkCoordinates(geometry?.coordinates);
      rawCoordinates.forEach((coord) => {
        if (finiteCoordinate(coord)) coordinates.push(coord);
        else invalidCoordinates++;
      });
      const properties = feature?.properties && typeof feature.properties === 'object' ? feature.properties : {};
      const cleanSample = {};
      Object.entries(properties).slice(0, 8).forEach(([key, value]) => {
        propertyCounts[key] = (propertyCounts[key] || 0) + 1;
        cleanSample[key] = String(value ?? '').slice(0, 90);
      });
      if (Object.keys(cleanSample).length) samples.push(cleanSample);
      const name = properties.name ?? properties.nombre ?? properties.title ?? properties.id;
      if (name !== undefined && names.length < 8) names.push(String(name));
    });

    const lons = coordinates.map((coord) => coord[0]);
    const lats = coordinates.map((coord) => coord[1]);
    const bbox = coordinates.length ? [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)] : null;
    const keys = Object.entries(propertyCounts).sort((a, b) => b[1] - a[1]).map(([key]) => key);
    return {
      featureCount: features.length,
      geometryTypes,
      geometryLabel: Object.entries(geometryTypes).map(([type, count]) => `${type} (${count})`).join(', ') || 'sin geometrías',
      vertexCount: coordinates.length,
      bbox,
      propertyKeys: keys,
      propertyCount: keys.length,
      nullGeometry,
      invalidCoordinates,
      names,
      samples: samples.slice(0, 3)
    };
  }

  function formatBbox(bbox) {
    if (!bbox) return 'No calculable';
    return `O ${bbox[0].toFixed(5)} · S ${bbox[1].toFixed(5)} · E ${bbox[2].toFixed(5)} · N ${bbox[3].toFixed(5)}`;
  }

  function buildContext() {
    const s = state.summary;
    return [
      `Entidades: ${s.featureCount}`,
      `Geometrías: ${s.geometryLabel}`,
      `Vértices/coordenadas válidas: ${s.vertexCount}`,
      `Extensión (longitud/latitud): ${formatBbox(s.bbox)}`,
      `Campos de atributos (${s.propertyCount}): ${s.propertyKeys.slice(0, 20).join(', ') || 'ninguno'}`,
      `Geometrías sin datos: ${s.nullGeometry}; coordenadas inválidas: ${s.invalidCoordinates}`,
      `Nombres detectados: ${s.names.join(' | ') || 'ninguno'}`,
      `Muestra limitada de atributos: ${JSON.stringify(s.samples)}`,
      state.searchPlace ? `Lugar localizado en el mapa: ${state.searchPlace.displayName}` : 'No se ha indicado un lugar de referencia.'
    ].join('\n');
  }

  function taskLabel() {
    return els.taskSelect.options[els.taskSelect.selectedIndex]?.textContent || 'Resumen territorial';
  }

  function quickReport() {
    const s = state.summary;
    const task = els.taskSelect.value;
    const lines = [`# ${taskLabel()}`, '', `La capa contiene **${s.featureCount} entidades** y ${s.geometryLabel}.`, `Extensión aproximada: ${formatBbox(s.bbox)}.`, `Se han recorrido ${s.vertexCount} coordenadas válidas y se han detectado ${s.propertyCount} campos: ${s.propertyKeys.slice(0, 12).join(', ') || 'ninguno'}.`];
    if (task === 'quality') {
      lines.push('', '## Control de calidad', `- Geometrías sin datos: ${s.nullGeometry}.`, `- Coordenadas inválidas o incompletas: ${s.invalidCoordinates}.`, s.bbox ? '- La extensión es calculable y parece estar expresada en longitud/latitud.' : '- No hay coordenadas suficientes para calcular la extensión.', '- Comprueba el CRS y que el orden sea [longitud, latitud] antes de medir distancias.');
    } else if (task === 'sampling') {
      lines.push('', '## Propuesta inicial de muestreo', '- Divide la extensión en una cuadrícula regular y conserva un identificador único por celda.', '- Revisa la distribución espacial de los puntos o polígonos para evitar zonas sin cobertura.', '- Exporta después a un sistema proyectado si necesitas distancias o superficies comparables.', '- Documenta fecha, fuente, resolución y criterio de selección de cada muestra.');
    } else if (task === 'historical') {
      lines.push('', '## Lectura para un estudio histórico', `- Los campos disponibles (${s.propertyKeys.slice(0, 8).join(', ') || 'sin atributos'}) pueden servir para agrupar entidades por fecha, nombre o categoría.`, '- Contrasta los topónimos con la fuente original y conserva la grafía histórica como atributo separado.', '- Registra escala, fecha, procedencia y transformaciones aplicadas antes de comparar con una base actual.', '- La extensión es una ayuda de localización; no demuestra por sí sola continuidad territorial.');
    } else if (task === 'metadata') {
      lines.push('', '## Metadatos que conviene completar', '- Fuente y autoría de la capa.', '- Fecha de captura o digitalización y escala/resolución.', '- Sistema de referencia y precisión posicional.', '- Tratamiento de duplicados, geometrías nulas y valores ausentes.', '- Licencia y restricciones de reutilización.');
    } else {
      lines.push('', '## Lectura rápida', `- Tipos geométricos predominantes: ${s.geometryLabel}.`, `- Campos más frecuentes: ${s.propertyKeys.slice(0, 8).join(', ') || 'ninguno'}.`, s.names.length ? `- Algunos nombres detectados: ${s.names.slice(0, 5).join(', ')}.` : '- No se detectaron campos habituales de nombre.', '- Usa el buscador del mapa para contrastar rápidamente la localización de un topónimo.');
    }
    lines.push('', '_Informe generado localmente; verifica las conclusiones con la fuente y el CRS de la capa._');
    return lines.join('\n');
  }

  function showReport(text, mode = 'Modo rápido') {
    state.report = text;
    els.answerOutput.textContent = text;
    els.answerMode.textContent = mode;
    els.copyBtn.disabled = !text;
    els.downloadBtn.disabled = !text;
  }

  function renderContext() {
    const s = state.summary;
    const cards = [
      ['Entidades', s.featureCount], ['Geometrías', s.geometryLabel], ['Vértices', s.vertexCount], ['Extensión', s.bbox ? `${(s.bbox[2] - s.bbox[0]).toFixed(3)}° × ${(s.bbox[3] - s.bbox[1]).toFixed(3)}°` : '—'], ['Campos', s.propertyCount], ['Incidencias', s.nullGeometry + s.invalidCoordinates]
    ];
    els.contextCards.replaceChildren(...cards.map(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'context-card';
      const name = document.createElement('span'); name.textContent = label;
      const content = document.createElement('b'); content.textContent = String(value);
      card.append(name, content); return card;
    }));
  }

  function renderMap() {
    if (!state.map || !state.data) return;
    state.layer?.remove();
    state.layer = L.geoJSON(state.data, {
      style: () => ({ color: '#5bd6a5', weight: 2, fillColor: '#5bd6a5', fillOpacity: .14 }),
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 7, color: '#172033', weight: 2, fillColor: '#ffbf69', fillOpacity: .95 }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const label = props.name ?? props.nombre ?? props.title ?? props.id;
        if (label !== undefined) layer.bindTooltip(String(label).slice(0, 100));
      }
    }).addTo(state.map);
    const bounds = state.layer.getBounds();
    if (bounds.isValid()) state.map.fitBounds(bounds.pad(.12));
    els.mapStatus.textContent = `${state.summary.featureCount} entidades visibles.`;
  }

  function loadGeoJSON(value, source = 'texto') {
    try {
      const normalized = asFeatureCollection(value);
      state.data = normalized;
      state.summary = inspectGeoJSON(normalized);
      renderContext();
      renderMap();
      els.dataStatus.textContent = `Capa lista: ${state.summary.featureCount} entidades · fuente ${source}.`;
      els.dataStatus.classList.remove('error');
      els.askBtn.disabled = false;
      showReport('Capa lista. Elige un tipo de diagnóstico y pulsa «Generar diagnóstico».', 'Modo rápido');
    } catch (error) {
      els.dataStatus.textContent = `No se pudo analizar el GeoJSON: ${error.message}`;
      els.dataStatus.classList.add('error');
      els.askBtn.disabled = true;
    }
  }

  async function readFile(file) {
    try {
      loadGeoJSON(JSON.parse(await file.text()), file.name);
    } catch (error) {
      els.dataStatus.textContent = `No se pudo leer ${file.name}: ${error.message}`;
      els.dataStatus.classList.add('error');
    }
  }

  function aiPrompt() {
    return `Actúa como asistente de cartografía y datos geoespaciales. Responde en español, con precisión y sin inventar valores que no estén en el contexto. Señala las suposiciones, especialmente CRS, escala y calidad. Tarea solicitada: ${taskLabel()}. Contexto calculado localmente:\n${buildContext()}\n\nRedacta una respuesta breve con: lectura principal, evidencias del contexto, advertencias y tres próximos pasos prácticos.`;
  }

  async function runLocalAI() {
    els.askBtn.disabled = true;
    els.copyBtn.disabled = true;
    els.downloadBtn.disabled = true;
    els.answerMode.textContent = 'WebLLM local';
    els.answerOutput.textContent = '';
    try {
      const response = await state.engine.chat.completions.create({ model: MODEL_ID, messages: [{ role: 'system', content: 'Eres un asistente cartográfico prudente y verificable.' }, { role: 'user', content: aiPrompt() }], temperature: .2, max_tokens: 520, stream: true });
      let text = '';
      for await (const chunk of response) {
        const delta = chunk?.choices?.[0]?.delta?.content || '';
        text += delta;
        els.answerOutput.textContent = text;
      }
      showReport(text || 'El modelo no devolvió texto. Prueba el modo rápido.', 'WebLLM local');
    } catch (error) {
      els.engineStatus.textContent = `La IA local falló; se muestra el análisis rápido: ${error.message}`;
      showReport(quickReport(), 'Modo rápido · recuperación');
    } finally {
      els.askBtn.disabled = !state.data;
    }
  }

  async function prepareAI() {
    if (!state.webgpu) {
      els.engineStatus.textContent = 'WebGPU no está disponible; usa el modo rápido o prueba otro navegador compatible.';
      return;
    }
    els.prepareAiBtn.disabled = true;
    els.stopAiBtn.disabled = true;
    els.modelProgress.hidden = false;
    els.modelProgress.value = 0;
    els.engineStatus.textContent = 'Cargando el runtime de WebLLM…';
    try {
      state.webllm = await import('https://esm.run/@mlc-ai/web-llm');
      state.engine = await state.webllm.CreateMLCEngine(els.modelSelect.value, {
        initProgressCallback: (progress) => {
          const value = Number(progress?.progress);
          if (Number.isFinite(value)) els.modelProgress.value = value;
          els.engineStatus.textContent = progress?.text || 'Preparando el modelo local…';
        }
      });
      els.runtimeBadge.textContent = 'IA local lista';
      els.engineStatus.textContent = 'Modelo listo. El diagnóstico se ejecutará en este dispositivo.';
      els.stopAiBtn.disabled = false;
    } catch (error) {
      state.engine = null;
      els.engineStatus.textContent = `No se pudo preparar WebLLM: ${error.message}. El modo rápido sigue disponible.`;
      els.runtimeBadge.textContent = 'Modo rápido';
    } finally {
      els.prepareAiBtn.disabled = Boolean(state.engine);
    }
  }

  async function stopAI() {
    if (!state.engine) return;
    try { await state.engine.unload(); } catch (_) { /* El contexto se libera al cerrar la página. */ }
    state.engine = null;
    els.stopAiBtn.disabled = true;
    els.prepareAiBtn.disabled = !state.webgpu;
    els.runtimeBadge.textContent = state.webgpu ? 'WebGPU disponible' : 'Modo rápido';
    els.engineStatus.textContent = 'Modelo descargado de la memoria. Los datos siguen en el navegador.';
  }

  async function detectWebGPU() {
    if (!navigator.gpu) {
      els.runtimeBadge.textContent = 'WebGPU no disponible';
      els.engineStatus.textContent = 'El modo rápido está listo; WebLLM necesita WebGPU.';
      els.prepareAiBtn.disabled = true;
      return;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      state.webgpu = Boolean(adapter);
    } catch (_) { state.webgpu = false; }
    els.runtimeBadge.textContent = state.webgpu ? 'WebGPU disponible' : 'WebGPU no disponible';
    els.engineStatus.textContent = state.webgpu ? 'WebGPU detectado. Puedes preparar la IA local cuando quieras.' : 'El modo rápido está listo; no se detectó un adaptador WebGPU.';
    els.prepareAiBtn.disabled = !state.webgpu;
  }

  function clearData() {
    state.data = null; state.summary = null; state.layer?.remove(); state.layer = null; state.report = '';
    els.geojsonInput.value = ''; els.fileInput.value = ''; els.dataStatus.textContent = 'Aún no hay una capa cargada.'; els.dataStatus.classList.remove('error');
    els.askBtn.disabled = true; els.contextCards.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty-card', textContent: 'Carga una capa para ver sus métricas y comenzar.' }));
    showReport('El informe aparecerá aquí. El modo rápido es determinista y no necesita descargar modelos.', 'Modo rápido');
    els.mapStatus.textContent = 'Mapa base listo.';
  }

  function downloadReport() {
    const blob = new Blob([state.report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'diagnostico-cartografico.md'; link.click(); URL.revokeObjectURL(url);
  }

  function initMap() {
    if (!window.L) { els.mapStatus.textContent = 'Leaflet no está disponible; el análisis local sí puede funcionar.'; return; }
    state.map = L.map('map').setView([40.4, -3.7], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(state.map);
    CartografiaPlaceSearch(state.map, {
      input: els.placeQuery, button: els.placeSearchButton, results: els.placeResults, status: els.placeStatus,
      onLocate(place) { state.searchPlace = place; els.mapStatus.textContent = `Localizado: ${place.displayName}`; }
    });
  }

  els.fileInput.addEventListener('change', () => { if (els.fileInput.files[0]) readFile(els.fileInput.files[0]); });
  els.exampleBtn.addEventListener('click', () => { els.geojsonInput.value = JSON.stringify(exampleGeoJSON, null, 2); loadGeoJSON(exampleGeoJSON, 'ejemplo incluido'); });
  els.loadTextBtn.addEventListener('click', () => { try { loadGeoJSON(JSON.parse(els.geojsonInput.value), 'texto pegado'); } catch (error) { els.dataStatus.textContent = `JSON no válido: ${error.message}`; els.dataStatus.classList.add('error'); } });
  els.clearBtn.addEventListener('click', clearData);
  els.prepareAiBtn.addEventListener('click', prepareAI);
  els.stopAiBtn.addEventListener('click', stopAI);
  els.askBtn.addEventListener('click', () => state.engine ? runLocalAI() : showReport(quickReport(), 'Modo rápido'));
  els.copyBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(state.report); els.engineStatus.textContent = 'Informe copiado al portapapeles.'; } catch (_) { els.engineStatus.textContent = 'No se pudo copiar automáticamente; selecciona el texto del informe.'; } });
  els.downloadBtn.addEventListener('click', downloadReport);

  initMap();
  detectWebGPU();
})();
