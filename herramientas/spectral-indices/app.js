(() => {
  const definitions = {
    ndvi: { label: 'NDVI · vegetación', needs: ['nir', 'red'], formula: '(NIR − RED) / (NIR + RED)', calc: (b) => ratio(b.nir, b.red) },
    ndwi: { label: 'NDWI · agua', needs: ['green', 'nir'], formula: '(GREEN − NIR) / (GREEN + NIR)', calc: (b) => ratio(b.green, b.nir) },
    ndbi: { label: 'NDBI · construido', needs: ['swir', 'nir'], formula: '(SWIR − NIR) / (SWIR + NIR)', calc: (b) => ratio(b.swir, b.nir) },
    gndvi: { label: 'GNDVI · clorofila', needs: ['nir', 'green'], formula: '(NIR − GREEN) / (NIR + GREEN)', calc: (b) => ratio(b.nir, b.green) },
    savi: { label: 'SAVI · vegetación ajustada', needs: ['nir', 'red'], formula: '1,5 × (NIR − RED) / (NIR + RED + 0,5)', calc: (b) => { const den = b.nir + b.red + .5; return den ? 1.5 * (b.nir - b.red) / den : null; } }
  };
  const state = { files: {}, examples: {}, result: null };
  const els = { index: document.getElementById('indexSelect'), requirements: document.getElementById('requirements'), formula: document.getElementById('formula'), run: document.getElementById('runBtn'), status: document.getElementById('status'), bandStatus: document.getElementById('bandStatus'), canvas: document.getElementById('canvas'), stats: document.getElementById('stats'), resultTitle: document.getElementById('resultTitle'), sourceBadge: document.getElementById('sourceBadge'), downloadPng: document.getElementById('downloadPng'), downloadJson: document.getElementById('downloadJson') };
  const keys = ['red', 'green', 'nir', 'swir'];

  function ratio(a, b) { const den = a + b; return den > .0001 ? (a - b) / den : null; }
  function updateDefinition() { const definition = definitions[els.index.value]; els.requirements.textContent = `Necesita: ${definition.needs.map((key) => key.toUpperCase()).join(' + ')}`; els.formula.textContent = definition.formula; }
  function setStatus(text, error = false) { els.status.textContent = text; els.status.classList.toggle('error', error); }
  function formatBandStatus() { const present = keys.filter((key) => state.files[key] || state.examples[key]); els.bandStatus.textContent = present.length ? `Bandas disponibles: ${present.map((key) => key.toUpperCase()).join(', ')}.` : 'Carga las bandas necesarias o usa el ejemplo sintético.'; }

  function makeExampleBand(kind, width = 360, height = 240) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      const px = (y * width + x) * 4; const u = x / (width - 1); const v = y / (height - 1); let value;
      if (kind === 'red') value = .12 + .38 * u + .08 * Math.sin(v * 12);
      if (kind === 'green') value = .13 + .48 * (1 - u) + .08 * Math.cos(v * 10);
      if (kind === 'nir') value = .23 + .64 * (1 - v) + .08 * Math.sin(u * 13);
      if (kind === 'swir') value = .18 + .58 * u + .06 * Math.cos(v * 14);
      const channel = Math.max(0, Math.min(255, Math.round(value * 255))); image.data[px] = channel; image.data[px + 1] = channel; image.data[px + 2] = channel; image.data[px + 3] = 255;
    }
    ctx.putImageData(image, 0, 0); return canvas;
  }

  function loadImage(file) { return new Promise((resolve, reject) => { const image = new Image(); const url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se pudo leer ${file.name}.`)); }; image.src = url; }); }
  async function getSource(key) { if (state.files[key]) return { source: await loadImage(state.files[key]), name: state.files[key].name }; if (state.examples[key]) return { source: state.examples[key], name: `ejemplo-${key}` }; return null; }
  function readPixels(source) { const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height; const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0); return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data }; }
  function ramp(value) { const t = Math.max(0, Math.min(1, (value + 1) / 2)); const stops = [[0, [111, 38, 28]], [.2, [215, 145, 45]], [.5, [224, 220, 105]], [.7, [91, 177, 91]], [1, [0, 95, 45]]]; let i = stops.findIndex((stop, index) => index > 0 && t <= stop[0]); if (i < 0) i = stops.length - 1; const [a, ca] = stops[i - 1]; const [b, cb] = stops[i]; const p = (t - a) / (b - a); return ca.map((channel, index) => Math.round(channel + (cb[index] - channel) * p)); }

  async function calculate() {
    const definition = definitions[els.index.value]; setStatus('Leyendo bandas y calculando píxeles localmente…'); els.run.disabled = true;
    try {
      const sources = {}; for (const key of definition.needs) { sources[key] = await getSource(key); if (!sources[key]) throw new Error(`Falta la banda ${key.toUpperCase()}.`); }
      const pixels = {}; const first = readPixels(sources[definition.needs[0]].source); pixels[definition.needs[0]] = first;
      for (const key of definition.needs.slice(1)) { pixels[key] = readPixels(sources[key].source); if (pixels[key].width !== first.width || pixels[key].height !== first.height) throw new Error(`Las bandas deben tener la misma dimensión (${first.width}×${first.height} frente a ${pixels[key].width}×${pixels[key].height}).`); }
      els.canvas.width = first.width; els.canvas.height = first.height; const output = els.canvas.getContext('2d').createImageData(first.width, first.height); let valid = 0; let min = 1; let max = -1; let sum = 0; let positive = 0; let negative = 0;
      for (let i = 0; i < first.data.length; i += 4) { const bands = {}; definition.needs.forEach((key) => { bands[key] = pixels[key].data[i] / 255; }); const value = definition.calc(bands); if (value === null || !Number.isFinite(value)) { output.data[i + 3] = 0; continue; } const color = ramp(value); output.data[i] = color[0]; output.data[i + 1] = color[1]; output.data[i + 2] = color[2]; output.data[i + 3] = 255; valid += 1; min = Math.min(min, value); max = Math.max(max, value); sum += value; if (value >= 0) positive += 1; else negative += 1; }
      els.canvas.getContext('2d').putImageData(output, 0, 0); const total = first.width * first.height; const stats = { index: els.index.value, label: definition.label, formula: definition.formula, width: first.width, height: first.height, validPercent: valid / total * 100, min, mean: valid ? sum / valid : null, max, positivePercent: valid ? positive / valid * 100 : null, negativePercent: valid ? negative / valid * 100 : null, bands: Object.fromEntries(definition.needs.map((key) => [key, sources[key].name])) }; state.result = stats; els.resultTitle.textContent = definition.label; els.sourceBadge.textContent = `${first.width} × ${first.height}`; document.getElementById('valid').textContent = `${stats.validPercent.toFixed(1)} %`; document.getElementById('min').textContent = stats.min.toFixed(3); document.getElementById('mean').textContent = stats.mean.toFixed(3); document.getElementById('max').textContent = stats.max.toFixed(3); document.getElementById('positive').textContent = `${stats.positivePercent.toFixed(1)} %`; document.getElementById('negative').textContent = `${stats.negativePercent.toFixed(1)} %`; els.stats.hidden = false; els.downloadPng.disabled = false; els.downloadJson.disabled = false; setStatus(`${definition.label} calculado con ${definition.needs.map((key) => sources[key].name).join(' + ')}.`);
    } catch (error) { state.result = null; els.stats.hidden = true; els.downloadPng.disabled = true; els.downloadJson.disabled = true; setStatus(error.message, true); } finally { els.run.disabled = false; }
  }

  keys.forEach((key) => { const input = document.getElementById(`${key}Input`); input.addEventListener('change', () => { state.files[key] = input.files[0] || null; state.examples[key] = null; formatBandStatus(); }); });
  els.index.addEventListener('change', updateDefinition); els.run.addEventListener('click', calculate);
  document.getElementById('exampleBtn').addEventListener('click', () => { keys.forEach((key) => { state.files[key] = null; const input = document.getElementById(`${key}Input`); input.value = ''; state.examples[key] = makeExampleBand(key); }); formatBandStatus(); setStatus('Ejemplo sintético cargado. Puedes cambiar de índice sin volver a cargar las bandas.'); });
  document.getElementById('clearBtn').addEventListener('click', () => { keys.forEach((key) => { state.files[key] = null; state.examples[key] = null; document.getElementById(`${key}Input`).value = ''; }); els.canvas.getContext('2d').clearRect(0, 0, els.canvas.width, els.canvas.height); els.stats.hidden = true; els.downloadPng.disabled = true; els.downloadJson.disabled = true; els.resultTitle.textContent = 'Sin cálculo'; els.sourceBadge.textContent = 'Local'; formatBandStatus(); setStatus('Preparado para trabajar localmente.'); });
  els.downloadPng.addEventListener('click', () => { const link = document.createElement('a'); link.href = els.canvas.toDataURL('image/png'); link.download = `${els.index.value}-resultado.png`; link.click(); });
  els.downloadJson.addEventListener('click', () => { const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${els.index.value}-estadisticas.json`; link.click(); URL.revokeObjectURL(url); });
  updateDefinition(); formatBandStatus();
})();
