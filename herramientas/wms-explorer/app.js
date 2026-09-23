(() => {
  const map = L.map('map').setView([40.32, -3.7], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  const state = { service: '', layers: [], selected: null, preview: null };
  const fallbacks = [
    {
      match: 'atlas_lopez_UAM_WMS',
      layers: [
        ['ATLopez_Madrid_1773_lam1_UAM', 'Madrid · Tomás López 1773'],
        ['ATLopez_Cuenca_1766_lam4_UAM', 'Cuenca · Tomás López 1766'],
        ['ATLopez_Guadalajara_1766_lam3_UAM', 'Guadalajara · Tomás López 1766'],
        ['1792_espanya_t_lopez_ETRS89_UTM30', 'España · Tomás López 1792']
      ]
    }
  ];
  const els = {
    service: document.getElementById('serviceInput'), inspect: document.getElementById('inspectBtn'), clear: document.getElementById('clearBtn'), status: document.getElementById('status'),
    select: document.getElementById('layerSelect'), meta: document.getElementById('layerMeta'), preview: document.getElementById('previewBtn'), download: document.getElementById('downloadBtn'), mapTitle: document.getElementById('mapTitle'), mapStatus: document.getElementById('mapStatus')
  };

  const setStatus = (text, error = false) => { els.status.textContent = text; els.status.classList.toggle('error', error); };
  const textOf = (node, tag) => node.querySelector(tag)?.textContent?.trim() || '';
  const normaliseService = () => { const url = new URL(els.service.value.trim()); if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol'); return url; };
  const fallbackFor = (service) => { const match = fallbacks.find((item) => service.toString().includes(item.match)); return match?.layers.map(([name, title]) => ({ name, title, abstract: 'Nombre de capa conocido para previsualización cuando el servicio no permite leer GetCapabilities desde otro origen.' })) || null; };

  function renderMeta() {
    const layer = state.layers.find((item) => item.name === state.selected);
    els.meta.replaceChildren();
    if (!layer) { const empty = document.createElement('span'); empty.className = 'meta-empty'; empty.textContent = 'La descripción de la capa aparecerá aquí.'; els.meta.appendChild(empty); els.preview.disabled = true; return; }
    const title = document.createElement('b'); title.textContent = layer.title || layer.name;
    const name = document.createElement('p'); name.textContent = `Nombre WMS: ${layer.name}`;
    const abstract = document.createElement('p'); abstract.textContent = layer.abstract || 'El servicio no ofrece un resumen para esta capa.';
    els.meta.append(title, name, abstract); els.preview.disabled = false;
  }

  function renderLayers() {
    els.select.replaceChildren();
    state.layers.forEach((layer) => { const option = document.createElement('option'); option.value = layer.name; option.textContent = layer.title && layer.title !== layer.name ? `${layer.title} · ${layer.name}` : layer.name; els.select.appendChild(option); });
    els.select.disabled = !state.layers.length; els.preview.disabled = !state.layers.length; els.download.disabled = !state.layers.length;
    state.selected = state.layers[0]?.name || null; if (state.selected) els.select.value = state.selected; renderMeta();
  }

  async function inspect() {
    let serviceUrl = null;
    try { serviceUrl = normaliseService(); const requestUrl = new URL(serviceUrl); requestUrl.searchParams.set('service', 'WMS'); requestUrl.searchParams.set('request', 'GetCapabilities'); requestUrl.searchParams.set('version', '1.3.0');
      els.inspect.disabled = true; setStatus('Consultando GetCapabilities…');
      const response = await fetch(requestUrl, { headers: { Accept: 'application/xml,text/xml' } }); if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = new DOMParser().parseFromString(await response.text(), 'text/xml'); if (xml.querySelector('parsererror')) throw new Error('XML no válido');
      const layers = [...xml.querySelectorAll('Layer')].map((node) => ({ name: textOf(node, 'Name'), title: textOf(node, 'Title'), abstract: textOf(node, 'Abstract') })).filter((layer, index, all) => layer.name && all.findIndex((item) => item.name === layer.name) === index);
      if (!layers.length) throw new Error('No se encontraron capas con nombre');
      state.service = serviceUrl.toString(); state.layers = layers; renderLayers(); setStatus(`${layers.length} capa${layers.length === 1 ? '' : 's'} descubierta${layers.length === 1 ? '' : 's'}. Selecciona una para previsualizar.`);
    } catch (error) {
      const fallback = serviceUrl ? fallbackFor(serviceUrl) : null;
      if (fallback) { state.service = serviceUrl.toString(); state.layers = fallback; renderLayers(); setStatus('El servicio bloquea GetCapabilities por CORS; se muestra un inventario conocido para poder previsualizar sus capas.', false); }
      else { state.layers = []; renderLayers(); setStatus(error.message === 'Failed to fetch' ? 'El navegador ha bloqueado la consulta CORS o el servicio no responde.' : `No se pudo leer el servicio: ${error.message}`, true); }
    }
    finally { els.inspect.disabled = false; }
  }

  function preview() {
    const layer = state.layers.find((item) => item.name === state.selected); if (!layer || !state.service) return;
    state.preview?.remove(); state.preview = L.tileLayer.wms(state.service, { layers: layer.name, format: 'image/png', transparent: true, version: '1.3.0', opacity: .82, attribution: layer.title || layer.name }).addTo(map);
    els.mapTitle.textContent = layer.title || layer.name; els.mapStatus.textContent = `Previsualizando ${layer.name}.`;
    state.preview.on('tileerror', () => { els.mapStatus.textContent = 'La capa no entrega teselas en esta vista o escala.'; });
  }

  els.inspect.addEventListener('click', inspect);
  els.select.addEventListener('change', () => { state.selected = els.select.value; renderMeta(); });
  els.preview.addEventListener('click', preview);
  els.clear.addEventListener('click', () => { state.layers = []; state.selected = null; state.preview?.remove(); state.preview = null; els.mapTitle.textContent = 'Mapa base'; els.mapStatus.textContent = 'Mapa base listo.'; renderLayers(); setStatus('Inventario limpiado.'); });
  document.querySelectorAll('[data-service]').forEach((button) => button.addEventListener('click', () => { els.service.value = button.dataset.service; inspect(); }));
  els.download.addEventListener('click', () => { const blob = new Blob([JSON.stringify({ service: state.service, checkedAt: new Date().toISOString(), layers: state.layers }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'wms-capabilities.json'; link.click(); URL.revokeObjectURL(url); setStatus('Inventario descargado.'); });
  CartografiaPlaceSearch(map, { input: document.getElementById('placeQuery'), button: document.getElementById('placeSearchButton'), results: document.getElementById('placeResults'), status: document.getElementById('placeStatus'), zoom: 13 });
})();
