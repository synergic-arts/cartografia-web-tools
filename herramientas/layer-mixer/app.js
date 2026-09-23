(() => {
  const map = L.map('map', { zoomControl: true, preferCanvas: false }).setView([40.32, -3.7], 6);
  const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const catalog = [
    {
      id: 'scuam-lopez-1773', label: 'SCUAM · Tomás López 1773', short: 'Atlas histórico WMS',
      service: 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', layer: 'ATLopez_Madrid_1773_lam1_UAM',
      format: 'image/png', transparent: true, attribution: 'SCUAM / UAM'
    },
    {
      id: 'ign-pnoa', label: 'IGN · PNOA actual', short: 'Ortoimagen nacional WMS',
      service: 'https://www.ign.es/wms-inspire/pnoa-ma', layer: 'OI.OrthoimageCoverage',
      format: 'image/jpeg', transparent: false, attribution: 'PNOA / IGN'
    },
  ];

  const state = { layers: [], swipeEnabled: false, swipeLayerId: '', swipePosition: 50 };
  const els = {
    catalog: document.getElementById('catalog'), layersList: document.getElementById('layersList'), layerCount: document.getElementById('layerCount'),
    status: document.getElementById('status'), mapStatus: document.getElementById('mapStatus'), swipeEnabled: document.getElementById('swipeEnabled'),
    swipeLayer: document.getElementById('swipeLayer'), swipeRange: document.getElementById('swipeRange'), swipeOutput: document.getElementById('swipeOutput'),
    swipeLine: document.getElementById('swipeLine'), downloadBtn: document.getElementById('downloadBtn'), customForm: document.getElementById('customForm'),
    serviceInput: document.getElementById('serviceInput'), wmsLayerInput: document.getElementById('wmsLayerInput'), wmsLabelInput: document.getElementById('wmsLabelInput')
  };

  function setStatus(message, error = false) {
    els.status.textContent = message;
    els.status.classList.toggle('error', error);
  }

  function findLayer(id) { return state.layers.find((item) => item.id === id); }

  function makeWmsLayer(config) {
    return L.tileLayer.wms(config.service, {
      layers: config.layer,
      format: config.format || 'image/png',
      transparent: config.transparent !== false,
      version: '1.3.0',
      opacity: config.opacity ?? .78,
      attribution: config.attribution || 'Servicio WMS público',
      zIndex: 420
    });
  }

  function addLayer(config) {
    const existing = findLayer(config.id);
    if (existing) {
      if (!map.hasLayer(existing.layer)) existing.layer.addTo(map);
      existing.visible = true;
      render();
      setStatus(`La capa «${existing.label}» ya estaba en la lista y vuelve a estar visible.`);
      return existing;
    }
    const layer = makeWmsLayer(config);
    const item = { id: config.id, label: config.label, service: config.service, layerName: config.layer, attribution: config.attribution || '', layer, opacity: config.opacity ?? .78, visible: true, custom: Boolean(config.custom), loaded: false, errorTimer: null };
    layer.setOpacity(item.opacity);
    const markLoaded = () => { item.loaded = true; if (item.errorTimer) window.clearTimeout(item.errorTimer); els.mapStatus.textContent = `${state.layers.length} capa${state.layers.length === 1 ? '' : 's'} activa${state.layers.length === 1 ? '' : 's'}.`; };
    layer.on('loading', () => { els.mapStatus.textContent = `Cargando ${item.label}…`; });
    layer.on('tileload load', markLoaded);
    layer.on('tileerror', () => {
      if (item.loaded || item.errorTimer) return;
      item.errorTimer = window.setTimeout(() => {
        if (!item.loaded) setStatus(`El servicio no ha entregado imágenes para «${item.label}» en esta vista. Prueba otra escala o revisa el nombre de capa.`, true);
      }, 2800);
    });
    item.layer.addTo(map);
    state.layers.push(item);
    updateZIndexes();
    render();
    setStatus(`Añadida «${item.label}». Puedes ajustar su opacidad o usar la cortina.`);
    return item;
  }

  function removeLayer(id) {
    const index = state.layers.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [item] = state.layers.splice(index, 1);
    item.layer.remove();
    if (state.swipeLayerId === id) state.swipeLayerId = state.layers[0]?.id || '';
    updateZIndexes();
    render();
    setStatus(`Retirada «${item.label}».`);
  }

  function toggleLayer(id, visible) {
    const item = findLayer(id);
    if (!item) return;
    item.visible = visible;
    if (visible) item.layer.addTo(map); else item.layer.remove();
    applySwipe();
    render();
    setStatus(`${visible ? 'Visible' : 'Oculta'}: «${item.label}».`);
  }

  function updateOpacity(id, value) {
    const item = findLayer(id);
    if (!item) return;
    item.opacity = Number(value);
    item.layer.setOpacity(item.opacity);
    const output = document.querySelector(`[data-opacity-output="${CSS.escape(id)}"]`);
    if (output) output.textContent = `${Math.round(item.opacity * 100)}%`;
  }

  function moveLayer(id, direction) {
    const index = state.layers.findIndex((item) => item.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= state.layers.length) return;
    [state.layers[index], state.layers[next]] = [state.layers[next], state.layers[index]];
    updateZIndexes();
    render();
    setStatus('Orden de dibujo actualizado.');
  }

  function updateZIndexes() {
    state.layers.forEach((item, index) => item.layer.setZIndex(420 + index));
  }

  function applySwipe() {
    const position = state.swipePosition;
    const selectedId = state.swipeLayerId;
    state.layers.forEach((item) => {
      const container = item.layer.getContainer?.();
      if (!container) return;
      const active = state.swipeEnabled && item.id === selectedId && item.visible;
      container.style.clipPath = active ? `inset(0 0 0 ${position}%)` : '';
    });
    els.swipeLine.hidden = !(state.swipeEnabled && selectedId && findLayer(selectedId)?.visible);
    els.swipeLine.style.left = `${position}%`;
  }

  function updateSwipeOptions() {
    const current = state.swipeLayerId;
    els.swipeLayer.replaceChildren();
    if (!state.layers.length) {
      const option = document.createElement('option'); option.value = ''; option.textContent = 'Añade una capa primero'; els.swipeLayer.appendChild(option);
      state.swipeLayerId = '';
    } else {
      state.layers.forEach((item) => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; els.swipeLayer.appendChild(option); });
      state.swipeLayerId = state.layers.some((item) => item.id === current) ? current : state.layers[state.layers.length - 1].id;
      els.swipeLayer.value = state.swipeLayerId;
    }
    applySwipe();
  }

  function renderCatalog() {
    els.catalog.replaceChildren();
    catalog.forEach((config) => {
      const wrapper = document.createElement('div'); wrapper.className = `catalog-item${findLayer(config.id) ? ' is-added' : ''}`;
      const text = document.createElement('div'); const title = document.createElement('b'); title.textContent = config.label; const detail = document.createElement('small'); detail.textContent = config.short; text.append(title, detail);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'small'; button.textContent = findLayer(config.id) ? 'Mostrar' : 'Añadir'; button.addEventListener('click', () => addLayer(config));
      wrapper.append(text, button); els.catalog.appendChild(wrapper);
    });
  }

  function renderLayers() {
    els.layersList.replaceChildren();
    if (!state.layers.length) { const empty = document.createElement('div'); empty.className = 'empty-card'; empty.textContent = 'Todavía no hay capas añadidas.'; els.layersList.appendChild(empty); }
    state.layers.forEach((item, index) => {
      const row = document.createElement('div'); row.className = 'layer-row';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = item.visible; checkbox.title = `Visibilidad de ${item.label}`; checkbox.addEventListener('change', () => toggleLayer(item.id, checkbox.checked));
      const name = document.createElement('div'); name.className = 'layer-name'; const title = document.createElement('b'); title.textContent = item.label; const detail = document.createElement('small'); detail.textContent = item.layerName; name.append(title, detail);
      const opacity = document.createElement('label'); opacity.className = 'opacity'; opacity.innerHTML = '<span>Opacidad</span>'; const range = document.createElement('input'); range.type = 'range'; range.min = '0'; range.max = '1'; range.step = '.01'; range.value = item.opacity; range.setAttribute('aria-label', `Opacidad de ${item.label}`); const output = document.createElement('output'); output.dataset.opacityOutput = item.id; output.textContent = `${Math.round(item.opacity * 100)}%`; opacity.append(range, output); range.addEventListener('input', () => updateOpacity(item.id, range.value));
      const actions = document.createElement('div'); actions.className = 'row-actions';
      [['↑', 'Subir', -1], ['↓', 'Bajar', 1], ['×', 'Quitar', null]].forEach(([label, titleText, direction]) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'small'; button.textContent = label; button.title = titleText; button.addEventListener('click', () => direction === null ? removeLayer(item.id) : moveLayer(item.id, direction)); actions.appendChild(button); });
      if (index === 0) actions.children[0].disabled = true; if (index === state.layers.length - 1) actions.children[1].disabled = true;
      row.append(checkbox, name, opacity, actions); els.layersList.appendChild(row);
    });
  }

  function render() {
    els.layerCount.textContent = `${state.layers.length} capa${state.layers.length === 1 ? '' : 's'}`;
    els.downloadBtn.disabled = !state.layers.length;
    renderCatalog(); renderLayers(); updateSwipeOptions();
  }

  els.customForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const service = els.serviceInput.value.trim(); const layerName = els.wmsLayerInput.value.trim();
    try { const url = new URL(service); if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol'); } catch { setStatus('Escribe una URL WMS válida que empiece por http:// o https://.', true); return; }
    const label = els.wmsLabelInput.value.trim() || layerName;
    addLayer({ id: `custom-${Date.now()}`, label, layer: layerName, service, format: 'image/png', transparent: true, custom: true, attribution: 'WMS indicado por el usuario' });
    els.customForm.reset();
  });
  els.swipeEnabled.addEventListener('change', () => { state.swipeEnabled = els.swipeEnabled.checked; applySwipe(); });
  els.swipeLayer.addEventListener('change', () => { state.swipeLayerId = els.swipeLayer.value; applySwipe(); });
  els.swipeRange.addEventListener('input', () => { state.swipePosition = Number(els.swipeRange.value); els.swipeOutput.textContent = `${state.swipePosition}%`; applySwipe(); });
  document.getElementById('fitSpainBtn').addEventListener('click', () => map.fitBounds([[35.95, -9.4], [43.9, 4.5]], { padding: [20, 20] }));
  document.getElementById('clearBtn').addEventListener('click', () => { [...state.layers].forEach((item) => item.layer.remove()); state.layers = []; state.swipeLayerId = ''; render(); setStatus('Todas las capas superpuestas se han retirado.'); });
  els.downloadBtn.addEventListener('click', () => {
    const payload = { generatedAt: new Date().toISOString(), center: map.getCenter(), zoom: map.getZoom(), layers: state.layers.map(({ id, label, service, layerName, opacity, visible, attribution }) => ({ id, label, service, layer: layerName, opacity, visible, attribution })) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'layer-mixer-configuracion.json'; link.click(); URL.revokeObjectURL(url); setStatus('Configuración descargada.');
  });

  CartografiaPlaceSearch(map, { input: document.getElementById('placeQuery'), button: document.getElementById('placeSearchButton'), results: document.getElementById('placeResults'), status: document.getElementById('placeStatus'), zoom: 13 });
  render();
})();
