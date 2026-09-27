(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const state = { map: null, marker: null, result: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  function setStatus(text, error = false) {
    $('status').textContent = text;
    $('status').classList.toggle('error', error);
  }

  function format(value, digits = 2) {
    return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits });
  }

  function parseDate() {
    const raw = $('dateTime').value;
    if (!raw) throw new Error('Indica una fecha y hora UTC.');
    const date = new Date(raw + 'Z');
    if (Number.isNaN(date.getTime())) throw new Error('La fecha y hora no son válidas.');
    return date;
  }

  function validateInputs() {
    const lat = Number($('lat').value);
    const lon = Number($('lon').value);
    const height = Number($('height').value);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('La latitud debe estar entre -90 y 90.');
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('La longitud debe estar entre -180 y 180.');
    if (!Number.isFinite(height) || height < 0) throw new Error('La altura debe ser cero o mayor.');
    return { lat, lon, height, date: parseDate() };
  }

  function solarPosition(input) {
    const day = Math.floor((Date.UTC(input.date.getUTCFullYear(), input.date.getUTCMonth(), input.date.getUTCDate()) - Date.UTC(input.date.getUTCFullYear(), 0, 0)) / 86400000);
    const minutes = input.date.getUTCHours() * 60 + input.date.getUTCMinutes() + input.date.getUTCSeconds() / 60;
    const gamma = 2 * Math.PI / 365 * (day - 1 + (minutes / 60 - 12) / 24);
    const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const latitude = input.lat * Math.PI / 180;
    const hour = ((minutes + equation + 4 * input.lon) / 1440 * 1440) % 1440;
    const hourAngle = (hour / 4) - 180;
    const ha = hourAngle * Math.PI / 180;
    const zenith = Math.acos(Math.max(-1, Math.min(1, Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(ha))));
    const elevation = 90 - zenith * 180 / Math.PI;
    let azimuth = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude)) * 180 / Math.PI + 180;
    if (azimuth < 0) azimuth += 360;
    const daylight = sunriseSunset(input, day, equation, declination);
    const shadowLength = elevation > 0 ? input.height / Math.tan(elevation * Math.PI / 180) : null;
    return { ...input, day, equation, declination, elevation, azimuth, shadowBearing: (azimuth + 180) % 360, shadowLength, ...daylight };
  }

  function sunriseSunset(input, day, equation, declination) {
    const latitude = input.lat * Math.PI / 180;
    const zenith = 90.833 * Math.PI / 180;
    const cosine = (Math.cos(zenith) / (Math.cos(latitude) * Math.cos(declination)) - Math.tan(latitude) * Math.tan(declination));
    if (cosine < -1 || cosine > 1) return { sunrise: null, sunset: null };
    const hourAngle = Math.acos(cosine) * 180 / Math.PI;
    const sunrise = 720 - 4 * (input.lon + hourAngle) - equation;
    const sunset = 720 - 4 * (input.lon - hourAngle) - equation;
    return { sunrise, sunset };
  }

  function timeLabel(minutes) {
    if (minutes == null) return 'sin puesta/salida';
    const normalized = ((minutes % 1440) + 1440) % 1440;
    return String(Math.floor(normalized / 60)).padStart(2, '0') + ':' + String(Math.floor(normalized % 60)).padStart(2, '0');
  }

  function compass(value) {
    const names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    return names[Math.round((((value % 360) + 360) % 360) / 22.5) % 16];
  }

  function initMap() {
    if (!window.L) return;
    state.map = L.map('map').setView([40.416775, -3.70379], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    state.map.on('click', event => { $('lat').value = event.latlng.lat.toFixed(6); $('lon').value = event.latlng.lng.toFixed(6); calculate(); });
  }

  function renderMap(result) {
    if (!state.map) return;
    if (state.marker) state.map.removeLayer(state.marker);
    state.marker = L.marker([result.lat, result.lon]).addTo(state.map).bindPopup(`<strong>Lugar seleccionado</strong><br>${format(result.lat, 6)}, ${format(result.lon, 6)}`).openPopup();
    state.map.setView([result.lat, result.lon], Math.max(state.map.getZoom(), 8));
  }

  function drawSky(result) {
    const canvas = $('sky');
    const context = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#0b1823';
    context.fillRect(0, 0, width, height);
    const cx = width / 2, cy = height - 21, radius = Math.min(width * .42, height - 38);
    context.strokeStyle = '#547080';
    context.lineWidth = 1.5;
    context.beginPath(); context.arc(cx, cy, radius, Math.PI, 2 * Math.PI); context.stroke();
    context.beginPath(); context.moveTo(cx - radius, cy); context.lineTo(cx + radius, cy); context.stroke();
    context.fillStyle = '#8aa3af'; context.font = '12px system-ui'; context.textAlign = 'center';
    [['N', cx, cy - radius - 7], ['E', cx + radius + 12, cy + 4], ['S', cx, cy + 17], ['O', cx - radius - 12, cy + 4]].forEach(([label, x, y]) => context.fillText(label, x, y));
    if (result.elevation > 0) {
      const angle = (result.azimuth - 90) * Math.PI / 180;
      const distance = radius * (1 - result.elevation / 90);
      const x = cx + Math.cos(angle) * distance;
      const y = cy + Math.sin(angle) * distance;
      context.strokeStyle = '#f7c86b'; context.lineWidth = 2;
      context.beginPath(); context.moveTo(cx, cy); context.lineTo(x, y); context.stroke();
      context.fillStyle = '#f7c86b'; context.beginPath(); context.arc(x, y, 7, 0, Math.PI * 2); context.fill();
    }
  }

  function render(result) {
    $('elevation').textContent = format(result.elevation) + '°';
    $('azimuth').textContent = format(result.azimuth, 1) + '° ' + compass(result.azimuth);
    $('shadowLength').textContent = result.shadowLength == null ? 'sin luz' : format(result.shadowLength) + ' m';
    $('shadowBearing').textContent = result.shadowLength == null ? '—' : format(result.shadowBearing, 1) + '° ' + compass(result.shadowBearing);
    $('sunrise').textContent = timeLabel(result.sunrise);
    $('sunset').textContent = timeLabel(result.sunset);
    $('dayBadge').textContent = result.elevation > 0 ? 'Sol sobre horizonte' : 'Sol bajo horizonte';
    $('quality').textContent = result.elevation > 0 ? 'Luz disponible' : 'Noche / sombra';
    $('quality').style.color = result.elevation > 0 ? 'var(--accent)' : 'var(--accent2)';
    $('quality').style.borderColor = result.elevation > 0 ? '#755c27' : '#36577d';
    drawSky(result);
    renderMap(result);
    $('jsonBtn').disabled = false;
    $('csvBtn').disabled = false;
    setStatus(`${format(result.lat, 6)}, ${format(result.lon, 6)} · azimut ${format(result.azimuth, 1)}° · hora UTC.`, false);
  }

  function calculate() {
    try { const result = solarPosition(validateInputs()); state.result = result; render(result); }
    catch (error) { setStatus(error.message || 'No se pudo calcular la posición solar.', true); }
  }

  function report() {
    const result = state.result;
    return { fecha_utc: result.date.toISOString(), latitud: result.lat, longitud: result.lon, altura_m: result.height, elevacion_solar_grados: Number(result.elevation.toFixed(6)), azimut_solar_grados: Number(result.azimuth.toFixed(6)), rumbo_sombra_grados: Number(result.shadowBearing.toFixed(6)), longitud_sombra_m: result.shadowLength == null ? null : Number(result.shadowLength.toFixed(6)), salida_utc: timeLabel(result.sunrise), puesta_utc: timeLabel(result.sunset), modelo: 'NOAA solar approximation' };
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 700);
  }

  $('calculateBtn').addEventListener('click', calculate);
  $('nowBtn').addEventListener('click', () => { const now = new Date(); $('dateTime').value = now.toISOString().slice(0, 16); calculate(); });
  ['lat', 'lon', 'dateTime', 'height'].forEach(id => $(id).addEventListener('change', calculate));
  $('jsonBtn').addEventListener('click', () => download('informe-solar.json', JSON.stringify(report(), null, 2), 'application/json;charset=utf-8'));
  $('csvBtn').addEventListener('click', () => { const data = report(); download('informe-solar.csv', '\ufeff' + Object.keys(data).join(',') + '\n' + Object.values(data).map(value => value == null ? '' : JSON.stringify(value)).join(','), 'text/csv;charset=utf-8'); });
  initMap();
  calculate();
})();
