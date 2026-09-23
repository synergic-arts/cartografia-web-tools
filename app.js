(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput: $('fileInput'), dropZone: $('dropZone'), fileState: $('fileState'), routeSummary: $('routeSummary'),
    routeName: $('routeName'), statDistance: $('statDistance'), statAscent: $('statAscent'), statPoints: $('statPoints'), statSize: $('statSize'),
    clearBtn: $('clearBtn'), toleranceRange: $('toleranceRange'), toleranceOut: $('toleranceOut'), reductionBadge: $('reductionBadge'),
    keepElevation: $('keepElevation'), keepTime: $('keepTime'), keepWaypoints: $('keepWaypoints'),
    exportCompactBtn: $('exportCompactBtn'), exportGpxBtn: $('exportGpxBtn'), exportGeoBtn: $('exportGeoBtn'),
    compactSize: $('compactSize'), gpxSize: $('gpxSize'), geoSize: $('geoSize'),
    activitySelect: $('activitySelect'), offRouteSelect: $('offRouteSelect'), voiceToggle: $('voiceToggle'), autoCenterToggle: $('autoCenterToggle'),
    startNavBtn: $('startNavBtn'), gpsBadge: $('gpsBadge'), liveStats: $('liveStats'), liveRemaining: $('liveRemaining'),
    liveOffRoute: $('liveOffRoute'), liveEta: $('liveEta'), liveAccuracy: $('liveAccuracy'), navHud: $('navHud'), navArrow: $('navArrow'),
    navInstruction: $('navInstruction'), navSub: $('navSub'), nextDistance: $('nextDistance'), fitRouteBtn: $('fitRouteBtn'),
    centerGpsBtn: $('centerGpsBtn'), toggleBaseBtn: $('toggleBaseBtn'), mapFallback: $('mapFallback'), toast: $('toast')
  };

  const state = {
    route: null,
    simplified: [],
    stats: null,
    map: null,
    tileLayer: null,
    baseVisible: true,
    routeGroup: null,
    gpsMarker: null,
    gpsAccuracy: null,
    nav: {
      active: false,
      watchId: null,
      wakeLock: null,
      edges: [],
      turns: [],
      total: 0,
      previousPosition: null,
      previousProgress: null,
      currentPosition: null,
      spoken: new Set(),
      lastOffRouteSpeech: 0
    }
  };

  const EARTH = 6371008.8;
  let toastTimer = null;
  let simplifyTimer = null;

  function showToast(message, ms = 2600) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, ms);
  }

  function escapeXml(value) {
    return String(value ?? '').replace(/[<>&'\"]/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[ch]));
  }

  function safeFileName(value) {
    const clean = String(value || 'ruta').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return clean.slice(0, 80) || 'ruta';
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '—';
    if (meters >= 1000) return `${(meters / 1000).toFixed(meters >= 10000 ? 1 : 2)} km`;
    return `${Math.max(0, Math.round(meters))} m`;
  }

  function formatElevation(meters) {
    return Number.isFinite(meters) ? `${Math.round(meters)} m` : '—';
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '—';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  function toRad(v) { return v * Math.PI / 180; }
  function toDeg(v) { return v * 180 / Math.PI; }

  function haversine(a, b) {
    const p1 = toRad(a.lat), p2 = toRad(b.lat);
    const dLat = p2 - p1, dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function bearing(a, b) {
    const p1 = toRad(a.lat), p2 = toRad(b.lat), dLon = toRad(b.lon - a.lon);
    const y = Math.sin(dLon) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function signedAngle(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  function localXY(point, lat0Rad) {
    return { x: toRad(point.lon) * EARTH * Math.cos(lat0Rad), y: toRad(point.lat) * EARTH };
  }

  function distanceToSegment(point, a, b) {
    const lat0 = toRad(point.lat);
    const p = localXY(point, lat0), p1 = localXY(a, lat0), p2 = localXY(b, lat0);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / len2)) : 0;
    const x = p1.x + t * dx, y = p1.y + t * dy;
    const dist = Math.hypot(p.x - x, p.y - y);
    return { dist, t, point: { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t } };
  }

  function byLocalName(root, name) {
    return Array.from(root.getElementsByTagNameNS('*', name));
  }

  function childText(parent, name) {
    const node = byLocalName(parent, name)[0];
    return node ? node.textContent.trim() : '';
  }

  function parsePoint(node) {
    const lat = Number.parseFloat(node.getAttribute('lat'));
    const lon = Number.parseFloat(node.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    const eleText = childText(node, 'ele');
    const timeText = childText(node, 'time');
    const ele = eleText === '' ? null : Number.parseFloat(eleText);
    const time = timeText && !Number.isNaN(Date.parse(timeText)) ? new Date(timeText).toISOString() : null;
    return { lat, lon, ele: Number.isFinite(ele) ? ele : null, time };
  }

  function parseGpx(text, fileName, sourceSize) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('El GPX no es XML válido.');

    const tracks = byLocalName(xml, 'trk');
    const routes = byLocalName(xml, 'rte');
    const segments = [];
    let name = '';

    if (tracks.length) {
      name = childText(tracks[0], 'name');
      tracks.forEach(track => {
        const segs = byLocalName(track, 'trkseg');
        if (segs.length) {
          segs.forEach(seg => {
            const points = byLocalName(seg, 'trkpt').map(parsePoint).filter(Boolean);
            if (points.length) segments.push(points);
          });
        } else {
          const points = byLocalName(track, 'trkpt').map(parsePoint).filter(Boolean);
          if (points.length) segments.push(points);
        }
      });
    } else if (routes.length) {
      name = childText(routes[0], 'name');
      routes.forEach(route => {
        const points = byLocalName(route, 'rtept').map(parsePoint).filter(Boolean);
        if (points.length) segments.push(points);
      });
    }

    if (!segments.length) throw new Error('No se han encontrado puntos <trkpt> ni <rtept> válidos en el GPX.');

    const waypoints = byLocalName(xml, 'wpt').map(node => {
      const p = parsePoint(node);
      return p ? { ...p, name: childText(node, 'name') || 'Waypoint', desc: childText(node, 'desc') || '' } : null;
    }).filter(Boolean);

    const metadata = byLocalName(xml, 'metadata')[0];
    if (!name && metadata) name = childText(metadata, 'name');
    if (!name) name = fileName.replace(/\.(gpx|json)$/i, '') || 'Ruta';

    return { name, segments, waypoints, sourceSize, sourceFileName: fileName };
  }

  function encodeSignedNumber(num) {
    if (!Number.isSafeInteger(num)) throw new Error('Valor fuera de rango para la codificación compacta.');
    let s = num < 0 ? (-num * 2 - 1) : (num * 2);
    let out = '';
    while (s >= 0x20) {
      out += String.fromCharCode((0x20 | (s % 32)) + 63);
      s = Math.floor(s / 32);
    }
    out += String.fromCharCode(s + 63);
    return out;
  }

  function decodeSignedNumber(str, indexObj) {
    let result = 0, shift = 0, b;
    do {
      if (indexObj.i >= str.length) throw new Error('Polyline compacta incompleta.');
      b = str.charCodeAt(indexObj.i++) - 63;
      result += (b & 0x1f) * (2 ** shift);
      shift += 5;
      if (shift > 52) throw new Error('Valor compacto fuera de rango.');
    } while (b >= 0x20);
    return (result % 2) ? -((result + 1) / 2) : (result / 2);
  }

  function encodePolyline(points, precision = 6) {
    const factor = 10 ** precision;
    let prevLat = 0, prevLon = 0, out = '';
    for (const p of points) {
      const lat = Math.round(p.lat * factor), lon = Math.round(p.lon * factor);
      out += encodeSignedNumber(lat - prevLat) + encodeSignedNumber(lon - prevLon);
      prevLat = lat; prevLon = lon;
    }
    return out;
  }

  function decodePolyline(str, precision = 6) {
    const factor = 10 ** precision;
    let lat = 0, lon = 0;
    const points = [], idx = { i: 0 };
    while (idx.i < str.length) {
      lat += decodeSignedNumber(str, idx);
      lon += decodeSignedNumber(str, idx);
      points.push({ lat: lat / factor, lon: lon / factor, ele: null, time: null });
    }
    return points;
  }

  function encodeSeries(values, factor = 1) {
    let prev = 0, out = '';
    for (const value of values) {
      const current = Math.round(value * factor);
      out += encodeSignedNumber(current - prev);
      prev = current;
    }
    return out;
  }

  function decodeSeries(str, count, factor = 1) {
    const values = [], idx = { i: 0 };
    let current = 0;
    while (idx.i < str.length && values.length < count) {
      current += decodeSignedNumber(str, idx);
      values.push(current / factor);
    }
    if (values.length !== count) throw new Error('Serie compacta incompleta.');
    return values;
  }

  function parseCompact(text, fileName, sourceSize) {
    let obj;
    try { obj = JSON.parse(text); } catch { throw new Error('El JSON no es válido.'); }
    if (!obj || obj.format !== 'rutalite' || obj.v !== 1 || !Array.isArray(obj.segments)) {
      throw new Error('El archivo JSON no es una Ruta Compacta de RutaLite.');
    }
    const precision = Number.isInteger(obj.precision) ? obj.precision : 6;
    const segments = obj.segments.map((encoded, idx) => {
      const points = decodePolyline(String(encoded), precision);
      if (obj.elevation && obj.elevation[idx]) {
        const elevations = decodeSeries(String(obj.elevation[idx]), points.length, 10);
        points.forEach((p, i) => { p.ele = elevations[i]; });
      }
      if (obj.times && obj.times[idx]) {
        const seconds = decodeSeries(String(obj.times[idx]), points.length, 1);
        points.forEach((p, i) => { p.time = new Date(seconds[i] * 1000).toISOString(); });
      }
      return points;
    }).filter(seg => seg.length);
    if (!segments.length) throw new Error('La Ruta Compacta no contiene puntos.');
    const waypoints = Array.isArray(obj.waypoints) ? obj.waypoints.map(w => ({
      lat: Number(w[0]), lon: Number(w[1]), name: String(w[2] || 'Waypoint'), desc: String(w[3] || ''), ele: null, time: null
    })).filter(w => Number.isFinite(w.lat) && Number.isFinite(w.lon)) : [];
    return { name: String(obj.name || fileName.replace(/\.json$/i, '') || 'Ruta'), segments, waypoints, sourceSize, sourceFileName: fileName };
  }

  function flatDistanceSq(a, b) {
    const lat = toRad((a.lat + b.lat) / 2);
    const dx = toRad(a.lon - b.lon) * EARTH * Math.cos(lat);
    const dy = toRad(a.lat - b.lat) * EARTH;
    return dx * dx + dy * dy;
  }

  function radialSimplify(points, tolerance) {
    if (points.length <= 2 || tolerance <= 0) return points.slice();
    const sqTol = tolerance * tolerance;
    const out = [points[0]];
    let prev = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      if (flatDistanceSq(points[i], prev) > sqTol) {
        out.push(points[i]);
        prev = points[i];
      }
    }
    if (prev !== points[points.length - 1]) out.push(points[points.length - 1]);
    return out;
  }

  function perpendicularDistance(point, a, b) {
    const lat0 = toRad(point.lat);
    const p = localXY(point, lat0), p1 = localXY(a, lat0), p2 = localXY(b, lat0);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
    const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (p1.x + t * dx), p.y - (p1.y + t * dy));
  }

  function douglasPeucker(points, tolerance) {
    const n = points.length;
    if (n <= 2 || tolerance <= 0) return points.slice();
    const keep = new Uint8Array(n);
    keep[0] = keep[n - 1] = 1;
    const stack = [[0, n - 1]];
    while (stack.length) {
      const [first, last] = stack.pop();
      let maxDist = 0, index = -1;
      for (let i = first + 1; i < last; i++) {
        const d = perpendicularDistance(points[i], points[first], points[last]);
        if (d > maxDist) { maxDist = d; index = i; }
      }
      if (index >= 0 && maxDist > tolerance) {
        keep[index] = 1;
        stack.push([first, index], [index, last]);
      }
    }
    return points.filter((_, i) => keep[i]);
  }

  function simplifySegment(points, tolerance) {
    if (tolerance <= 0 || points.length <= 2) return points.slice();
    return douglasPeucker(radialSimplify(points, tolerance * 0.75), tolerance);
  }

  function calculateStats(segments) {
    let distance = 0, ascent = 0, points = 0;
    let startTime = null, endTime = null;
    for (const seg of segments) {
      points += seg.length;
      for (let i = 0; i < seg.length; i++) {
        const p = seg[i];
        if (p.time) {
          const t = Date.parse(p.time);
          if (Number.isFinite(t)) {
            if (startTime === null || t < startTime) startTime = t;
            if (endTime === null || t > endTime) endTime = t;
          }
        }
        if (i > 0) {
          distance += haversine(seg[i - 1], p);
          if (Number.isFinite(seg[i - 1].ele) && Number.isFinite(p.ele)) {
            const gain = p.ele - seg[i - 1].ele;
            if (gain > 0) ascent += gain;
          }
        }
      }
    }
    return { distance, ascent, points, duration: startTime !== null && endTime !== null ? (endTime - startTime) / 1000 : null };
  }

  function buildCompactObject() {
    const keepEle = els.keepElevation.checked;
    const keepTime = els.keepTime.checked;
    const obj = {
      format: 'rutalite', v: 1, precision: 6, name: state.route.name,
      segments: state.simplified.map(seg => encodePolyline(seg, 6)),
      meta: {
        distance_m: Math.round(state.stats.distance),
        ascent_m: Math.round(state.stats.ascent),
        source_points: state.stats.points,
        points: state.simplified.reduce((n, s) => n + s.length, 0)
      }
    };
    if (keepEle) {
      const encoded = state.simplified.map(seg => seg.every(p => Number.isFinite(p.ele)) ? encodeSeries(seg.map(p => p.ele), 10) : null);
      if (encoded.some(Boolean)) obj.elevation = encoded;
    }
    if (keepTime) {
      const encoded = state.simplified.map(seg => seg.every(p => p.time && Number.isFinite(Date.parse(p.time))) ? encodeSeries(seg.map(p => Date.parse(p.time) / 1000), 1) : null);
      if (encoded.some(Boolean)) obj.times = encoded;
    }
    if (els.keepWaypoints.checked && state.route.waypoints.length) {
      obj.waypoints = state.route.waypoints.map(w => [Number(w.lat.toFixed(6)), Number(w.lon.toFixed(6)), w.name || '', w.desc || '']);
    }
    return obj;
  }

  function buildCompactText() {
    return JSON.stringify(buildCompactObject());
  }

  function buildGpxText() {
    const keepEle = els.keepElevation.checked;
    const keepTime = els.keepTime.checked;
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<gpx version="1.1" creator="RutaLite" xmlns="http://www.topografix.com/GPX/1/1">'];
    lines.push(`<metadata><name>${escapeXml(state.route.name)}</name></metadata>`);
    if (els.keepWaypoints.checked) {
      for (const w of state.route.waypoints) {
        lines.push(`<wpt lat="${w.lat.toFixed(7)}" lon="${w.lon.toFixed(7)}">${keepEle && Number.isFinite(w.ele) ? `<ele>${w.ele.toFixed(1)}</ele>` : ''}<name>${escapeXml(w.name || 'Waypoint')}</name>${w.desc ? `<desc>${escapeXml(w.desc)}</desc>` : ''}</wpt>`);
      }
    }
    lines.push(`<trk><name>${escapeXml(state.route.name)}</name>`);
    for (const seg of state.simplified) {
      lines.push('<trkseg>');
      for (const p of seg) {
        let inner = '';
        if (keepEle && Number.isFinite(p.ele)) inner += `<ele>${p.ele.toFixed(1)}</ele>`;
        if (keepTime && p.time) inner += `<time>${escapeXml(p.time)}</time>`;
        lines.push(`<trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">${inner}</trkpt>`);
      }
      lines.push('</trkseg>');
    }
    lines.push('</trk></gpx>');
    return lines.join('');
  }

  function buildGeoJsonText() {
    const withElevation = els.keepElevation.checked;
    const coords = state.simplified.map(seg => seg.map(p => withElevation && Number.isFinite(p.ele) ? [p.lon, p.lat, p.ele] : [p.lon, p.lat]));
    const geometry = coords.length === 1 ? { type: 'LineString', coordinates: coords[0] } : { type: 'MultiLineString', coordinates: coords };
    const features = [{ type: 'Feature', properties: { name: state.route.name }, geometry }];
    if (els.keepWaypoints.checked) {
      for (const w of state.route.waypoints) {
        features.push({ type: 'Feature', properties: { name: w.name || 'Waypoint', description: w.desc || '' }, geometry: { type: 'Point', coordinates: withElevation && Number.isFinite(w.ele) ? [w.lon, w.lat, w.ele] : [w.lon, w.lat] } });
      }
    }
    return JSON.stringify({ type: 'FeatureCollection', features });
  }

  function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function initMap() {
    if (!window.L) {
      els.mapFallback.hidden = false;
      els.toggleBaseBtn.disabled = true;
      return;
    }
    state.map = L.map('map', { zoomControl: false, preferCanvas: true, worldCopyJump: true }).setView([40, -3], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    state.tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(state.map);
    state.routeGroup = L.layerGroup().addTo(state.map);
  }

  function divIcon(className) {
    return L.divIcon({ className: '', html: `<div class="${className}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
  }

  function drawRoute(fit = false) {
    if (!state.map || !state.routeGroup) return;
    state.routeGroup.clearLayers();
    const bounds = [];
    state.simplified.forEach(seg => {
      if (!seg.length) return;
      const latlngs = seg.map(p => [p.lat, p.lon]);
      bounds.push(...latlngs);
      L.polyline(latlngs, { color: '#1768e5', weight: 5, opacity: .92, lineCap: 'round', lineJoin: 'round' }).addTo(state.routeGroup);
    });
    if (state.simplified.length && state.simplified[0].length) {
      const start = state.simplified[0][0];
      const lastSeg = state.simplified[state.simplified.length - 1];
      const end = lastSeg[lastSeg.length - 1];
      L.marker([start.lat, start.lon], { icon: divIcon('route-start-marker'), keyboard: false }).bindTooltip('Inicio').addTo(state.routeGroup);
      L.marker([end.lat, end.lon], { icon: divIcon('route-end-marker'), keyboard: false }).bindTooltip('Fin').addTo(state.routeGroup);
    }
    if (els.keepWaypoints.checked) {
      state.route.waypoints.forEach(w => {
        bounds.push([w.lat, w.lon]);
        L.circleMarker([w.lat, w.lon], { radius: 6, weight: 2, color: '#ffffff', fillColor: '#7c3aed', fillOpacity: 1 }).bindPopup(`<strong>${escapeXml(w.name || 'Waypoint')}</strong>${w.desc ? `<br>${escapeXml(w.desc)}` : ''}`).addTo(state.routeGroup);
      });
    }
    if (fit && bounds.length) state.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  }

  function buildNavigationModel() {
    const edges = [], turns = [];
    let cumulative = 0;
    state.simplified.forEach((seg, segIndex) => {
      const pointProgress = new Array(seg.length).fill(cumulative);
      for (let i = 0; i < seg.length - 1; i++) {
        const length = haversine(seg[i], seg[i + 1]);
        edges.push({ a: seg[i], b: seg[i + 1], length, start: cumulative, end: cumulative + length, segIndex, pointIndex: i });
        cumulative += length;
        pointProgress[i + 1] = cumulative;
      }
      for (let i = 1; i < seg.length - 1; i++) {
        const beforeLen = haversine(seg[i - 1], seg[i]);
        const afterLen = haversine(seg[i], seg[i + 1]);
        if (beforeLen < 6 || afterLen < 6) continue;
        const diff = signedAngle(bearing(seg[i - 1], seg[i]), bearing(seg[i], seg[i + 1]));
        const abs = Math.abs(diff);
        if (abs < 35) continue;
        let text;
        if (abs >= 145) text = diff > 0 ? 'Giro cerrado a la derecha' : 'Giro cerrado a la izquierda';
        else if (abs >= 75) text = diff > 0 ? 'Gira a la derecha' : 'Gira a la izquierda';
        else text = diff > 0 ? 'Gira ligeramente a la derecha' : 'Gira ligeramente a la izquierda';
        turns.push({ progress: pointProgress[i], text, direction: diff > 0 ? 'right' : 'left', key: `${segIndex}-${i}` });
      }
    });
    state.nav.edges = edges;
    state.nav.turns = turns;
    state.nav.total = cumulative;
  }

  function nearestOnRoute(pos) {
    let best = null;
    const prev = state.nav.previousProgress;
    for (const edge of state.nav.edges) {
      const hit = distanceToSegment(pos, edge.a, edge.b);
      const progress = edge.start + hit.t * edge.length;
      let score = hit.dist;
      if (Number.isFinite(prev)) {
        const jump = Math.abs(progress - prev);
        if (jump > 400) score += (jump - 400) * 0.02;
        if (progress < prev - 120) score += (prev - 120 - progress) * 0.05;
      }
      if (!best || score < best.score) best = { ...hit, score, progress, edge };
    }
    return best;
  }

  function pointAtProgress(progress) {
    if (!state.nav.edges.length) return null;
    const p = Math.max(0, Math.min(state.nav.total, progress));
    let edge = state.nav.edges[state.nav.edges.length - 1];
    for (const e of state.nav.edges) { if (p <= e.end) { edge = e; break; } }
    const t = edge.length > 0 ? Math.max(0, Math.min(1, (p - edge.start) / edge.length)) : 0;
    return { lat: edge.a.lat + (edge.b.lat - edge.a.lat) * t, lon: edge.a.lon + (edge.b.lon - edge.a.lon) * t };
  }

  function nextTurn(progress) {
    return state.nav.turns.find(turn => turn.progress > progress + 5) || null;
  }

  function speak(text) {
    if (!els.voiceToggle.checked || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  function maybeSpeakTurn(turn, distance) {
    if (!turn || distance > 110) return;
    const bucket = distance <= 20 ? 20 : distance <= 50 ? 50 : 100;
    const key = `${turn.key}-${bucket}`;
    if (state.nav.spoken.has(key)) return;
    state.nav.spoken.add(key);
    speak(`En ${bucket} metros, ${turn.text.toLowerCase()}`);
  }

  function updateGpsMarker(pos, accuracy) {
    if (!state.map) return;
    if (!state.gpsMarker) state.gpsMarker = L.marker([pos.lat, pos.lon], { icon: divIcon('gps-pulse'), zIndexOffset: 1000, keyboard: false }).addTo(state.map);
    else state.gpsMarker.setLatLng([pos.lat, pos.lon]);
    if (!state.gpsAccuracy) state.gpsAccuracy = L.circle([pos.lat, pos.lon], { radius: accuracy || 0, weight: 1, color: '#1768e5', fillColor: '#1768e5', fillOpacity: .06, interactive: false }).addTo(state.map);
    else state.gpsAccuracy.setLatLng([pos.lat, pos.lon]).setRadius(accuracy || 0);
    els.centerGpsBtn.disabled = false;
    if (els.autoCenterToggle.checked) state.map.panTo([pos.lat, pos.lon], { animate: true, duration: .35 });
  }

  function onPosition(position) {
    if (!state.nav.active) return;
    const c = position.coords;
    const pos = { lat: c.latitude, lon: c.longitude };
    state.nav.currentPosition = pos;
    updateGpsMarker(pos, c.accuracy);
    const nearest = nearestOnRoute(pos);
    if (!nearest) return;
    state.nav.previousProgress = nearest.progress;

    const remaining = Math.max(0, state.nav.total - nearest.progress);
    const threshold = Number(els.offRouteSelect.value) || 35;
    const offRoute = nearest.dist;
    const selectedSpeed = Number(els.activitySelect.value) || 1.25;
    const liveSpeed = Number.isFinite(c.speed) && c.speed > .5 && c.speed < 70 ? c.speed : selectedSpeed;
    const etaSeconds = liveSpeed > .1 ? remaining / liveSpeed : null;
    const turn = nextTurn(nearest.progress);
    const turnDistance = turn ? Math.max(0, turn.progress - nearest.progress) : remaining;

    let instruction = 'Sigue la ruta';
    let sub = `Quedan ${formatDistance(remaining)}`;
    let arrowTarget = pointAtProgress(Math.min(state.nav.total, nearest.progress + Math.max(25, Math.min(80, liveSpeed * 8))));

    if (offRoute > threshold) {
      instruction = 'Vuelve a la ruta';
      sub = `Estás a ${formatDistance(offRoute)} del track`;
      arrowTarget = nearest.point;
      const now = Date.now();
      if (now - state.nav.lastOffRouteSpeech > 18000) {
        speak(`Te has separado ${Math.round(offRoute)} metros de la ruta`);
        state.nav.lastOffRouteSpeech = now;
        if ('vibrate' in navigator) navigator.vibrate([150, 80, 150]);
      }
      els.gpsBadge.className = 'status-badge danger';
      els.gpsBadge.textContent = 'Fuera de ruta';
    } else if (remaining <= 25) {
      instruction = 'Has llegado';
      sub = 'Final de la ruta';
      els.gpsBadge.className = 'status-badge';
      els.gpsBadge.textContent = 'Destino';
      if (!state.nav.spoken.has('arrived')) { state.nav.spoken.add('arrived'); speak('Has llegado al final de la ruta'); }
    } else if (turn && turnDistance <= 220) {
      instruction = turn.text;
      sub = `${formatDistance(turnDistance)} · después continúa por el track`;
      maybeSpeakTurn(turn, turnDistance);
      els.gpsBadge.className = 'status-badge';
      els.gpsBadge.textContent = 'En ruta';
    } else {
      els.gpsBadge.className = 'status-badge';
      els.gpsBadge.textContent = 'En ruta';
    }

    if (arrowTarget) {
      const brg = bearing(pos, arrowTarget);
      els.navArrow.style.transform = `rotate(${brg}deg)`;
      els.navSub.textContent = `${sub} · rumbo ${Math.round(brg)}°`;
    } else {
      els.navSub.textContent = sub;
    }
    els.navInstruction.textContent = instruction;
    els.nextDistance.textContent = formatDistance(turnDistance);
    els.liveRemaining.textContent = formatDistance(remaining);
    els.liveOffRoute.textContent = formatDistance(offRoute);
    els.liveEta.textContent = formatDuration(etaSeconds);
    els.liveAccuracy.textContent = Number.isFinite(c.accuracy) ? `±${Math.round(c.accuracy)} m` : '—';

    if (state.nav.previousPosition && (!Number.isFinite(c.heading) || c.heading === null)) {
      const moved = haversine(state.nav.previousPosition, pos);
      if (moved > 2) state.nav.lastMovementBearing = bearing(state.nav.previousPosition, pos);
    }
    state.nav.previousPosition = pos;
  }

  function onGeoError(error) {
    const messages = {
      1: 'Permiso de ubicación denegado. Actívalo para navegar.',
      2: 'No se puede obtener la ubicación GPS.',
      3: 'El GPS está tardando demasiado. Inténtalo de nuevo.'
    };
    showToast(messages[error.code] || 'Error de geolocalización.', 4200);
    els.gpsBadge.className = 'status-badge danger';
    els.gpsBadge.textContent = 'GPS sin acceso';
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { state.nav.wakeLock = await navigator.wakeLock.request('screen'); } catch { /* optional enhancement */ }
  }

  async function releaseWakeLock() {
    try { if (state.nav.wakeLock) await state.nav.wakeLock.release(); } catch { /* ignore */ }
    state.nav.wakeLock = null;
  }

  function startNavigation() {
    if (!state.route || !state.nav.edges.length) return;
    if (!navigator.geolocation) { showToast('Este navegador no ofrece geolocalización.'); return; }
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      showToast('El GPS del navegador requiere HTTPS. Publica la web con HTTPS para navegar.', 5000);
      return;
    }
    state.nav.active = true;
    state.nav.spoken.clear();
    state.nav.previousProgress = null;
    state.nav.previousPosition = null;
    state.nav.lastOffRouteSpeech = 0;
    els.navHud.hidden = false;
    els.liveStats.hidden = false;
    els.startNavBtn.textContent = '■ Detener navegación';
    els.startNavBtn.classList.add('stop');
    els.gpsBadge.className = 'status-badge warn';
    els.gpsBadge.textContent = 'Buscando GPS';
    state.nav.watchId = navigator.geolocation.watchPosition(onPosition, onGeoError, { enableHighAccuracy: true, maximumAge: 1500, timeout: 15000 });
    requestWakeLock();
  }

  function stopNavigation() {
    if (state.nav.watchId !== null) navigator.geolocation.clearWatch(state.nav.watchId);
    state.nav.watchId = null;
    state.nav.active = false;
    els.startNavBtn.textContent = '▶ Iniciar navegación';
    els.startNavBtn.classList.remove('stop');
    els.gpsBadge.className = 'status-badge muted';
    els.gpsBadge.textContent = 'GPS parado';
    els.navHud.hidden = true;
    els.liveStats.hidden = true;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    releaseWakeLock();
  }

  function setControlsEnabled(enabled) {
    const ids = [els.toleranceRange, els.keepElevation, els.keepTime, els.keepWaypoints, els.exportCompactBtn, els.exportGpxBtn, els.exportGeoBtn, els.activitySelect, els.offRouteSelect, els.voiceToggle, els.autoCenterToggle, els.startNavBtn, els.fitRouteBtn];
    ids.forEach(el => { el.disabled = !enabled; });
    document.querySelectorAll('[data-tolerance]').forEach(btn => { btn.disabled = !enabled; });
  }

  function updateExportEstimates() {
    if (!state.route) return;
    try {
      els.compactSize.textContent = formatBytes(new Blob([buildCompactText()]).size);
      els.gpxSize.textContent = formatBytes(new Blob([buildGpxText()]).size);
      els.geoSize.textContent = formatBytes(new Blob([buildGeoJsonText()]).size);
    } catch {
      els.compactSize.textContent = els.gpxSize.textContent = els.geoSize.textContent = '—';
    }
  }

  function applySimplification(fit = false) {
    if (!state.route) return;
    const tolerance = Number(els.toleranceRange.value) || 0;
    els.toleranceOut.textContent = `${tolerance} m`;
    state.simplified = state.route.segments.map(seg => simplifySegment(seg, tolerance));
    const currentCount = state.simplified.reduce((n, s) => n + s.length, 0);
    const originalCount = state.stats.points;
    const reduction = originalCount ? Math.max(0, Math.round((1 - currentCount / originalCount) * 100)) : 0;
    els.reductionBadge.className = 'status-badge';
    els.reductionBadge.textContent = `${currentCount.toLocaleString('es-ES')} pts · −${reduction}%`;
    drawRoute(fit);
    buildNavigationModel();
    updateExportEstimates();
  }

  function loadRoute(route) {
    stopNavigation();
    state.route = route;
    state.stats = calculateStats(route.segments);
    els.routeSummary.hidden = false;
    els.routeName.textContent = route.name;
    els.statDistance.textContent = formatDistance(state.stats.distance);
    els.statAscent.textContent = formatElevation(state.stats.ascent);
    els.statPoints.textContent = state.stats.points.toLocaleString('es-ES');
    els.statSize.textContent = formatBytes(route.sourceSize);
    els.fileState.className = 'status-badge';
    els.fileState.textContent = 'Ruta cargada';
    setControlsEnabled(true);
    applySimplification(true);
  }

  function clearRoute() {
    stopNavigation();
    state.route = null; state.simplified = []; state.stats = null; state.nav.edges = []; state.nav.turns = []; state.nav.total = 0;
    els.routeSummary.hidden = true;
    els.fileState.className = 'status-badge muted';
    els.fileState.textContent = 'Sin ruta';
    els.reductionBadge.className = 'status-badge muted';
    els.reductionBadge.textContent = '—';
    els.compactSize.textContent = els.gpxSize.textContent = els.geoSize.textContent = '—';
    els.fileInput.value = '';
    setControlsEnabled(false);
    if (state.routeGroup) state.routeGroup.clearLayers();
    if (state.map && state.gpsMarker) { state.map.removeLayer(state.gpsMarker); state.gpsMarker = null; }
    if (state.map && state.gpsAccuracy) { state.map.removeLayer(state.gpsAccuracy); state.gpsAccuracy = null; }
    els.centerGpsBtn.disabled = true;
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.size > 120 * 1024 * 1024) { showToast('El archivo supera 120 MB; es demasiado grande para procesarlo con seguridad en un móvil.', 5000); return; }
    els.fileState.className = 'status-badge warn';
    els.fileState.textContent = 'Procesando…';
    try {
      const text = await file.text();
      const trimmed = text.trimStart();
      const route = trimmed.startsWith('{') ? parseCompact(text, file.name, file.size) : parseGpx(text, file.name, file.size);
      loadRoute(route);
      showToast(`Ruta cargada: ${route.segments.reduce((n, s) => n + s.length, 0).toLocaleString('es-ES')} puntos`);
    } catch (error) {
      console.error(error);
      els.fileState.className = 'status-badge danger';
      els.fileState.textContent = 'Error';
      showToast(error?.message || 'No se ha podido leer el archivo.', 5000);
    }
  }

  els.fileInput.addEventListener('change', () => handleFile(els.fileInput.files?.[0]));
  ['dragenter','dragover'].forEach(type => els.dropZone.addEventListener(type, e => { e.preventDefault(); els.dropZone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(type => els.dropZone.addEventListener(type, e => { e.preventDefault(); els.dropZone.classList.remove('drag'); }));
  els.dropZone.addEventListener('drop', e => handleFile(e.dataTransfer?.files?.[0]));
  els.clearBtn.addEventListener('click', clearRoute);

  els.toleranceRange.addEventListener('input', () => {
    els.toleranceOut.textContent = `${els.toleranceRange.value} m`;
    clearTimeout(simplifyTimer);
    simplifyTimer = setTimeout(() => applySimplification(false), 120);
  });
  document.querySelectorAll('[data-tolerance]').forEach(btn => btn.addEventListener('click', () => {
    els.toleranceRange.value = btn.dataset.tolerance;
    applySimplification(false);
  }));
  [els.keepElevation, els.keepTime].forEach(el => el.addEventListener('change', updateExportEstimates));
  els.keepWaypoints.addEventListener('change', () => { drawRoute(false); updateExportEstimates(); });

  els.exportCompactBtn.addEventListener('click', () => downloadText(buildCompactText(), `${safeFileName(state.route.name)}.route.json`, 'application/json'));
  els.exportGpxBtn.addEventListener('click', () => downloadText(buildGpxText(), `${safeFileName(state.route.name)}-lite.gpx`, 'application/gpx+xml'));
  els.exportGeoBtn.addEventListener('click', () => downloadText(buildGeoJsonText(), `${safeFileName(state.route.name)}.geojson`, 'application/geo+json'));

  els.startNavBtn.addEventListener('click', () => state.nav.active ? stopNavigation() : startNavigation());
  els.fitRouteBtn.addEventListener('click', () => drawRoute(true));
  els.centerGpsBtn.addEventListener('click', () => {
    if (state.map && state.nav.currentPosition) state.map.setView([state.nav.currentPosition.lat, state.nav.currentPosition.lon], Math.max(state.map.getZoom(), 16));
  });
  els.toggleBaseBtn.addEventListener('click', () => {
    if (!state.map || !state.tileLayer) return;
    state.baseVisible = !state.baseVisible;
    if (state.baseVisible) state.tileLayer.addTo(state.map); else state.map.removeLayer(state.tileLayer);
    document.body.classList.toggle('no-base-map', !state.baseVisible);
    els.toggleBaseBtn.title = state.baseVisible ? 'Desactivar mapa base' : 'Activar mapa base';
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.nav.active && !state.nav.wakeLock) requestWakeLock();
  });

  initMap();
  setControlsEnabled(false);
  if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
