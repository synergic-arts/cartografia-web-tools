(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const state = { width: 720, height: 460, sourceData: null, classifiedData: null, report: null, pixel: null };
  const variableNames = { brightness: 'brillo', red: 'componente roja', green: 'componente verde', blue: 'componente azul', saturation: 'saturación' };
  const palettes = {
    viridis: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725', '#fff5a5'],
    terrain: ['#173b54', '#2b7a58', '#9aa94a', '#d9b36c', '#c97d52', '#f0dfb0'],
    heat: ['#180b3a', '#4b0d6b', '#b63679', '#fb8761', '#fecf92', '#fff7bc'],
    mono: ['#10212b', '#31566a', '#5c8792', '#8fb9a8', '#c9dcab', '#f4f0c1']
  };

  function setStatus(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function format(value, digits = 2) { return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function saturation(r, g, b) { const max = Math.max(r, g, b), min = Math.min(r, g, b); return max === 0 ? 0 : (max - min) / max * 100; }
  function metric(r, g, b, mode) { if (mode === 'brightness') return (r + g + b) / 3; if (mode === 'red') return r; if (mode === 'green') return g; if (mode === 'blue') return b; return saturation(r, g, b); }
  function parseBreaks(mode) {
    const max = mode === 'saturation' ? 100 : 255;
    const values = String($('breaks').value).split(/[,;\s]+/).map(Number).filter(Number.isFinite).map(value => clamp(value, 0, max));
    return [...new Set(values)].sort((a, b) => a - b);
  }
  function makeExample() {
    const canvas = $('sourceCanvas'), context = canvas.getContext('2d'), gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#123e5a'); gradient.addColorStop(.35, '#48a47d'); gradient.addColorStop(.7, '#d6bb66'); gradient.addColorStop(1, '#bd654b');
    context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
    [[155,150,90,'#d9e394'],[475,180,125,'#243d78'],[330,360,155,'#ec8b58']].forEach(([x,y,r,color]) => { context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fillStyle=color; context.globalAlpha=.88; context.fill(); context.globalAlpha=1; });
    state.width = canvas.width; state.height = canvas.height; state.sourceData = context.getImageData(0, 0, state.width, state.height); state.pixel = null;
  }
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { const canvas = $('sourceCanvas'), context = canvas.getContext('2d'), scale = Math.min(canvas.width / image.width, canvas.height / image.height), width = Math.max(1, Math.round(image.width * scale)), height = Math.max(1, Math.round(image.height * scale)); context.clearRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#07131c'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height); state.width = canvas.width; state.height = canvas.height; state.sourceData = context.getImageData(0, 0, state.width, state.height); state.pixel = null; calculate(); }; image.onerror = () => setStatus('La imagen no se pudo decodificar en el navegador.', true); image.src = String(reader.result || ''); };
    reader.onerror = () => setStatus('No se pudo leer la imagen local.', true); reader.readAsDataURL(file);
  }
  function hexRgb(hex) { const value = hex.replace('#', ''); return [parseInt(value.slice(0,2),16), parseInt(value.slice(2,4),16), parseInt(value.slice(4,6),16)]; }
  function classIndex(value, breaks) { let index = 0; while (index < breaks.length && value > breaks[index]) index += 1; return index; }
  function classLabel(index, breaks) { if (!breaks.length) return 'Clase única'; if (index === 0) return `≤ ${format(breaks[0])}`; if (index === breaks.length) return `> ${format(breaks[breaks.length - 1])}`; return `${format(breaks[index - 1])} – ${format(breaks[index])}`; }
  function calculate() {
    try {
      if (!state.sourceData) makeExample();
      const mode = $('mode').value, breaks = parseBreaks(mode), palette = palettes[$('palette').value], output = new ImageData(state.width, state.height), source = state.sourceData.data, counts = Array.from({ length: breaks.length + 1 }, () => 0);
      let valid = 0, minValue = Infinity, maxValue = -Infinity;
      for (let index = 0; index < source.length; index += 4) {
        const r = source[index], g = source[index + 1], b = source[index + 2], alpha = source[index + 3], isTransparent = alpha < 10;
        if (isTransparent && $('nodata').value === 'transparent') { output.data[index + 3] = 0; continue; }
        const value = metric(r, g, b, mode), classId = classIndex(value, breaks), color = hexRgb(palette[Math.min(classId, palette.length - 1)]); counts[classId] += 1; valid += 1; minValue = Math.min(minValue, value); maxValue = Math.max(maxValue, value); output.data[index] = color[0]; output.data[index + 1] = color[1]; output.data[index + 2] = color[2]; output.data[index + 3] = 255;
      }
      state.classifiedData = output;
      state.report = { width: state.width, height: state.height, variable: mode, variableLabel: variableNames[mode], palette: $('palette').value, breaks, pixels: state.width * state.height, validPixels: valid, classes: counts.map((count, index) => ({ id: index + 1, label: classLabel(index, breaks), pixels: count, percentage: valid ? count / valid * 100 : 0, color: palette[Math.min(index, palette.length - 1)] })), sourceRange: valid ? { min: minValue, max: maxValue } : null };
      const context = $('classifiedCanvas').getContext('2d'); context.clearRect(0, 0, state.width, state.height); context.putImageData(output, 0, 0); renderReport(); updatePixel(); $('pngBtn').disabled = false; $('jsonBtn').disabled = false; $('csvBtn').disabled = false; $('quality').textContent = 'Listo'; $('quality').className = 'quality ready'; setStatus(`${format(valid, 0)} píxeles válidos repartidos en ${state.report.classes.length} clases. Todo se ha calculado localmente.`);
    } catch (error) { setStatus(error.message || 'No se pudo reclasificar la imagen.', true); }
  }
  function renderReport() {
    const report = state.report, dominant = report.classes.reduce((best, item) => item.pixels > best.pixels ? item : best, report.classes[0]);
    $('imageSize').textContent = `${report.width} × ${report.height}`; $('classCount').textContent = format(report.classes.length, 0); $('validPixels').textContent = format(report.validPixels, 0); $('largestClass').textContent = `C${dominant.id} · ${format(dominant.percentage)}%`; $('activeVariable').textContent = report.variableLabel; $('classBadge').textContent = `${report.classes.length} clases`;
    $('tableWrap').innerHTML = `<table><thead><tr><th>CLASE</th><th>INTERVALO</th><th>PÍXELES</th><th>PORCENTAJE</th><th>COLOR</th></tr></thead><tbody>${report.classes.map(item => `<tr><td>C${item.id}</td><td>${item.label}</td><td>${format(item.pixels, 0)}</td><td>${format(item.percentage)}%</td><td><span class="table-swatch" style="background:${item.color}"></span>${item.color}</td></tr>`).join('')}</tbody></table>`;
  }
  function pixelAt(event) { const rect = $('sourceCanvas').getBoundingClientRect(), x = clamp(Math.floor((event.clientX - rect.left) / rect.width * state.width), 0, state.width - 1), y = clamp(Math.floor((event.clientY - rect.top) / rect.height * state.height), 0, state.height - 1), index = (y * state.width + x) * 4, data = state.sourceData.data; state.pixel = { x, y, r: data[index], g: data[index + 1], b: data[index + 2], alpha: data[index + 3], value: metric(data[index], data[index + 1], data[index + 2], $('mode').value) }; updatePixel(); }
  function updatePixel() { const pixel = state.pixel; if (!pixel) { $('pixelText').textContent = 'Píxel: haz clic en la imagen original.'; return; } $('pixelSwatch').style.background = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.alpha / 255})`; $('pixelText').textContent = `Píxel ${pixel.x}, ${pixel.y} · RGB ${pixel.r}, ${pixel.g}, ${pixel.b} · ${variableNames[$('mode').value]} ${format(pixel.value)}`; }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })), link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 700); }
  function exportPng() { const link = document.createElement('a'); link.href = $('classifiedCanvas').toDataURL('image/png'); link.download = 'raster-reclasificado.png'; link.click(); }
  function exportJson() { download('informe-raster-reclasificado.json', JSON.stringify(state.report, null, 2), 'application/json;charset=utf-8'); }
  function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
  function exportCsv() { const rows = [['clase','intervalo','pixeles','porcentaje','color'], ...state.report.classes.map(item => [`C${item.id}`, item.label, item.pixels, item.percentage, item.color])]; download('resumen-raster-reclasificado.csv', '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8'); }

  $('calculateBtn').addEventListener('click', calculate); $('sampleBtn').addEventListener('click', () => { $('sourceCanvas').width = 720; $('sourceCanvas').height = 460; makeExample(); calculate(); }); $('mode').addEventListener('change', () => { updatePixel(); calculate(); }); $('palette').addEventListener('change', calculate); $('breaks').addEventListener('change', calculate); $('nodata').addEventListener('change', calculate); $('sourceCanvas').addEventListener('click', pixelAt); $('file').addEventListener('change', event => { const file = event.target.files?.[0]; if (file) loadImage(file); }); $('pngBtn').addEventListener('click', exportPng); $('jsonBtn').addEventListener('click', exportJson); $('csvBtn').addEventListener('click', exportCsv);
  makeExample(); calculate();
})();
