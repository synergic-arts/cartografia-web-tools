/* Shared client-side place search for the Leaflet tools in this repository. */
(() => {
  const STYLE_ID = 'cartografia-place-search-styles';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cartografia-place-search { position: relative; display: flex; align-items: center; gap: 6px; min-width: 0; }
      .cartografia-place-search label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .cartografia-place-search input { min-width: 0; flex: 1 1 170px; width: 100%; min-height: 35px; padding: 7px 10px; border: 1px solid var(--line, var(--border, #cbd5e1)); border-radius: 8px; background: var(--bg, #fff); color: var(--text, #172033); font: inherit; }
      .cartografia-place-search input:focus { outline: 2px solid var(--accent, #1768e5); outline-offset: 1px; }
      .cartografia-place-search > button { min-height: 35px; padding: 7px 11px; border: 1px solid var(--line, var(--border, #cbd5e1)); border-radius: 8px; background: var(--accent, #1768e5); color: var(--bg, #fff); font: inherit; font-size: .8rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
      .cartografia-place-search > button:disabled { opacity: .55; cursor: wait; }
      .cartografia-place-results { position: absolute; z-index: 2000; top: calc(100% + 5px); left: 0; right: 0; min-width: 260px; max-height: 260px; overflow: auto; padding: 4px; border: 1px solid var(--line, var(--border, #cbd5e1)); border-radius: 10px; background: var(--panel, #fff); box-shadow: 0 10px 24px rgba(0,0,0,.25); }
      .cartografia-place-result { display: block; width: 100%; padding: 8px 9px; border: 0; border-radius: 7px; background: transparent; color: var(--text, #172033); text-align: left; font: inherit; font-size: .78rem; line-height: 1.3; cursor: pointer; }
      .cartografia-place-result:hover, .cartografia-place-result:focus-visible { background: var(--accent-soft, rgba(23,104,229,.14)); outline: none; }
      .cartografia-place-status { position: absolute; top: calc(100% + 7px); left: 2px; margin: 0; color: var(--muted, #6c7586); font-size: .72rem; pointer-events: none; white-space: nowrap; }
      .cartografia-place-search.has-results .cartografia-place-status { display: none; }
      .map-place-search { position: absolute; z-index: 700; top: 12px; left: 58px; right: 12px; max-width: 430px; }
      .map-toolbar .cartografia-place-search { flex: 1 1 300px; max-width: 430px; }
      .map-head .cartografia-place-search { flex: 0 1 430px; width: min(430px, 52%); }
      @media (max-width: 620px) {
        .map-head .cartografia-place-search { width: 100%; max-width: none; }
        .map-place-search { left: 52px; right: 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function createPlaceSearch(map, options = {}) {
    installStyles();
    const input = options.input;
    const button = options.button;
    const results = options.results;
    const status = options.status;
    if (!map || !input || !button || !results || !status) return null;

    let marker = null;
    let controller = null;
    const zoom = Number.isFinite(options.zoom) ? options.zoom : 12;
    const setStatus = (message) => { status.textContent = message; };
    const clearResults = () => {
      results.replaceChildren();
      results.hidden = true;
      results.parentElement?.classList.remove('has-results');
    };

    const locate = (item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const latlng = L.latLng(lat, lng);
      map.setView(latlng, Math.max(map.getZoom(), zoom), { animate: true });
      if (typeof options.onLocate === 'function') {
        options.onLocate({ lat, lng, latlng, displayName: item.display_name || 'Lugar localizado', item });
      } else {
        marker?.remove();
        marker = L.circleMarker(latlng, {
          radius: 8,
          weight: 3,
          color: '#172033',
          fillColor: '#ffbf69',
          fillOpacity: 1,
          pane: options.pane
        }).addTo(map);
        marker.bindPopup(`<strong>${escapeHtml(item.display_name || 'Lugar localizado')}</strong>`).openPopup();
      }
      clearResults();
      setStatus(`Centrado en ${item.display_name || 'el lugar seleccionado'}.`);
    };

    const renderResults = (items) => {
      results.replaceChildren();
      if (!items.length) {
        results.hidden = true;
        results.parentElement?.classList.remove('has-results');
        setStatus('No se encontraron lugares con ese texto.');
        return;
      }
      items.forEach((item) => {
        const result = document.createElement('button');
        result.type = 'button';
        result.className = 'cartografia-place-result';
        result.setAttribute('role', 'option');
        result.textContent = item.display_name || 'Lugar sin nombre';
        result.addEventListener('click', () => locate(item));
        results.appendChild(result);
      });
      results.hidden = false;
      results.parentElement?.classList.add('has-results');
      setStatus(`${items.length} resultado${items.length === 1 ? '' : 's'}; elige uno.`);
    };

    const search = async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        clearResults();
        setStatus('Escribe al menos 2 caracteres.');
        input.focus();
        return;
      }
      controller?.abort();
      controller = new AbortController();
      button.disabled = true;
      clearResults();
      setStatus('Buscando lugar…');
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.search = new URLSearchParams({ format: 'jsonv2', limit: '5', 'accept-language': 'es', q: query });
        const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        renderResults(await response.json());
      } catch (error) {
        if (error.name === 'AbortError') return;
        clearResults();
        setStatus('No se pudo consultar el buscador. Revisa la conexión e inténtalo de nuevo.');
      } finally {
        button.disabled = false;
      }
    };

    button.addEventListener('click', search);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); search(); }
      if (event.key === 'Escape') clearResults();
    });
    input.addEventListener('input', () => {
      if (!input.value.trim()) { clearResults(); setStatus('Busca un topónimo para centrar el mapa.'); }
    });
    return { search, clear: clearResults, locate };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  window.CartografiaPlaceSearch = createPlaceSearch;
})();
