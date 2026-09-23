(() => {
  const layers = [
    { name: 'Madrid · Coello 1853', service: 'https://guiadigital.uam.es/geoserver/Atlas_Coello_UAM_WMS/wms?', layer: 'Coello_prov_Madrid_1853' },
    { name: 'Soria · Coello 1860', service: 'https://guiadigital.uam.es/geoserver/Atlas_Coello_UAM_WMS/wms?', layer: 'Coello_prov_Soria_1860' },
    { name: 'Barcelona · Coello 1862', service: 'https://guiadigital.uam.es/geoserver/Atlas_Coello_UAM_WMS/wms?', layer: 'Coello_prov_Barcelona_1862' },
    { name: 'Cádiz · Coello 1868', service: 'https://guiadigital.uam.es/geoserver/Atlas_Coello_UAM_WMS/wms?', layer: 'Coello_prov_Cadiz_1868' },
    { name: 'Madrid · Tomás López', service: 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', layer: 'ATLopez_Madrid_1773_lam1_UAM' },
    { name: 'Cuenca · Tomás López', service: 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', layer: 'ATLopez_Cuenca_1766_lam4_UAM' },
    { name: 'Guadalajara · Tomás López', service: 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', layer: 'ATLopez_Guadalajara_1766_lam3_UAM' },
    { name: 'España · Tomás López', service: 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', layer: '1792_espanya_t_lopez_ETRS89_UTM30' }
  ];
  const a = document.getElementById('layerA');
  const b = document.getElementById('layerB');
  const status = document.getElementById('status');
  const mapPanel = document.getElementById('mapPanel');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const angleInput = document.getElementById('angleInput');
  const dial = document.getElementById('rotationDial');
  const orientationStatus = document.getElementById('orientationStatus');

  layers.forEach((item, i) => [a, b].forEach((select) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = item.name;
    select.append(option);
  }));
  a.value = '0';
  b.value = '4';

  const map = L.map('map', { zoomControl: true }).setView([40.4, -3.7], 6);
  const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  const paneA = map.createPane('historicalA');
  const paneB = map.createPane('historicalB');
  const tilePane = map.getPanes().tilePane;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const observedImages = new WeakSet();
  canvas.className = 'map-orientation-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '450';
  canvas.style.pointerEvents = 'none';
  map.getContainer().appendChild(canvas);
  tilePane.style.visibility = 'hidden';
  paneA.style.zIndex = 410;
  paneB.style.zIndex = 420;
  paneA.style.pointerEvents = 'none';
  paneB.style.pointerEvents = 'none';
  paneA.style.visibility = 'hidden';
  paneB.style.visibility = 'hidden';

  const orientation = { angle: 0, flipX: false, flipY: false };
  let wmsA = null;
  let wmsB = null;
  let searchPlace = null;

  const make = (item, opacity, pane) => L.tileLayer.wms(item.service, {
    layers: item.layer,
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    opacity,
    pane,
    attribution: '© SCUAM / UAM'
  });

  function queueDraw() {
    if (queueDraw.pending) return;
    queueDraw.pending = true;
    window.requestAnimationFrame(() => {
      queueDraw.pending = false;
      try {
        drawCanvas();
      } catch (error) {
        status.textContent = 'No se pudo redibujar la orientación del mapa en este navegador.';
      }
    });
  }

  function resizeCanvas() {
    const size = map.getSize();
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(size.x * devicePixelRatio));
    canvas.height = Math.max(1, Math.round(size.y * devicePixelRatio));
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    queueDraw();
  }

  function drawCanvas() {
    const size = map.getSize();
    const mapRect = map.getContainer().getBoundingClientRect();
    context.clearRect(0, 0, size.x, size.y);
    context.save();
    context.translate(size.x / 2, size.y / 2);
    context.rotate(orientation.angle * Math.PI / 180);
    context.scale(orientation.flipX ? -1 : 1, orientation.flipY ? -1 : 1);
    context.translate(-size.x / 2, -size.y / 2);
    const drawPane = (pane, opacity) => {
      if (!pane) return;
      context.globalAlpha = opacity;
      pane.querySelectorAll('img.leaflet-tile').forEach((image) => {
        if (!image.complete || !image.naturalWidth) return;
        if (!observedImages.has(image)) {
          observedImages.add(image);
          image.addEventListener('load', queueDraw, { once: true });
        }
        const rect = image.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          context.drawImage(image, rect.left - mapRect.left, rect.top - mapRect.top, rect.width, rect.height);
        }
      });
      context.globalAlpha = 1;
    };
    drawPane(tilePane, 1);
    drawPane(paneA, Number(document.getElementById('opacityA').value));
    drawPane(paneB, Number(document.getElementById('opacityB').value));
    if (searchPlace) {
      const point = map.latLngToContainerPoint(searchPlace.latlng);
      context.save();
      context.fillStyle = '#ffbf69';
      context.strokeStyle = '#09111e';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(point.x, point.y, 9, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(point.x, point.y + 7);
      context.lineTo(point.x, point.y + 18);
      context.stroke();
      context.restore();
    }
    context.restore();
  }

  const tileObserver = new MutationObserver(queueDraw);
  tileObserver.observe(map.getContainer(), { childList: true, subtree: true });
  map.on('resize', resizeCanvas);
  map.on('moveend zoomend', queueDraw);
  baseLayer.on('load tileload tileerror', queueDraw);
  resizeCanvas();
  CartografiaPlaceSearch(map, {
    input: document.getElementById('placeQuery'),
    button: document.getElementById('placeSearchButton'),
    results: document.getElementById('placeResults'),
    status: document.getElementById('placeStatus'),
    onLocate(place) {
      searchPlace = { latlng: place.latlng, displayName: place.displayName };
      queueDraw();
    }
  });

  function normalise(value) {
    let number = Number(value);
    if (!Number.isFinite(number)) number = 0;
    return ((number + 180) % 360 + 360) % 360 - 180;
  }

  function applyOrientation() {
    queueDraw();
  }

  function updateOrientationControls() {
    angleInput.value = orientation.angle;
    dial.style.setProperty('--angle', `${orientation.angle}deg`);
    dial.setAttribute('aria-valuenow', String(orientation.angle));
    dial.setAttribute('aria-valuetext', `${orientation.angle} grados`);
    const flips = [orientation.flipX ? 'volteo horizontal' : '', orientation.flipY ? 'volteo vertical' : ''].filter(Boolean).join(' + ');
    orientationStatus.textContent = `Mapa completo · ${orientation.angle}° · ${flips || 'sin volteo'}`;
  }

  function setAngle(value) {
    orientation.angle = normalise(value);
    applyOrientation();
    updateOrientationControls();
  }

  function toggleFlip(axis) {
    if (axis === 'x') orientation.flipX = !orientation.flipX;
    else orientation.flipY = !orientation.flipY;
    applyOrientation();
    updateOrientationControls();
  }

  function load() {
    if (wmsA) wmsA.remove();
    if (wmsB) wmsB.remove();
    const itemA = layers[Number(a.value)];
    const itemB = layers[Number(b.value)];
    wmsA = make(itemA, Number(document.getElementById('opacityA').value), 'historicalA').addTo(map);
    wmsB = make(itemB, Number(document.getElementById('opacityB').value), 'historicalB').addTo(map);
    wmsA.on('load tileload tileerror', queueDraw);
    wmsB.on('load tileload tileerror', queueDraw);
    applyOrientation();
    queueDraw();
    status.textContent = `Activas: ${itemA.name} + ${itemB.name}. La orientación se aplica al mapa base y a las capas históricas.`;
  }

  function dialAngle(event) {
    const rect = dial.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    return normalise(Math.atan2(x, -y) * 180 / Math.PI);
  }

  let dragging = false;
  dial.addEventListener('pointerdown', (event) => {
    dragging = true;
    dial.setPointerCapture?.(event.pointerId);
    setAngle(dialAngle(event));
  });
  dial.addEventListener('pointermove', (event) => {
    if (dragging) setAngle(dialAngle(event));
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => dial.addEventListener(type, () => {
    dragging = false;
  }));
  dial.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setAngle(orientation.angle - 5);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setAngle(orientation.angle + 5);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setAngle(0);
    }
  });

  angleInput.addEventListener('input', (event) => setAngle(event.target.value));
  document.getElementById('turnLeft').addEventListener('click', () => setAngle(orientation.angle - 90));
  document.getElementById('turnRight').addEventListener('click', () => setAngle(orientation.angle + 90));
  document.getElementById('resetOrientation').addEventListener('click', () => {
    orientation.flipX = false;
    orientation.flipY = false;
    setAngle(0);
  });
  document.getElementById('flipX').addEventListener('click', () => toggleFlip('x'));
  document.getElementById('flipY').addEventListener('click', () => toggleFlip('y'));

  function syncFullscreen() {
    const active = document.fullscreenElement === mapPanel;
    fullscreenBtn.textContent = active ? 'Salir de pantalla completa' : 'Pantalla completa';
    fullscreenBtn.setAttribute('aria-pressed', String(active));
    window.setTimeout(() => {
      map.invalidateSize({ pan: false });
      map.setView(map.getCenter(), map.getZoom(), { animate: false });
      resizeCanvas();
      queueDraw();
    }, 80);
  }

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === mapPanel) await document.exitFullscreen();
      else if (mapPanel.requestFullscreen) await mapPanel.requestFullscreen();
      else status.textContent = 'La pantalla completa no está disponible en este navegador.';
    } catch (error) {
      status.textContent = 'No se pudo activar la pantalla completa en este navegador.';
    }
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.getElementById('loadBtn').addEventListener('click', load);
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (wmsA) wmsA.remove();
    if (wmsB) wmsB.remove();
    status.textContent = 'Capas históricas retiradas; el mapa base sigue activo.';
  });
  document.getElementById('opacityA').addEventListener('input', (event) => wmsA?.setOpacity(Number(event.target.value)));
  document.getElementById('opacityB').addEventListener('input', (event) => wmsB?.setOpacity(Number(event.target.value)));

  updateOrientationControls();
  load();
})();
