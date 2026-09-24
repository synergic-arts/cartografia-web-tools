const $ = id => document.getElementById(id);
let points = [];
let basePoints = [];
let source = 'ejemplo';
let chartPoints = [];

const example = [
  { distance: 0, elevation: 112 }, { distance: 180, elevation: 119 },
  { distance: 390, elevation: 134 }, { distance: 620, elevation: 128 },
  { distance: 850, elevation: 151 }, { distance: 1110, elevation: 177 },
  { distance: 1370, elevation: 166 }, { distance: 1640, elevation: 194 },
  { distance: 1920, elevation: 183 }
];

function num(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value ?? '').replace(',', '.').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(object, names) {
  const normal = names.map(name => name.toLowerCase().replace(/[_ -]/g, ''));
  const key = Object.keys(object || {}).find(candidate => normal.includes(candidate.toLowerCase().replace(/[_ -]/g, '')));
  return key ? num(object[key]) : null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const radius = 6371008.8;
  const radians = value => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}

function fromObjects(items) {
  const raw = [];
  for (const item of items) {
    const object = { ...(item.properties || {}), ...item };
    const coordinates = object.geometry?.coordinates || object.coordinates;
    const lat = pick(object, ['lat', 'latitude']) ?? (coordinates && num(coordinates[1]));
    const lng = pick(object, ['lon', 'lng', 'longitude']) ?? (coordinates && num(coordinates[0]));
    const elevation = pick(object, ['elevation', 'elev', 'altitude', 'alt', 'z', 'height']);
    const distance = pick(object, ['distance', 'dist', 'chainage', 'station']);
    const x = pick(object, ['x', 'easting']);
    const y = pick(object, ['y', 'northing']);
    if (elevation !== null) raw.push({ lat, lng, elevation, distance, x, y });
  }
  if (!raw.length) throw new Error('No se encontraron puntos con elevación. Usa campos elevation/elev/altitude/z.');
  let total = 0;
  return raw.map((point, index) => {
    if (index) {
      const previous = raw[index - 1];
      if (point.distance !== null) total = point.distance;
      else if (point.lat !== null && point.lng !== null && previous.lat !== null && previous.lng !== null) total += haversine(previous.lat, previous.lng, point.lat, point.lng);
      else if (point.x !== null && point.y !== null && previous.x !== null && previous.y !== null) total += Math.hypot(point.x - previous.x, point.y - previous.y);
    }
    return { ...point, distance: total };
  });
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(value => value.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const values = line.split(separator).map(value => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
  return fromObjects(rows);
}

function parseInput(text, name) {
  const extension = name.toLowerCase().split('.').pop();
  if (extension === 'gpx' || text.includes('<gpx')) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    const rows = [...xml.querySelectorAll('trkpt,rtept,wpt')].map(point => ({
      lat: point.getAttribute('lat'), lng: point.getAttribute('lon'), elevation: point.querySelector('ele')?.textContent
    }));
    return fromObjects(rows);
  }
  if (extension === 'csv' || extension === 'txt') return parseCsv(text);
  const data = JSON.parse(text);
  if (data.type === 'FeatureCollection') return fromObjects(data.features);
  return fromObjects(Array.isArray(data) ? data : [data]);
}

function smooth(values, radius) {
  if (!radius) return values.map(point => ({ ...point }));
  return values.map((point, index) => {
    const window = values.slice(Math.max(0, index - radius), Math.min(values.length, index + radius + 1));
    return { ...point, elevation: window.reduce((sum, item) => sum + item.elevation, 0) / window.length };
  });
}

function prepare() {
  const smoothed = smooth(basePoints, Number($('smooth').value));
  let gain = 0;
  let loss = 0;
  let maxSlope = 0;
  smoothed.forEach((point, index) => {
    point.slope = index ? ((point.elevation - smoothed[index - 1].elevation) / (point.distance - smoothed[index - 1].distance || 1)) * 100 : 0;
    if (index) {
      const delta = point.elevation - smoothed[index - 1].elevation;
      if (delta > 0) gain += delta;
      else loss -= delta;
      maxSlope = Math.max(maxSlope, Math.abs(point.slope));
    }
  });
  points = smoothed;
  render(gain, loss, maxSlope);
}

function render(gain = 0, loss = 0, maxSlope = 0) {
  if (!points.length) {
    $('metrics').innerHTML = '';
    $('table').innerHTML = '';
    $('tooltip').hidden = true;
    draw();
    return;
  }
  const total = points.at(-1).distance;
  const elevations = points.map(point => point.elevation);
  const minimum = Math.min(...elevations);
  const maximum = Math.max(...elevations);
  $('metrics').innerHTML = [
    ['Puntos', points.length],
    ['Distancia', `${total.toLocaleString('es-ES', { maximumFractionDigits: 1 })} m`],
    ['Cota mínima', `${minimum.toLocaleString('es-ES', { maximumFractionDigits: 1 })} m`],
    ['Cota máxima', `${maximum.toLocaleString('es-ES', { maximumFractionDigits: 1 })} m`],
    ['Ascenso acumulado', `${gain.toLocaleString('es-ES', { maximumFractionDigits: 1 })} m`],
    ['Pendiente máxima', `${maxSlope.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`]
  ].map(([label, value]) => `<div class="metric"><b>${value}</b><span>${label}</span></div>`).join('');
  $('table').innerHTML = points.map((point, index) => `<tr><td>${index + 1}</td><td>${point.distance.toFixed(1)} m</td><td>${point.elevation.toFixed(1)} m</td><td>${point.slope.toFixed(2)}%</td><td>${point.lat == null ? '—' : point.lat.toFixed(6)}</td><td>${point.lng == null ? '—' : point.lng.toFixed(6)}</td></tr>`).join('');
  draw();
}

function draw() {
  const canvas = $('chart');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(500, rect.width);
  const height = 360;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const context = canvas.getContext('2d');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  if (!points.length) {
    context.fillStyle = '#9eb5c9';
    context.font = '16px system-ui';
    context.fillText('Carga un perfil para ver el gráfico.', 24, 40);
    chartPoints = [];
    return;
  }
  const padding = { left: 58, right: 18, top: 22, bottom: 40 };
  const minimum = Math.min(...points.map(point => point.elevation));
  const maximum = Math.max(...points.map(point => point.elevation));
  const range = Math.max(1, maximum - minimum);
  const total = points.at(-1).distance;
  const exaggeration = Number($('exaggeration').value);
  const xy = point => [padding.left + (point.distance / Math.max(1, total)) * (width - padding.left - padding.right), padding.top + (1 - ((point.elevation - minimum) / range)) * (height - padding.top - padding.bottom)];
  chartPoints = points.map(xy);
  context.strokeStyle = '#294b65'; context.lineWidth = 1; context.font = '12px system-ui'; context.fillStyle = '#9eb5c9';
  for (let index = 0; index < 5; index += 1) {
    const y = padding.top + index * (height - padding.top - padding.bottom) / 4;
    context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke();
    context.fillText(`${(maximum - index * range / 4).toFixed(0)} m`, 6, y + 4);
  }
  context.strokeStyle = '#73e0bd'; context.lineWidth = 2; context.beginPath();
  chartPoints.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.stroke();
  context.lineTo(chartPoints.at(-1)[0], height - padding.bottom); context.lineTo(chartPoints[0][0], height - padding.bottom); context.closePath();
  const gradient = context.createLinearGradient(0, padding.top, 0, height);
  gradient.addColorStop(0, '#73e0bd66'); gradient.addColorStop(1, '#73e0bd05'); context.fillStyle = gradient; context.fill();
  context.strokeStyle = '#ffc978'; context.lineWidth = 1.5; context.beginPath();
  chartPoints.forEach(([x, y], index) => { const centered = padding.top + (height - padding.top - padding.bottom) / 2; const exaggerated = centered + (y - centered) * exaggeration; index ? context.lineTo(x, exaggerated) : context.moveTo(x, exaggerated); }); context.stroke();
  context.fillStyle = '#9eb5c9'; context.fillText('0 m', padding.left, height - 12); context.fillText(`${total.toFixed(0)} m`, width - padding.right - 42, height - 12);
}

function download(name, type, data) {
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([data], { type })); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

$('file').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      basePoints = parseInput(reader.result, file.name); points = basePoints.map(point => ({ ...point })); source = file.name;
      $('status').textContent = `${points.length} puntos cargados desde ${file.name}.`; prepare(); $('csv').disabled = false; $('json').disabled = false;
    } catch (error) { $('status').textContent = error.message; points = []; basePoints = []; render(); }
  };
  reader.readAsText(file);
});

