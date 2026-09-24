(() => {
  const SOURCES = [
    {
      id: 'malaga-2026',
      label: 'Málaga · yacimientos arqueológicos 2026',
      publisher: 'Diputación Provincial de Málaga',
      format: 'JSON / CSV',
      urls: [
        'https://opendata.malaga.es/dataset/c396a724-769e-4298-9e4e-5da74e6236da/resource/fe819fb6-5a32-42d8-bc18-a15b6e2eda8f/download/yacimientos-arqueologicos_2026.json',
        'https://opendata.malaga.es/dataset/c396a724-769e-4298-9e4e-5da74e6236da/resource/6601657b-0e2c-489a-9bbb-e5d0af3d50fe/download/yacimientos-arqueologicos_2026.csv'
      ],
      catalogUrl: 'https://datos.gob.es/es/catalogo/l02000029-yacimientos-arqueologicos',
      license: 'CC BY 4.0',
      notes: 'Inventario provincial con registros publicados por el portal de datos abiertos de Málaga.'
    },
    {
      id: 'euskadi-restos',
      label: 'Euskadi · cuevas y restos arqueológicos',
      publisher: 'Gobierno Vasco · Open Data Euskadi',
      format: 'GeoJSON / JSON',
      urls: [
        'https://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/cuevas_restos_arqueologicos/opendata/cuevas.geojson',
        'https://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/cuevas_restos_arqueologicos/opendata/cuevas.json'
      ],
      catalogUrl: 'https://datos.gob.es/es/catalogo/a16003011-patrimonio-cultural-cuevas-y-restos-arqueologicos',
      license: 'CC BY 4.0',
      notes: 'Capa de cuevas y restos arqueológicos de Euskadi con descarga GeoJSON y actualización indicada como semanal.'
    },
    {
      id: 'navarra-bic',
      label: 'Navarra · yacimientos arqueológicos BIC',
      publisher: 'SITNA · Gobierno de Navarra',
      format: 'Shapefile ZIP',
      urls: ['https://idena.navarra.es/descargas/PATRIM_Pol_YaciArqueo.zip'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/a15002917-yacimientos-arqueologicos1',
      license: 'CC BY 4.0',
      notes: 'Capa de polígonos de yacimientos arqueológicos declarados Bien de Interés Cultural en Navarra.'
    },
    {
      id: 'cyl-poblacion-recintos',
      label: 'Castilla y León · entidades, asentamientos y despoblados',
      publisher: 'Junta de Castilla y León',
      format: 'GeoJSON',
      urls: ['https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/sunuc_urb_cyl_recintos/exports/geojson?lang=es&timezone=Europe%2FMadrid'],
      catalogUrl: 'https://analisis.datosabiertos.jcyl.es/explore/dataset/sunuc_urb_cyl_recintos/',
      license: 'Licencia de datos abiertos de Castilla y León',
      notes: 'Capa oficial de recintos que incluye núcleos, asentamientos diseminados, despoblados y otros espacios relacionados. Cobertura Castilla y León; no es un inventario nacional.'
    },
    {
      id: 'miteco-poblaciones-aisladas',
      label: 'MITECO · poblaciones aisladas de España (2018)',
      publisher: 'Ministerio para la Transición Ecológica y el Reto Demográfico',
      format: 'Shapefile ZIP',
      urls: ['https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/poblaciones-aisladas_tcm30-450725.zip'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/e0dat0002-poblaciones-aisladas',
      license: 'CC BY 4.0',
      notes: 'Capa nacional de poblaciones aisladas conforme a la definición del RD 1481/2001, actualizada en 2018. Es contexto de asentamientos remotos, no un inventario de despoblados históricos.'
    }
  ];

  const REFERENCE_SOURCES = [
    {
      group: 'Nacional · nombres y asentamientos',
      label: 'IGN · Nomenclátor Geográfico Básico de España (WFS)',
      description: 'Lugares nombrados y asentamientos con geometría oficial. Sirve para contextualizar topónimos y completar áreas, pero no clasifica por sí solo todos los despoblados.',
      url: 'https://www.ign.es/wfs-inspire/ngbe?service=WFS&request=GetCapabilities',
      license: 'CC BY 4.0 IGN'
    },
    {
      group: 'Nacional · población',
      label: 'IGN · Información Geográfica de Referencia de Poblaciones',
      description: 'Geometrías y denominaciones de núcleos, poblaciones y agrupaciones no residenciales. Es una base nacional de referencia para localizar entidades y contrastar despoblados, no una capa arqueológica.',
      url: 'https://datos.gob.es/es/catalogo/e00125901-https-centrodedescargas-cnig-es-centrodescargas-poblaciones',
      license: 'CC BY 4.0 IGN'
    },
    {
      group: 'Nacional · población',
      label: 'INE · Nomenclátor por unidad poblacional',
      description: 'Relación anual de entidades, núcleos y diseminados con población. Permite filtrar unidades con población cero, pero la descarga y la definición estadística deben conservarse como fuente.',
      url: 'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736177010&idp=1254735572981',
      license: 'Consultar condiciones INE'
    },
    {
      group: 'Despoblados · geometría publicada',
      label: 'Castilla y León · límites de entidades y despoblados',
      description: 'Capa autonómica que declara incluir núcleos, asentamientos diseminados, despoblados y otros recintos. No se presenta como inventario nacional.',
      url: 'https://datos.gob.es/es/catalogo/a07002862-limites-de-entidades-de-poblacion-de-castilla-y-leon-recintos',
      downloadUrl: 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/sunuc_urb_cyl_recintos/exports/geojson?lang=es&timezone=Europe%2FMadrid',
      license: 'Licencia de datos abiertos de Castilla y León'
    },
    {
      group: 'Despoblados · geometría publicada',
      label: 'MITECO · poblaciones aisladas de España',
      description: 'Capa estatal de poblaciones aisladas según el criterio ambiental del RD 1481/2001. Ayuda a localizar asentamientos remotos, pero no debe confundirse con despoblados históricos ni con yacimientos.',
      url: 'https://datos.gob.es/es/catalogo/e0dat0002-poblaciones-aisladas',
      downloadUrl: 'https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/poblaciones-aisladas_tcm30-450725.zip',
      license: 'CC BY 4.0'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Andalucía · DERA / WFS de patrimonio',
      description: 'Servicio oficial de datos espaciales de referencia; su grupo Patrimonio puede aportar elementos patrimoniales y topónimos relacionados.',
      url: 'http://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=wfs&request=getcapabilities',
      license: 'Consultar licencia del IECA'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Castilla-La Mancha · Red de Patrimonio Histórico',
      description: 'Portal oficial con yacimientos arqueológicos y monumentos puestos en valor; es una fuente parcial y orientada a visita pública.',
      url: 'http://datosabiertos.castillalamancha.es/node/224',
      license: 'CC BY-SA 3.0 ES'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Galicia · Bienes de Interés Cultural',
      description: 'Distribución oficial de BIC de Galicia. Incluye patrimonio protegido, no todos los yacimientos inventariados.',
      url: 'https://datos.gob.es/es/catalogo/a12002994-bienes-de-interes-cultural-bic1',
      downloadUrl: 'https://abertos.xunta.gal/catalogo/administracion-publica/-/dataset/0375/bens-interese-cultural-bic/001/descarga-directa-ficheiro.ods',
      license: 'CC BY-SA 4.0'
    },
    {
      group: 'Fototeca y vuelos históricos',
      label: 'IGN-CNIG · Fototeca digital',
      description: 'Consulta de fotogramas, huellas de vuelo y disponibilidad de Ruiz de Alda, Americano, Interministerial, Nacional, Costas y PNOA. Ruiz de Alda no se publica como ortofoto nacional completa.',
      url: 'https://fototeca.cnig.es/',
      downloadUrl: 'https://centrodedescargas.cnig.es/CentroDescargas/vuelo-ruiz-alda-cuenca-segura',
      license: 'Consultar condiciones CNIG'
    },
    {
      group: 'Fototeca y vuelos históricos',
      label: 'Ruiz de Alda · fotoplanos Cuenca del Ebro 1927',
      description: 'Mosaicos de fotoplanos históricos de la Cuenca del Ebro. Son pseudo-ortofotos y no deben interpretarse como ortofotos verdaderas.',
      url: 'https://centrodedescargas.cnig.es/CentroDescargas/novedades?codSerie=FPLEB',
      license: 'Consultar condiciones CNIG'
    }
  ];

  const IMAGERY_SERVICES = [
    {
      id: 'pnoa-historico',
      label: 'IGN · PNOA anual e histórico',
      url: 'https://www.ign.es/wms/pnoa-historico',
      capabilities: 'https://www.ign.es/wms/pnoa-historico?request=GetCapabilities&service=WMS',
      attribution: '© IGN-CNIG · PNOA histórico',
      layers: [
        ...Array.from({ length: 21 }, (_, index) => 2024 - index).map((year) => ({ name: `PNOA${year}`, title: `PNOA anual ${year}` })),
        { name: 'pnoa10_2018', title: 'PNOA10 · Galicia 2018' },
        { name: 'pnoa10_2016', title: 'PNOA10 · Madrid 2016' },
        { name: 'pnoa10_2013', title: 'PNOA10 · Madrid 2013' },
        { name: 'pnoa10_2009', title: 'PNOA10 · Madrid 2009' },
        { name: 'pnoa10_2007', title: 'PNOA10 · Castilla-La Mancha 2007' },
        { name: 'pnoa10_2008', title: 'PNOA10 · Illes Balears 2008' },
        { name: 'SIGPAC', title: 'SIGPAC · 1997-2003' },
        { name: 'OLISTAT', title: 'OLISTAT · 1997-1998' },
        { name: 'Nacional_1981-1986', title: 'Vuelo Nacional · 1981-1986' },
        { name: 'Interministerial_1973-1986', title: 'Vuelo Interministerial · 1973-1986' },
        { name: 'AMS_1956-1957', title: 'Americano Serie B · 1956-1957' }
      ]
    },
    {
      id: 'pnoa-ma',
      label: 'IGN · PNOA máxima actualidad',
      url: 'https://www.ign.es/wms-inspire/pnoa-ma',
      capabilities: 'https://www.ign.es/wms-inspire/pnoa-ma?request=GetCapabilities&service=WMS',
      attribution: '© IGN-CNIG · PNOA máxima actualidad',
      layers: [{ name: 'OI.OrthoimageCoverage', title: 'Ortofoto PNOA máxima actualidad' }, { name: 'OI.MosaicElement', title: 'Mosaicos PNOA máxima actualidad' }]
    },
    {
      id: 'ign-base',
      label: 'IGN · cartografía base para contraste',
      url: 'https://www.ign.es/wms-inspire/ign-base',
      capabilities: 'https://www.ign.es/wms-inspire/ign-base?request=GetCapabilities&service=WMS',
      attribution: '© IGN-CNIG · IGN base',
      layers: [{ name: 'IGNBaseTodo', title: 'IGN Base' }, { name: 'IGNBaseTodo-gris', title: 'IGN Base gris' }, { name: 'IGNBaseOrto', title: 'IGN Base orto' }]
    },
    {
      id: 'fototeca',
      label: 'IGN-CNIG · Fototeca (consulta de vuelos)',
      url: 'https://fototeca.cnig.es/wms/fototeca.dll',
      capabilities: 'https://fototeca.cnig.es/wms/fototeca.dll?service=WMS&request=GetCapabilities',
      attribution: '© IGN-CNIG · Fototeca',
      layers: [],
      referenceOnly: true,
      referenceUrl: 'https://fototeca.cnig.es/',
      referenceLinks: [
        { label: 'Ruiz de Alda · Cuenca del Segura 1929-1930', url: 'https://centrodedescargas.cnig.es/CentroDescargas/vuelo-ruiz-alda-cuenca-segura' },
        { label: 'Ruiz de Alda · fotoplanos Cuenca del Ebro 1927', url: 'https://centrodedescargas.cnig.es/CentroDescargas/novedades?codSerie=FPLEB' }
      ]
    },
    {
      id: 'miteco-aisladas',
      label: 'MITECO · poblaciones aisladas (capa de contexto)',
      url: 'https://wms.mapama.gob.es/sig/EvaluacionAmbiental/Residuos/PobAisladas/wms.aspx',
      capabilities: 'https://wms.mapama.gob.es/sig/EvaluacionAmbiental/Residuos/PobAisladas/wms.aspx?request=GetCapabilities&service=WMS',
      attribution: '© MITECO · Poblaciones aisladas',
      layers: [],
      referenceOnly: true,
      referenceHint: 'Este servicio se consulta en el catálogo MITECO; si el navegador bloquea la descarga por CORS, abre el ZIP oficial y cárgalo como capa local.',
      referenceUrl: 'https://datos.gob.es/es/catalogo/e0dat0002-servicio-wms-web-map-service-poblaciones-aisladas',
      referenceLinks: [
        { label: 'Descargar Shapefile ZIP', url: 'https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/poblaciones-aisladas_tcm30-450725.zip' },
        { label: 'Abrir servicio WMS', url: 'https://wms.mapama.gob.es/sig/EvaluacionAmbiental/Residuos/PobAisladas/wms.aspx' }
      ]
    }
  ];

  const DEMO = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { nombre: 'Ejemplo · asentamiento costero', periodo: 'Calcolítico', municipio: 'Registro didáctico', fuente: 'Ejemplo local', descripcion: 'Dato sintético para probar filtros y exportación.' }, geometry: { type: 'Point', coordinates: [-4.42, 36.72] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · necrópolis', periodo: 'Romano', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-3.70, 40.41] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · fortificación', periodo: 'Medieval', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-1.64, 42.82] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · cueva con arte rupestre', periodo: 'Paleolítico', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Point', coordinates: [-2.67, 43.25] } },
      { type: 'Feature', properties: { nombre: 'Ejemplo · estructura hidráulica', periodo: 'No indicado', municipio: 'Registro didáctico', fuente: 'Ejemplo local' }, geometry: { type: 'Polygon', coordinates: [[[-0.38, 39.47], [-0.37, 39.47], [-0.37, 39.48], [-0.38, 39.48], [-0.38, 39.47]]] } }
    ]
  };

  const state = { records: [], selectedId: null, layer: null, photoCache: new Map(), loadedSources: new Map(), imageryLayers: new Map(), imageryCatalog: [], imageryOpacity: .82 };
  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput: $('fileInput'), sourceSelect: $('sourceSelect'), loadSourceBtn: $('loadSourceBtn'), exampleBtn: $('exampleBtn'), customName: $('customName'), customUrl: $('customUrl'), customLoadBtn: $('customLoadBtn'), sourceMeta: $('sourceMeta'), imageryLayerList: $('imageryLayerList'), discoverLayersBtn: $('discoverLayersBtn'), removeImageryBtn: $('removeImageryBtn'), imageryOpacity: $('imageryOpacity'), imageryOpacityValue: $('imageryOpacityValue'), imageryStatus: $('imageryStatus'), loadNgbeBtn: $('loadNgbeBtn'), referenceCatalog: $('referenceCatalog'), approximateBtn: $('approximateBtn'), status: $('status'), filterText: $('filterText'), periodFilter: $('periodFilter'), loadedSourceFilter: $('loadedSourceFilter'), totalCount: $('totalCount'), visibleCount: $('visibleCount'), sourceCount: $('sourceCount'), namedCount: $('namedCount'), approxCount: $('approxCount'), exportGeoBtn: $('exportGeoBtn'), exportCsvBtn: $('exportCsvBtn'), exportReportBtn: $('exportReportBtn'), clearBtn: $('clearBtn'), resultHint: $('resultHint'), resultTable: $('resultTable'), detailPanel: $('detailPanel'), detailTitle: $('detailTitle'), detailMeta: $('detailMeta'), detailProperties: $('detailProperties'), detailLinks: $('detailLinks'), closeDetailBtn: $('closeDetailBtn'), photoBtn: $('photoBtn'), photoStatus: $('photoStatus'), photoGrid: $('photoGrid')
  };

  let map;
  let placeSearch;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function normaliseKey(value) {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function stringValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  function pickValue(properties, aliases) {
    const entries = Object.entries(properties || {});
    const wanted = aliases.map(normaliseKey);
    for (const key of wanted) {
      const found = entries.find(([name, value]) => normaliseKey(name) === key && stringValue(value));
      if (found) return stringValue(found[1]);
    }
    for (const key of wanted) {
      const found = entries.find(([name, value]) => normaliseKey(name).includes(key) && stringValue(value));
      if (found) return stringValue(found[1]);
    }
    return '';
  }

  function parseNumber(value) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = stringValue(value).replace(',', '.');
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function pointFromGeometry(geometry) {
    if (!geometry || !Array.isArray(geometry.coordinates)) return null;
    if (geometry.type === 'Point' && geometry.coordinates.length >= 2) {
      const lng = parseNumber(geometry.coordinates[0]);
      const lat = parseNumber(geometry.coordinates[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    try {
      const points = [];
      const walk = (value) => {
        if (Array.isArray(value) && value.length >= 2 && value.every((item) => typeof item === 'number')) points.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
      };
      walk(geometry.coordinates);
      if (!points.length) return null;
      const lng = points.reduce((sum, point) => sum + point[0], 0) / points.length;
      const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
      return { lat, lng };
    } catch { return null; }
  }

  function pointFromRecord(record, properties) {
    const lat = parseNumber(pickValue(properties, ['lat', 'latitude', 'latitud', 'lat_wgs84', 'y_lat']));
    const lng = parseNumber(pickValue(properties, ['lon', 'lng', 'long', 'longitude', 'longitud', 'lon_wgs84', 'x_lon']));
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    const coordinates = pickValue(properties, ['coordinates', 'coordenadas', 'ubicacion']);
    if (coordinates) {
      const values = coordinates.split(/[;|\s]+/).map(parseNumber).filter((item) => Number.isFinite(item));
      if (values.length >= 2) return { lat: values[0], lng: values[1] };
    }
    return pointFromGeometry(record?.geometry);
  }

  function periodFor(properties, name) {
    const explicit = pickValue(properties, ['periodo', 'period', 'cronologia', 'chronology', 'epoca', 'era', 'datacion', 'fecha']);
    const context = `${explicit} ${name} ${pickValue(properties, ['descripcion', 'description', 'tipo', 'type'])}`;
    const text = context.toLowerCase();
    const categories = [
      ['Paleolítico', ['paleolit', 'musteriense', 'magdaleniense']],
      ['Neolítico / Calcolítico', ['neolit', 'calcolit', 'megalit']],
      ['Edad del Bronce', ['bronce', 'argari', 'talayot']],
      ['Edad del Hierro / Prerromano', ['hierro', 'iber', 'celt', 'protohist', 'prerroman']],
      ['Romano', ['roman', 'romano', 'hispanorrom', 'villa romana']],
      ['Tardoantiguo', ['tardoant', 'visigot', 'paleocrist']],
      ['Medieval', ['medieval', 'andalus', 'islam', 'altomedieval', 'castillo']],
      ['Moderno / Contemporáneo', ['moderno', 'contempor', 'industrial', 'siglo xix', 'siglo xx']]
    ];
    const match = categories.find(([, terms]) => terms.some((term) => text.includes(term)));
    return match ? match[0] : (explicit || 'No indicado');
  }

  function normalisePayload(payload) {
    if (!payload) return [];
    if (payload.type === 'FeatureCollection' && Array.isArray(payload.features)) return payload.features;
    if (payload.type === 'Feature') return [payload];
    if (payload.type && payload.coordinates) return [{ type: 'Feature', geometry: payload, properties: {} }];
    if (Array.isArray(payload)) return payload.flatMap((item) => item?.type === 'FeatureCollection' && Array.isArray(item.features) ? item.features : [item]);
    for (const key of ['features', 'data', 'items', 'results', 'records', 'yacimientos', 'sites']) {
      if (Array.isArray(payload[key])) return payload[key];
      if (payload[key]?.type === 'FeatureCollection') return payload[key].features;
    }
    const values = Object.values(payload).filter((value) => value && typeof value === 'object' && !Array.isArray(value));
    return values.length > 1 ? values : [];
  }

  function makeRecord(raw, source, index) {
    const incoming = raw?.type === 'Feature' ? raw : (raw?.geometry ? { type: 'Feature', geometry: raw.geometry, properties: raw.properties || raw } : { type: 'Feature', geometry: null, properties: raw || {} });
    const properties = { ...(incoming.properties || {}) };
    const name = pickValue(properties, ['nombre', 'name', 'denominacion', 'denominación', 'yacimiento', 'sitio', 'site', 'toponimo', 'topónimo', 'title']) || `Registro ${index + 1}`;
    const point = pointFromRecord(incoming, properties);
    let geometry = incoming.geometry || null;
    if (!geometry && point) geometry = { type: 'Point', coordinates: [point.lng, point.lat] };
    const locationMode = geometry?.type === 'Point' ? 'exacta publicada' : (geometry ? 'área publicada' : 'sin coordenadas');
    const meta = {
      id: `${source.id || 'source'}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      source: source.label,
      sourceId: source.id,
      sourceUrl: source.urls?.[0] || source.url || '',
      catalogUrl: source.catalogUrl || '',
      publisher: source.publisher || 'Fuente aportada por el usuario',
      license: source.license || 'Consultar fuente',
      period: periodFor(properties, name),
      municipality: pickValue(properties, ['municipio', 'municipality', 'localidad', 'poblacion', 'población', 'town', 'city']),
      province: pickValue(properties, ['provincia', 'province', 'territorio', 'territory']),
      region: pickValue(properties, ['comunidad', 'autonomia', 'autonomía', 'region', 'región']),
      code: pickValue(properties, ['codigo', 'código', 'code', 'id', 'referencia', 'reference', 'ref']),
      description: pickValue(properties, ['descripcion', 'descripción', 'description', 'observaciones', 'notes']),
      photoUrl: pickValue(properties, ['foto', 'fotografia', 'fotografía', 'imagen', 'image', 'imageurl', 'urlfoto', 'urlimagen']),
      locationMode,
      locationNote: locationMode === 'sin coordenadas' ? 'La fuente aporta un registro sin geometría; puede completarse con un área aproximada a partir del municipio o topónimo.' : ''
    };
    const feature = { type: 'Feature', geometry, properties };
    Object.defineProperty(feature, '__arqueoId', { value: meta.id, enumerable: false });
    return { feature, meta, point: point || pointFromGeometry(geometry) };
  }

  function sourceForCustom(name, url) {
    return { id: `custom-${Date.now()}`, label: name || 'Fuente personalizada', publisher: 'Aportada por el usuario', format: 'URL', urls: [url], catalogUrl: '', license: 'Consultar fuente', notes: 'Fuente añadida manualmente; conserva su ficha de procedencia.' };
  }

  function setStatus(message, kind = '') {
    els.status.textContent = message;
    els.status.className = `status ${kind}`.trim();
  }

  function initMap() {
    map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([40.25, -3.7], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    placeSearch = window.CartografiaPlaceSearch?.(map, { input: $('placeQuery'), button: $('placeSearchButton'), results: $('placeResults'), status: $('placeStatus'), zoom: 12, onLocate: ({ lat, lng, displayName }) => { map.setView([lat, lng], Math.max(map.getZoom(), 12)); L.popup().setLatLng([lat, lng]).setContent(`<strong>${escapeHtml(displayName)}</strong>`).openOn(map); } });
  }

  function layerKey(serviceId, name) { return `${serviceId}::${name}`; }

  function directXmlText(node, localName) {
    const child = [...(node?.children || [])].find((item) => item.localName === localName);
    return child?.textContent?.trim() || '';
  }

  function parseWmsLayers(xmlText) {
    const document = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (document.querySelector('parsererror')) throw new Error('Capabilities WMS no válido');
    return [...document.getElementsByTagNameNS('*', 'Layer')].map((node) => ({ name: directXmlText(node, 'Name'), title: directXmlText(node, 'Title') })).filter((layer) => layer.name && !/^(default|estilo|info|fondo)$/i.test(layer.name) && !/^estilo[-_]/i.test(layer.name));
  }

  function renderReferenceCatalog() {
    if (!els.referenceCatalog) return;
    const groups = [...new Set(REFERENCE_SOURCES.map((source) => source.group))];
    els.referenceCatalog.innerHTML = groups.map((group) => `<section class="reference-group"><h4>${escapeHtml(group)}</h4>${REFERENCE_SOURCES.filter((source) => source.group === group).map((source) => `<article class="reference-card"><b>${escapeHtml(source.label)}</b><p>${escapeHtml(source.description)}</p><span>${escapeHtml(source.license)}</span><div><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Ficha / servicio ↗</a>${source.downloadUrl ? ` <a href="${escapeHtml(source.downloadUrl)}" target="_blank" rel="noreferrer">Descarga ↗</a>` : ''}</div></article>`).join('')}</section>`).join('');
  }

  function renderImageryCatalog() {
    if (!els.imageryLayerList) return;
    const services = IMAGERY_SERVICES.filter((service) => service.layers.length || service.referenceOnly);
    els.imageryLayerList.innerHTML = services.map((service) => {
      const layers = service.layers.map((layer) => {
        const key = layerKey(service.id, layer.name);
        return `<label class="layer-row"><input type="checkbox" data-imagery-key="${escapeHtml(key)}" ${state.imageryLayers.has(key) ? 'checked' : ''}><span><b>${escapeHtml(layer.title || layer.name)}</b><small>${escapeHtml(layer.name)}</small></span></label>`;
      }).join('');
      const reference = service.referenceOnly ? `<p class="hint">${escapeHtml(service.referenceHint || 'Este servicio se abre en su catálogo oficial; el WMS histórico del PNOA contiene las ortofotos publicadas.')}</p><a href="${escapeHtml(service.referenceUrl)}" target="_blank" rel="noreferrer">Abrir catálogo oficial ↗</a>${(service.referenceLinks || []).map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`).join('')}` : '';
      return `<details class="layer-service" open><summary>${escapeHtml(service.label)} <small>${service.layers.length} capas</small></summary>${layers || reference}</details>`;
    }).join('');
  }

  function addImageryLayer(service, layer) {
    const key = layerKey(service.id, layer.name);
    if (state.imageryLayers.has(key)) return;
    const tileLayer = L.tileLayer.wms(service.url, { layers: layer.name, format: 'image/png', transparent: true, version: '1.3.0', opacity: state.imageryOpacity, maxZoom: 22, attribution: service.attribution });
    tileLayer.addTo(map);
    state.imageryLayers.set(key, tileLayer);
  }

  function removeImageryLayer(key) {
    const tileLayer = state.imageryLayers.get(key);
    if (!tileLayer) return;
    tileLayer.remove();
    state.imageryLayers.delete(key);
  }

  function clearImagery() {
    state.imageryLayers.forEach((layer) => layer.remove());
    state.imageryLayers.clear();
    renderImageryCatalog();
    if (els.imageryStatus) els.imageryStatus.textContent = 'Capas fotográficas retiradas del mapa.';
  }

  async function discoverImageryLayers() {
    els.discoverLayersBtn.disabled = true;
    els.imageryStatus.textContent = 'Consultando GetCapabilities de los servicios oficiales…';
    const results = [];
    for (const service of IMAGERY_SERVICES.filter((item) => item.capabilities && !item.referenceOnly)) {
      try {
        const response = await fetch(service.capabilities, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const layers = parseWmsLayers(await response.text());
        if (layers.length) service.layers = layers;
        results.push(`${service.label}: ${layers.length} capas`);
      } catch (error) {
        results.push(`${service.label}: catálogo no accesible desde este navegador; se mantiene el índice conocido`);
      }
    }
    renderImageryCatalog();
    els.imageryStatus.textContent = `${results.join(' · ')}. Las capas se cargan bajo demanda y permanecen en el navegador.`;
    els.discoverLayersBtn.disabled = false;
  }

  function handleImageryChange(event) {
    const input = event.target.closest('[data-imagery-key]');
    if (!input) return;
    const [serviceId, ...nameParts] = input.dataset.imageryKey.split('::');
    const name = nameParts.join('::');
    const service = IMAGERY_SERVICES.find((item) => item.id === serviceId);
    const layer = service?.layers.find((item) => item.name === name);
    if (!service || !layer) return;
    if (input.checked) addImageryLayer(service, layer); else removeImageryLayer(input.dataset.imageryKey);
    if (els.imageryStatus) els.imageryStatus.textContent = `${state.imageryLayers.size} capa${state.imageryLayers.size === 1 ? '' : 's'} fotográfica${state.imageryLayers.size === 1 ? '' : 's'} visible${state.imageryLayers.size === 1 ? '' : 's'}.`;
  }

  async function loadNGBEInView() {
    const bounds = map.getBounds();
    const source = {
      id: `ngbe-${Date.now()}`,
      label: 'IGN · Nomenclátor Geográfico Básico de España · vista actual',
      publisher: 'Instituto Geográfico Nacional',
      format: 'WFS / GeoJSON',
      urls: [],
      catalogUrl: 'https://www.ign.es/web/rcc-nomenclator-nacional',
      license: 'CC BY 4.0 IGN',
      notes: 'Consulta espacial limitada a la extensión visible; los lugares nombrados contextualizan asentamientos y topónimos, pero no equivalen a yacimientos arqueológicos.'
    };
    const url = new URL('https://www.ign.es/wfs-inspire/ngbe');
    url.search = new URLSearchParams({ service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: 'gn:NamedPlace', outputFormat: 'application/geo+json', srsName: 'EPSG:4326', count: '1000', bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()},EPSG:4326` });
    source.urls = [url.toString()];
    els.loadNgbeBtn.disabled = true;
    sourceDescription(source);
    setStatus('Consultando el NGBE del IGN para la extensión visible…');
    try {
      const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      addPayload(await response.json(), source);
    } catch (error) {
      setStatus(`No se pudo leer el NGBE desde el navegador: ${error.message}. Abre el servicio desde el catálogo de fuentes.`, 'error');
    } finally { els.loadNgbeBtn.disabled = false; }
  }

  function colorFor(period) {
    const colors = { 'Paleolítico': '#e5a65e', 'Neolítico / Calcolítico': '#f0c36c', 'Edad del Bronce': '#df8669', 'Edad del Hierro / Prerromano': '#c979c9', Romano: '#73b7e8', Tardoantiguo: '#91c783', Medieval: '#8c9bea', 'Moderno / Contemporáneo': '#d2d8df' };
    return colors[period] || '#72dfba';
  }

  function recordCenter(record) {
    if (record.point && Number.isFinite(record.point.lat) && Number.isFinite(record.point.lng)) return [record.point.lat, record.point.lng];
    if (!record.feature.geometry) return null;
    try { const bounds = L.geoJSON(record.feature).getBounds(); return bounds.isValid() ? [bounds.getCenter().lat, bounds.getCenter().lng] : null; } catch { return null; }
  }

  function approximateEnvelope(lng, lat, radiusDegrees) {
    return { type: 'Polygon', coordinates: [[[lng - radiusDegrees, lat - radiusDegrees], [lng + radiusDegrees, lat - radiusDegrees], [lng + radiusDegrees, lat + radiusDegrees], [lng - radiusDegrees, lat + radiusDegrees], [lng - radiusDegrees, lat - radiusDegrees]]] };
  }

  function locationQueryFor(record) {
    const area = [record.meta.municipality, record.meta.province, record.meta.region].filter(Boolean).join(', ');
    return area ? `${area}, España` : `${record.meta.name}, España`;
  }

  async function approximateMissingLocations() {
    const candidates = state.records.filter((record) => !record.feature.geometry && (record.meta.municipality || record.meta.province || record.meta.region || record.meta.name)).slice(0, 30);
    if (!candidates.length) { setStatus('No hay registros sin geometría que se puedan aproximar.', 'ok'); return; }
    els.approximateBtn.disabled = true;
    let completed = 0;
    let failed = 0;
    setStatus(`Buscando áreas aproximadas para ${candidates.length} registros…`);
    for (const record of candidates) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.search = new URLSearchParams({ q: locationQueryFor(record), format: 'jsonv2', limit: '1', polygon_geojson: '1', addressdetails: '1' });
        const response = await fetch(url, { mode: 'cors', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const [result] = await response.json();
        if (!result) throw new Error('sin resultado');
        let geometry = result.geojson && ['Polygon', 'MultiPolygon'].includes(result.geojson.type) ? result.geojson : null;
        const lat = parseNumber(result.lat);
        const lng = parseNumber(result.lon);
        if (!geometry && Number.isFinite(lat) && Number.isFinite(lng)) geometry = approximateEnvelope(lng, lat, record.meta.municipality ? .08 : .025);
        if (!geometry) throw new Error('sin geometría');
        record.feature.geometry = geometry;
        record.point = pointFromGeometry(geometry);
        record.meta.locationMode = 'área aproximada';
        record.meta.locationNote = `Envolvente obtenida a partir de “${result.display_name || locationQueryFor(record)}” mediante Nominatim. No es la posición exacta del yacimiento.`;
        record.meta.approximationSource = 'OpenStreetMap Nominatim';
        completed += 1;
      } catch { failed += 1; }
      setStatus(`Áreas aproximadas: ${completed} completadas · ${failed} sin resultado · ${candidates.length - completed - failed} pendientes…`);
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    render();
    setStatus(`Proceso terminado: ${completed} áreas aproximadas añadidas${failed ? ` · ${failed} registros siguen sin geometría` : ''}.`, completed ? 'ok' : 'error');
    els.approximateBtn.disabled = false;
  }

  function filteredRecords() {
    const text = els.filterText.value.trim().toLowerCase();
    const period = els.periodFilter.value;
    const source = els.loadedSourceFilter.value;
    return state.records.filter((record) => {
      const haystack = [record.meta.name, record.meta.municipality, record.meta.province, record.meta.region, record.meta.code, record.meta.description, record.meta.source].join(' ').toLowerCase();
      return (!text || haystack.includes(text)) && (!period || record.meta.period === period) && (!source || record.meta.source === source);
    });
  }

  function renderMap(records) {
    state.layer?.remove();
    const locatedRecords = records.filter((record) => record.feature.geometry);
    if (!locatedRecords.length) { map.setView([40.25, -3.7], 5); return; }
    state.layer = L.geoJSON(locatedRecords.map((record) => record.feature), {
      pointToLayer: (feature, latlng) => { const record = locatedRecords.find((item) => item.feature === feature); const color = colorFor(record?.meta.period); const approximate = record?.meta.locationMode === 'área aproximada'; return L.circleMarker(latlng, { radius: approximate ? 9 : 7, color: approximate ? '#f2bd72' : '#082018', weight: approximate ? 3 : 2, dashArray: approximate ? '5 4' : undefined, fillColor: color, fillOpacity: .9 }); },
      style: (feature) => { const record = locatedRecords.find((item) => item.feature === feature); const color = colorFor(record?.meta.period); const approximate = record?.meta.locationMode === 'área aproximada'; return { color: approximate ? '#f2bd72' : color, weight: approximate ? 3 : 2, dashArray: approximate ? '7 5' : undefined, fillColor: color, fillOpacity: approximate ? .14 : .28 }; },
      onEachFeature: (feature, layer) => { const record = locatedRecords.find((item) => item.feature === feature); if (!record) return; layer.bindTooltip(`${record.meta.name}${record.meta.locationMode === 'área aproximada' ? ' · área aproximada' : ''}`, { sticky: true }); layer.on('click', () => selectRecord(record.meta.id, true)); }
    }).addTo(map);
    const bounds = state.layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(.12), { maxZoom: 14 });
  }

  function renderFilters() {
    const currentPeriod = els.periodFilter.value;
    const periods = [...new Set(state.records.map((record) => record.meta.period).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    els.periodFilter.innerHTML = '<option value="">Todos los periodos</option>' + periods.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    if (periods.includes(currentPeriod)) els.periodFilter.value = currentPeriod;
    const currentSource = els.loadedSourceFilter.value;
    const sources = [...new Set(state.records.map((record) => record.meta.source).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    els.loadedSourceFilter.innerHTML = '<option value="">Todas las fuentes</option>' + sources.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    if (sources.includes(currentSource)) els.loadedSourceFilter.value = currentSource;
  }

  function renderStats(records) {
    els.totalCount.textContent = state.records.length.toLocaleString('es-ES');
    els.visibleCount.textContent = records.length.toLocaleString('es-ES');
    els.sourceCount.textContent = state.loadedSources.size.toLocaleString('es-ES');
    els.namedCount.textContent = state.records.filter((record) => record.meta.name && !record.meta.name.startsWith('Registro ')).length.toLocaleString('es-ES');
    els.approxCount.textContent = state.records.filter((record) => record.meta.locationMode === 'área aproximada').length.toLocaleString('es-ES');
    const enabled = state.records.length > 0;
    [els.exportGeoBtn, els.exportCsvBtn, els.exportReportBtn].forEach((button) => { button.disabled = !enabled; });
    els.approximateBtn.disabled = !state.records.some((record) => !record.feature.geometry);
  }

  function renderTable(records) {
    const limit = 250;
    if (!records.length) { els.resultTable.innerHTML = '<tr><td colspan="5">No hay registros con los filtros actuales.</td></tr>'; els.resultHint.textContent = '0 resultados'; return; }
    els.resultTable.innerHTML = records.slice(0, limit).map((record) => {
      const coord = recordCenter(record);
      const location = coord ? `${coord[1].toFixed(4)}, ${coord[0].toFixed(4)} · ${record.meta.locationMode}` : 'sin coordenadas · completar área';
      return `<tr><td><button class="record-button" data-record-id="${escapeHtml(record.meta.id)}">${escapeHtml(record.meta.name)}<small>${escapeHtml(record.meta.code || record.meta.description || 'Abrir ficha')}</small></button></td><td>${escapeHtml(record.meta.period)}</td><td>${escapeHtml(record.meta.municipality || record.meta.province || '—')}</td><td>${escapeHtml(record.meta.source)}</td><td class="coord">${escapeHtml(location)}</td></tr>`;
    }).join('');
    els.resultHint.textContent = records.length > limit ? `${records.length.toLocaleString('es-ES')} resultados · mostrando ${limit}` : `${records.length.toLocaleString('es-ES')} resultados`;
  }

  function render() {
    const records = filteredRecords();
    renderFilters();
    renderStats(records);
    renderTable(records);
    renderMap(records);
  }

  function selectedRecord() { return state.records.find((record) => record.meta.id === state.selectedId) || null; }

  function selectRecord(id, flyTo = false) {
    const record = state.records.find((item) => item.meta.id === id);
    if (!record) return;
    state.selectedId = id;
    const coord = recordCenter(record);
    if (flyTo && coord) map.setView(coord, Math.max(map.getZoom(), 13), { animate: true });
    els.detailPanel.hidden = false;
    els.detailTitle.textContent = record.meta.name;
    els.detailMeta.innerHTML = [record.meta.period, record.meta.municipality || record.meta.province, record.meta.source, record.meta.locationMode].filter(Boolean).map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join('');
    const skip = new Set(['nombre', 'name', 'periodo', 'period', 'municipio', 'municipality', 'provincia', 'province']);
    const properties = Object.entries(record.feature.properties || {}).filter(([key, value]) => !skip.has(normaliseKey(key)) && value !== null && value !== undefined && stringValue(value));
    els.detailProperties.innerHTML = properties.slice(0, 28).map(([key, value]) => `<dl class="property"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value)}</dd></dl>`).join('') || '<p class="hint">La fuente no publica más atributos descriptivos.</p>';
    const links = [];
    if (record.meta.sourceUrl) links.push(`<a href="${escapeHtml(record.meta.sourceUrl)}" target="_blank" rel="noreferrer">Abrir descarga de la fuente ↗</a>`);
    if (record.meta.catalogUrl) links.push(`<a href="${escapeHtml(record.meta.catalogUrl)}" target="_blank" rel="noreferrer">Ver catálogo y condiciones ↗</a>`);
    if (record.meta.photoUrl) links.push(`<a href="${escapeHtml(record.meta.photoUrl)}" target="_blank" rel="noreferrer">Abrir fotografía publicada ↗</a>`);
    if (record.meta.locationNote) links.push(`<p class="approx-warning"><b>Precisión:</b> ${escapeHtml(record.meta.locationNote)}</p>`);
    if (record.meta.approximationSource) links.push(`<span class="hint">Fuente de la envolvente: ${escapeHtml(record.meta.approximationSource)}</span>`);
    els.detailLinks.innerHTML = links.join('');
    els.photoGrid.replaceChildren();
    els.photoStatus.textContent = 'Se buscan imágenes por nombre y municipio; revisa siempre la relación, licencia y atribución.';
    els.photoBtn.disabled = false;
    if (record.meta.photoUrl) renderPhotos([{ thumburl: record.meta.photoUrl, url: record.meta.photoUrl, title: record.meta.name, license: 'Fuente del registro', artist: record.meta.publisher }], false);
    else if (state.photoCache.has(id)) renderPhotos(state.photoCache.get(id));
  }

  function stripMarkup(value) { return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

  function renderPhotos(items, append = false) {
    if (!append) els.photoGrid.replaceChildren();
    if (!items.length && !els.photoGrid.children.length) { els.photoStatus.textContent = 'No se encontraron imágenes relacionadas en Wikimedia Commons.'; return; }
    els.photoGrid.insertAdjacentHTML('beforeend', items.map((item) => `<figure class="photo-card"><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(item.thumburl || item.url)}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer"></a><figcaption><b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.artist || 'Autoría no indicada')} · ${escapeHtml(item.license || 'Licencia no indicada')}<br><a href="${escapeHtml(item.descriptionurl || item.url)}" target="_blank" rel="noreferrer">Ficha y licencia ↗</a></figcaption></figure>`).join(''));
  }

  async function searchPhotos() {
    const record = selectedRecord();
    if (!record) return;
    if (state.photoCache.has(record.meta.id)) { renderPhotos(state.photoCache.get(record.meta.id)); return; }
    const query = [record.meta.name, record.meta.municipality, record.meta.province].filter(Boolean).join(' ');
    if (!query) { els.photoStatus.textContent = 'El registro no tiene un nombre utilizable para buscar fotografías.'; return; }
    els.photoBtn.disabled = true;
    els.photoStatus.textContent = `Buscando imágenes para “${query}”…`;
    try {
      const queries = [...new Set([query, record.meta.name].filter(Boolean))];
      let items = [];
      for (const currentQuery of queries) {
        const url = new URL('https://commons.wikimedia.org/w/api.php');
        url.search = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: currentQuery, gsrnamespace: '6', gsrlimit: '12', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '520', format: 'json', origin: '*' });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        items = Object.values(json.query?.pages || {}).map((page) => {
          const info = page.imageinfo?.[0] || {};
          const meta = info.extmetadata || {};
          return { title: page.title?.replace(/^File:/, '') || 'Imagen de Commons', url: info.descriptionurl || info.url, descriptionurl: info.descriptionurl, thumburl: info.thumburl || info.url, artist: stripMarkup(meta.Artist?.value || meta.Credit?.value), license: stripMarkup(meta.LicenseShortName?.value || meta.License?.value) };
        }).filter((item) => item.url && item.thumburl);
        if (items.length) break;
      }
      state.photoCache.set(record.meta.id, items);
      renderPhotos(items);
      els.photoStatus.textContent = items.length ? `${items.length} resultado${items.length === 1 ? '' : 's'} relacionados. Comprueba la ficha antes de reutilizar una imagen.` : 'No se encontraron imágenes relacionadas en Wikimedia Commons.';
    } catch (error) {
      els.photoStatus.textContent = 'No se pudo consultar Wikimedia Commons. Revisa la conexión o abre la búsqueda manualmente.';
    } finally { els.photoBtn.disabled = false; }
  }

  function sourceDescription(source) {
    if (!source) { els.sourceMeta.textContent = 'Selecciona una fuente para ver su cobertura, licencia y enlace oficial.'; return; }
    els.sourceMeta.innerHTML = `<b>${escapeHtml(source.label)}</b><br>${escapeHtml(source.publisher)} · ${escapeHtml(source.format)}<br>${escapeHtml(source.notes || '')}<br><span>Licencia: ${escapeHtml(source.license)}</span><br><a href="${escapeHtml(source.catalogUrl || source.urls?.[0] || '#')}" target="_blank" rel="noreferrer">Abrir ficha oficial ↗</a>`;
  }

  function sourceById(id) { return SOURCES.find((source) => source.id === id); }

  function parseCsvText(text) {
    const input = String(text || '').replace(/^\uFEFF/, '');
    const firstLine = input.split(/\r?\n/, 1)[0] || '';
    const candidates = [';', ',', '\t'];
    const delimiter = candidates.sort((a, b) => (firstLine.split(b).length - 1) - (firstLine.split(a).length - 1))[0];
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (char === '"') {
        if (quoted && input[index + 1] === '"') { cell += '"'; index += 1; }
        else quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        row.push(cell.trim()); cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && input[index + 1] === '\n') index += 1;
        row.push(cell.trim()); cell = '';
        if (row.some((value) => value !== '')) rows.push(row);
        row = [];
      } else cell += char;
    }
    if (cell || row.length) { row.push(cell.trim()); if (row.some((value) => value !== '')) rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map((header, index) => header || `campo_${index + 1}`);
    return rows.map((values) => headers.reduce((record, header, index) => { record[header] = values[index] ?? ''; return record; }, {}));
  }

  async function parseResponse(response, url) {
    const contentType = response.headers.get('content-type') || '';
    const isZip = url.toLowerCase().endsWith('.zip') || contentType.includes('zip');
    if (isZip) {
      if (typeof window.shp !== 'function') throw new Error('No se ha cargado el lector Shapefile.');
      return window.shp(await response.arrayBuffer());
    }
    const text = await response.text();
    if (url.toLowerCase().endsWith('.csv') || contentType.includes('csv') || contentType.includes('text/plain')) return parseCsvText(text);
    try { return JSON.parse(text); } catch { throw new Error('La respuesta no es JSON/GeoJSON válido.'); }
  }

  async function fetchSource(source) {
    const errors = [];
    for (const url of source.urls || []) {
      try {
        const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await parseResponse(response, url);
      } catch (error) { errors.push(`${url}: ${error.message}`); }
    }
    throw new Error(`No se pudo leer la fuente desde el navegador. ${errors.join(' · ')}`);
  }

  function addPayload(payload, source) {
    const incoming = normalisePayload(payload);
    const records = incoming.map((raw, index) => makeRecord(raw, source, index)).filter(Boolean);
    if (!records.length) throw new Error('La fuente no contiene entidades reconocibles.');
    state.records.push(...records);
    state.loadedSources.set(source.id, source);
    render();
    const located = records.filter((record) => record.feature.geometry).length;
    setStatus(`${source.label}: ${records.length.toLocaleString('es-ES')} registros añadidos · ${located.toLocaleString('es-ES')} con geometría · ${(records.length - located).toLocaleString('es-ES')} sin coordenadas.`, 'ok');
  }

  async function loadSource(source) {
    if (!source) return;
    sourceDescription(source);
    els.loadSourceBtn.disabled = true;
    setStatus(`Descargando ${source.label}…`);
    try { const payload = await fetchSource(source); addPayload(payload, source); }
    catch (error) { setStatus(`${error.message} Puedes descargar la fuente y abrirla como archivo local.`, 'error'); }
    finally { els.loadSourceBtn.disabled = false; }
  }

  async function loadFile(file) {
    const extension = file.name.toLowerCase();
    const format = extension.endsWith('.zip') ? 'Shapefile ZIP' : (extension.endsWith('.csv') ? 'CSV' : 'GeoJSON / JSON');
    const source = { id: `local-${Date.now()}`, label: `Archivo local · ${file.name}`, publisher: 'Archivo aportado por el usuario', format, urls: [], catalogUrl: '', license: 'Según el archivo', notes: 'Cargado localmente; no se ha transmitido a ningún servidor.' };
    setStatus(`Analizando ${file.name} en este navegador…`);
    try {
      let payload;
      if (file.name.toLowerCase().endsWith('.zip')) {
        if (typeof window.shp !== 'function') throw new Error('No se ha cargado el lector Shapefile.');
        payload = await window.shp(await file.arrayBuffer());
      } else if (extension.endsWith('.csv')) payload = parseCsvText(await file.text());
      else payload = JSON.parse(await file.text());
      addPayload(payload, source);
    } catch (error) { setStatus(`No se pudo leer ${file.name}: ${error.message}`, 'error'); }
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportFeatures() {
    const records = filteredRecords();
    const features = records.filter((record) => record.feature.geometry).map((record) => ({ ...record.feature, properties: { ...record.feature.properties, _arqueo_source: record.meta.source, _arqueo_source_url: record.meta.sourceUrl || undefined, _arqueo_catalog_url: record.meta.catalogUrl || undefined, _arqueo_period: record.meta.period, _arqueo_location_mode: record.meta.locationMode, _arqueo_location_note: record.meta.locationNote || undefined } }));
    download('arqueo-atlas-seleccion.geojson', JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'application/geo+json');
  }

  function exportCsv() {
    const rows = [['id', 'nombre', 'periodo', 'municipio', 'provincia', 'fuente', 'tipo_ubicacion', 'latitud', 'longitud', 'url_fuente', 'nota_ubicacion']];
    filteredRecords().forEach((record) => { const coord = recordCenter(record); rows.push([record.meta.code || record.meta.id, record.meta.name, record.meta.period, record.meta.municipality, record.meta.province, record.meta.source, record.meta.locationMode, coord?.[0] ?? '', coord?.[1] ?? '', record.meta.sourceUrl, record.meta.locationNote]); });
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    download('arqueo-atlas-inventario.csv', `\ufeff${csv}`, 'text/csv;charset=utf-8');
  }

  function exportReport() {
    const records = filteredRecords();
    const report = { generatedAt: new Date().toISOString(), tool: 'Arqueo Atlas', totalLoaded: state.records.length, totalExported: records.length, filters: { text: els.filterText.value, period: els.periodFilter.value, source: els.loadedSourceFilter.value }, sources: [...state.loadedSources.values()].map((source) => ({ id: source.id, label: source.label, publisher: source.publisher, format: source.format, urls: source.urls, catalogUrl: source.catalogUrl, license: source.license, notes: source.notes, recordsLoaded: state.records.filter((record) => record.meta.sourceId === source.id).length })) };
    download('arqueo-atlas-procedencia.json', JSON.stringify(report, null, 2), 'application/json');
  }

  function clearAll() {
    state.records = []; state.loadedSources.clear(); state.selectedId = null; state.photoCache.clear(); state.layer?.remove(); state.layer = null; els.detailPanel.hidden = true; els.resultTable.innerHTML = '<tr><td colspan="5">Todavía no hay registros.</td></tr>'; els.resultHint.textContent = 'Carga una fuente pública o una capa local.'; renderFilters(); renderStats([]); map.setView([40.25, -3.7], 5); setStatus('Sin capas cargadas');
  }

  function init() {
    SOURCES.forEach((source) => els.sourceSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(source.id)}">${escapeHtml(source.label)}</option>`));
    sourceDescription(SOURCES[0]);
    els.sourceSelect.addEventListener('change', () => sourceDescription(sourceById(els.sourceSelect.value)));
    els.loadSourceBtn.addEventListener('click', () => loadSource(sourceById(els.sourceSelect.value)));
    els.exampleBtn.addEventListener('click', () => { addPayload(DEMO, { id: 'demo', label: 'Ejemplo didáctico local', publisher: 'Arqueo Atlas', format: 'GeoJSON', urls: [], catalogUrl: '', license: 'Datos sintéticos', notes: 'Registros ficticios para comprobar la herramienta.' }); });
    els.fileInput.addEventListener('change', () => { const [file] = els.fileInput.files || []; if (file) loadFile(file); els.fileInput.value = ''; });
    els.customLoadBtn.addEventListener('click', () => { const url = els.customUrl.value.trim(); if (!/^https?:\/\//i.test(url)) { setStatus('Introduce una URL HTTP(S) válida.', 'error'); return; } loadSource(sourceForCustom(els.customName.value.trim(), url)); });
    els.imageryLayerList.addEventListener('change', handleImageryChange);
    els.discoverLayersBtn.addEventListener('click', discoverImageryLayers);
    els.removeImageryBtn.addEventListener('click', clearImagery);
    els.imageryOpacity.addEventListener('input', () => { state.imageryOpacity = Number(els.imageryOpacity.value); els.imageryOpacityValue.textContent = `${Math.round(state.imageryOpacity * 100)}%`; state.imageryLayers.forEach((layer) => layer.setOpacity(state.imageryOpacity)); });
    els.loadNgbeBtn.addEventListener('click', loadNGBEInView);
    els.approximateBtn.addEventListener('click', approximateMissingLocations);
    [els.filterText, els.periodFilter, els.loadedSourceFilter].forEach((element) => element.addEventListener('input', render));
    els.resultTable.addEventListener('click', (event) => { const button = event.target.closest('[data-record-id]'); if (button) selectRecord(button.dataset.recordId, true); });
    els.closeDetailBtn.addEventListener('click', () => { els.detailPanel.hidden = true; state.selectedId = null; });
    els.photoBtn.addEventListener('click', searchPhotos);
    els.exportGeoBtn.addEventListener('click', exportFeatures); els.exportCsvBtn.addEventListener('click', exportCsv); els.exportReportBtn.addEventListener('click', exportReport); els.clearBtn.addEventListener('click', clearAll);
    initMap();
    renderReferenceCatalog();
    renderImageryCatalog();
    render();
    discoverImageryLayers();
  }

  init();
})();