$('example').addEventListener('click', () => {
  basePoints = example.map(point => ({ ...point })); points = basePoints.map(point => ({ ...point })); source = 'ejemplo'; $('status').textContent = 'Ejemplo de perfil cargado.'; prepare(); $('csv').disabled = false; $('json').disabled = false;
});
$('clear').addEventListener('click', () => { points = []; basePoints = []; $('file').value = ''; $('status').textContent = 'Carga un archivo o pulsa «Usar ejemplo».'; $('csv').disabled = true; $('json').disabled = true; render(); });
$('exaggeration').addEventListener('input', () => { $('exaggerationValue').textContent = `${$('exaggeration').value}×`; draw(); });
$('smooth').addEventListener('input', () => { $('smoothValue').textContent = $('smooth').value; prepare(); });
$('chart').addEventListener('mousemove', event => {
  if (!chartPoints.length) return;
  const rect = $('chart').getBoundingClientRect(); const x = (event.clientX - rect.left) * ($('chart').width / (window.devicePixelRatio || 1)) / rect.width;
  let best = 0; chartPoints.forEach((point, index) => { if (Math.abs(point[0] - x) < Math.abs(chartPoints[best][0] - x)) best = index; });
  const point = points[best]; $('tooltip').hidden = false; $('tooltip').textContent = `Punto ${best + 1} · ${point.distance.toFixed(1)} m · ${point.elevation.toFixed(1)} m · ${point.slope.toFixed(2)}%`;
});
$('chart').addEventListener('mouseleave', () => { $('tooltip').hidden = true; });
$('csv').addEventListener('click', () => download('topo-profile.csv', 'text/csv', `index,distance_m,elevation_m,slope_percent,latitude,longitude\n${points.map((point, index) => `${index + 1},${point.distance},${point.elevation},${point.slope},${point.lat ?? ''},${point.lng ?? ''}`).join('\n')}`));
$('json').addEventListener('click', () => download('topo-profile.json', 'application/json', JSON.stringify({ source, points }, null, 2)));
window.addEventListener('resize', draw);
$('example').click();
