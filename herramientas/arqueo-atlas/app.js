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
    },
    {
      id: 'caceres-ribera-marco',
      label: 'Cáceres · patrimonio arqueológico de La Ribera del Marco',
      publisher: 'Ayuntamiento de Cáceres · IDE Cáceres',
      format: 'WFS / GeoJSON',
      urls: ['https://ide.caceres.es/geoserver/Archivo_Historico/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Archivo_Historico%3ARIBERA&outputFormat=application%2Fjson'],
      catalogUrl: 'https://datos.gob.es/gl/catalogo/l01100377-inventario-informativo-del-patrimonio-de-la-ribera-del-marco',
      license: 'Consultar condiciones de la fuente',
      notes: 'Inventario local con categorías arqueológicas, etnográficas, hidráulicas y ambientales de La Ribera del Marco. Cobertura local de Cáceres; no es una capa nacional.'
    },
    {
      id: 'madrid-bic-inmuebles',
      label: 'Comunidad de Madrid · inmuebles BIC (443 registros)',
      publisher: 'Comunidad de Madrid · Dirección General de Patrimonio Cultural',
      format: 'JSON',
      urls: ['https://datos.comunidad.madrid/dataset/dde86e1d-a06b-4f65-8668-920a566fa264/resource/c243eee1-2c1e-4dfc-92b8-624a5bb5ed8b/download/inmuebles_bic.json'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/a13002908-patrimonio-cultural-protegido-en-la-comunidad-de-madrid',
      license: 'CC BY 4.0',
      notes: 'Registro público de inmuebles BIC. La distribución aporta municipio y denominación, pero no coordenadas; Arqueo Atlas conserva el registro y permite completar una envolvente aproximada.'
    },
    {
      id: 'barcelona-carta-2022-local',
      label: 'Barcelona · Carta arqueológica 2022 (copia local trazable)',
      publisher: 'Ajuntament de Barcelona · Servei d’Arqueologia',
      format: 'GeoJSON local',
      urls: ['./datos/barcelona-carta-2022.geojson'],
      catalogUrl: 'https://datos.gob.es/es/catalogo/l01080193-carta-arqueologica-de-la-ciudad-de-barcelona',
      license: 'CC BY 4.0',
      notes: 'Copia local de la distribución pública 2022 incluida para evitar el bloqueo CORS del servidor original. Conserva geometrías y propiedades publicadas; cobertura Barcelona.'
    },
    {
      id: 'andalucia-reca-puntos',
      label: 'Andalucía · enclaves arqueológicos e históricos (puntos)',
      publisher: 'Junta de Andalucía · DERA / IECA',
      format: 'WFS / GeoJSON',
      urls: ['https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=DERA_g11_patrimonio%3Ag11_03_Reca_pun'],
      catalogUrl: 'https://ws089.juntadeandalucia.es/institutodeestadisticaycartografia/dega/datos-espaciales-de-referencia-de-andalucia-dera/registro-de-actualizaciones',
      license: 'CC BY 4.0 Junta de Andalucía',
      notes: 'Capa puntual de Conjuntos Culturales y Enclaves Arqueológicos e Históricos de la RECA. Cobertura Andalucía; no equivale a todo el inventario arqueológico andaluz.'
    },
    {
      id: 'andalucia-reca-poligonos',
      label: 'Andalucía · enclaves arqueológicos e históricos (áreas)',
      publisher: 'Junta de Andalucía · DERA / IECA',
      format: 'WFS / GeoJSON',
      urls: ['https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=DERA_g11_patrimonio%3Ag11_03_Reca_pol'],
      catalogUrl: 'https://www.juntadeandalucia.es/organismos/culturapatrimoniohistoricoydeporte/areas/cultura/bienes-culturales/catalogo-pha.html',
      license: 'CC BY 4.0 Junta de Andalucía',
      notes: 'Delimitaciones poligonales de Conjuntos Culturales y Enclaves Arqueológicos e Históricos de la RECA. Conserva la geometría de área publicada.'
    },
    {
      id: 'andalucia-cuevas',
      label: 'Andalucía · cuevas',
      publisher: 'Junta de Andalucía · DERA / IECA',
      format: 'WFS / GeoJSON',
      urls: ['https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=DERA_g11_patrimonio%3Ag11_05_Cavidad'],
      catalogUrl: 'https://ws089.juntadeandalucia.es/institutodeestadisticaycartografia/dega/datos-espaciales-de-referencia-de-andalucia-dera/registro-de-actualizaciones',
      license: 'CC BY 4.0 Junta de Andalucía',
      notes: 'Capa de cuevas del DERA; es contexto de prospección y patrimonio natural, no todos sus registros son arqueológicos.'
    },
    {
      id: 'andalucia-bienes-protegidos',
      label: 'Andalucía · bienes protegidos (áreas)',
      publisher: 'Junta de Andalucía · DERA / IECA',
      format: 'WFS / GeoJSON',
      urls: ['https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=DERA_g11_patrimonio%3Ag11_18_BienesProtegidos_pol'],
      catalogUrl: 'https://www.juntadeandalucia.es/organismos/culturapatrimoniohistoricoydeporte/areas/cultura/bienes-culturales/catalogo-pha.html',
      license: 'CC BY 4.0 Junta de Andalucía',
      notes: 'Ámbitos poligonales de bienes protegidos del Catálogo General del Patrimonio Histórico Andaluz. Incluye categorías diversas; filtra y contrasta la tipología antes de usarla como arqueología.'
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
      label: 'Barcelona · Carta arqueológica (2014–2022)',
      description: 'Conjunto oficial del Servei d’Arqueologia de Barcelona con cartas anuales en GeoJSON/KMZ y restos documentados desde la prehistoria hasta la Guerra Civil. El servidor municipal no permite lectura CORS desde la aplicación, por lo que se ofrece como descarga local trazable.',
      url: 'https://datos.gob.es/es/catalogo/l01080193-carta-arqueologica-de-la-ciudad-de-barcelona',
      downloadUrl: 'https://opendata-ajuntament.barcelona.cat/data/dataset/b58a1160-0d27-45d3-91a6-f93efee0c916/resource/98f39a8e-7d76-4789-b275-b1160ed8bf65/download',
      license: 'CC BY 4.0'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Cáceres · Inventario de La Ribera del Marco',
      description: 'Servicio WFS/GeoJSON local con elementos arqueológicos, etnográficos, hidráulicos y ambientales. Se carga directamente desde el navegador y sus atributos se conservan en la ficha.',
      url: 'https://datos.gob.es/gl/catalogo/l01100377-inventario-informativo-del-patrimonio-de-la-ribera-del-marco',
      downloadUrl: 'https://ide.caceres.es/geoserver/Archivo_Historico/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Archivo_Historico%3ARIBERA&outputFormat=application%2Fjson',
      license: 'Consultar condiciones de la fuente'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Comunidad de Madrid · patrimonio cultural protegido',
      description: 'Registro público de bienes BIC/BIP, incluidos bienes con categoría arqueológica o paleontológica. La distribución de inmuebles aporta 443 registros con municipio y denominación, pero no coordenadas puntuales.',
      url: 'https://datos.gob.es/es/catalogo/a13002908-patrimonio-cultural-protegido-en-la-comunidad-de-madrid',
      downloadUrl: 'https://datos.comunidad.madrid/dataset/dde86e1d-a06b-4f65-8668-920a566fa264/resource/c243eee1-2c1e-4dfc-92b8-624a5bb5ed8b/download/inmuebles_bic.json',
      license: 'CC BY 4.0'
    },
    {
      group: 'Arqueología · fuentes autonómicas',
      label: 'Andalucía · DERA patrimonio arqueológico e histórico',
      description: 'El DERA publica las capas RECA de enclaves arqueológicos e históricos, cuevas y bienes protegidos mediante WFS; las fuentes cargables del atlas separan puntos, áreas y contexto.',
      url: 'https://www.juntadeandalucia.es/organismos/culturapatrimoniohistoricoydeporte/areas/cultura/bienes-culturales/catalogo-pha.html',
      downloadUrl: 'https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?service=WFS&request=GetCapabilities',
      license: 'CC BY 4.0 Junta de Andalucía'
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

  const cartoWms = (id, group, label, service, layerName, options = {}) => ({ id, group, label, short: options.short || 'WMS público', type: 'wms', service, layerName, format: options.format || 'image/png', transparent: options.transparent !== false, attribution: options.attribution || 'Servicio cartográfico público', opacity: options.opacity ?? .78 });
  const cartoXyz = (id, group, label, url, options = {}) => ({ id, group, label, short: options.short || 'Teselas XYZ públicas', type: 'xyz', url, attribution: options.attribution || 'Teselas públicas', opacity: options.opacity ?? .84, maxZoom: options.maxZoom || 19 });
  const IGN_PNOA = 'https://www.ign.es/wms/pnoa-historico';
  const IGN_MDT = 'https://servicios.idee.es/wms-inspire/mdt';
  const IGME_GEODE = 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_Geode_50/MapServer/WMSServer';
  const IGME_MAGNA = 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_MAGNA_50/MapServer/WMSServer';
  const IGME_TECTONIC = 'https://mapas.igme.es/gis/services/Cartografia_Tematica/IGME_Tectonico_1M/MapServer/WMSServer';
  const IGME_EUROPE = 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_EP_Geologico_1M_2018/MapServer/WMSServer';
  const IGME_MOVES = 'https://mapas.igme.es/gis/services/BasesDatos/IGME_BDMoves_ES/MapServer/WMSServer';

  const CARTO_LAYER_CATALOG = [
    cartoWms('carto-pnoa-current', 'IGN · relieve y teledetección', 'PNOA máxima actualidad', 'https://www.ign.es/wms-inspire/pnoa-ma', 'OI.OrthoimageCoverage', { format: 'image/jpeg', transparent: false, opacity: .9, short: 'Ortoimagen nacional · WMS', attribution: 'PNOA / IGN' }),
    cartoWms('carto-pnoa-mosaic', 'IGN · relieve y teledetección', 'PNOA mosaico histórico disponible', 'https://www.ign.es/wms-inspire/pnoa-ma', 'OI.MosaicElement', { format: 'image/jpeg', transparent: false, short: 'Mosaico ortofotográfico · WMS', attribution: 'PNOA / IGN' }),
    ...Array.from({ length: 21 }, (_, index) => { const year = 2024 - index; return cartoWms(`carto-pnoa-${year}`, 'IGN · ortofotos históricas', `PNOA anual ${year}`, IGN_PNOA, `PNOA${year}`, { format: 'image/jpeg', transparent: false, short: 'Ortofoto anual histórica · WMS', attribution: 'PNOA histórico / IGN-CNIG' }); }),
    cartoWms('carto-sigpac', 'IGN · vuelos históricos', 'SIGPAC (1997–2003)', IGN_PNOA, 'SIGPAC', { short: 'Ortofoto histórica · WMS', attribution: 'IGN-CNIG · SIGPAC' }),
    cartoWms('carto-olistat', 'IGN · vuelos históricos', 'OLISTAT (1997–1998)', IGN_PNOA, 'OLISTAT', { short: 'Ortofoto histórica · WMS', attribution: 'IGN-CNIG · OLISTAT' }),
    cartoWms('carto-national', 'IGN · vuelos históricos', 'Vuelo Nacional (1981–1986)', IGN_PNOA, 'Nacional_1981-1986', { short: 'Fotografía aérea histórica · WMS', attribution: 'IGN-CNIG · Vuelo Nacional' }),
    cartoWms('carto-interministerial', 'IGN · vuelos históricos', 'Vuelo Interministerial (1973–1986)', IGN_PNOA, 'Interministerial_1973-1986', { short: 'Fotografía aérea histórica · WMS', attribution: 'IGN-CNIG · Vuelo Interministerial' }),
    cartoWms('carto-american-b', 'IGN · vuelos históricos', 'Vuelo Americano Serie B (1956–1957)', IGN_PNOA, 'AMS_1956-1957', { short: 'Fotografía aérea histórica · WMS', attribution: 'CEGET / IGN-CNIG' }),
    cartoWms('carto-pnoa-flights', 'IGN · vuelos históricos', 'Años de los vuelos PNOA', IGN_PNOA, 'infoVuelos', { short: 'Índice de vuelos · WMS', attribution: 'IGN-CNIG' }),
    cartoWms('carto-mtn-first', 'IGN · cartografía histórica', 'Primera edición MTN25', 'https://www.ign.es/wms/primera-edicion-mtn', 'MTN25', { short: 'Mapa topográfico histórico · WMS', attribution: 'IGN-CNIG' }),
    cartoWms('carto-minutas', 'IGN · cartografía histórica', 'Minutas cartográficas (1870–1950)', 'https://www.ign.es/wms/minutas-cartograficas', 'Minutas', { short: 'Minutas históricas · WMS', attribution: 'IGN-CNIG' }),
    cartoWms('carto-raster', 'IGN · cartografía histórica', 'Mapas raster del IGN', 'https://www.ign.es/wms-inspire/mapa-raster', 'mtn_rasterizado', { short: 'Cartografía raster · WMS', attribution: 'IGN-CNIG' }),
    cartoWms('carto-mdt-relief', 'IGN · relieve', 'MDT · mapa del relieve (5 m)', IGN_MDT, 'relieve', { short: 'Modelo digital del terreno · WMS', attribution: 'IGN · MDT' }),
    cartoWms('carto-mdt-hillshade', 'IGN · relieve', 'MDT · sombreado (5 m)', IGN_MDT, 'sombreado', { short: 'Sombreado del relieve · WMS', attribution: 'IGN · MDT' }),
    cartoWms('carto-mdt-slope', 'IGN · relieve', 'MDT · pendientes (25 m)', IGN_MDT, 'Pendientes', { short: 'Pendientes · WMS', attribution: 'IGN · MDT' }),
    cartoWms('carto-mdt-aspect', 'IGN · relieve', 'MDT · orientaciones (25 m)', IGN_MDT, 'Orientaciones', { short: 'Orientaciones · WMS', attribution: 'IGN · MDT' }),
    cartoWms('carto-scuam-lopez', 'Cartografía histórica', 'SCUAM · Tomás López (1773)', 'https://guiadigital.uam.es/geoserver/atlas_lopez_UAM_WMS/wms?', 'ATLopez_Madrid_1773_lam1_UAM', { short: 'Mapa histórico georreferenciado · WMS', attribution: 'SCUAM / UAM' }),
    cartoWms('carto-igme-ibiza', 'IGME · geología insular', 'Geológico de Ibiza y Formentera 1:100.000', 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_GeologicoIbiza_100/MapServer/WMSServer', '0', { short: 'Mapa geológico · WMS', attribution: 'IGME' }),
    cartoWms('carto-igme-menorca', 'IGME · geología insular', 'Geológico de Menorca 1:100.000', 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_GeologicoMenorca_100/MapServer/WMSServer', '0', { short: 'Mapa geológico · WMS', attribution: 'IGME' }),
    cartoWms('carto-igme-lapalma', 'IGME · geología insular', 'Geológico de La Palma 1:100.000', 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_GeologicoLaPalma_100/MapServer/WMSServer', '0', { short: 'Mapa geológico · WMS', attribution: 'IGME' }),
    cartoWms('carto-igme-metalogenia', 'IGME · recursos y riesgos', 'Metalogenia · yacimientos e indicios minerales', 'https://mapas.igme.es/gis/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/WMSServer', '0', { short: 'Base de datos minera · WMS', attribution: 'IGME' }),
    ...[
      ['Zonas GEODE', '0'], ['Recintos geología GEODE', '1'], ['Contactos GEODE', '2'], ['Cuaternario · recintos GEODE', '3'], ['Cuaternario · líneas GEODE', '4'], ['Ejes GEODE', '5'], ['Buzamientos GEODE', '6'], ['Rótulos y líneas GEODE', '7']
    ].map(([label, layer]) => cartoWms(`carto-geode-${layer}`, 'IGME · GEODE continuo 1:50.000', label, IGME_GEODE, layer, { short: 'Mapa geológico continuo · WMS', attribution: 'IGME · GEODE' })),
    ...[
      ['Litologías color MAGNA', '0'], ['Litologías tramas MAGNA', '1'], ['Contactos y fallas MAGNA', '2'], ['Estructuras de plegamiento MAGNA', '3'], ['Elementos diversos MAGNA', '4'], ['Líneas diversas MAGNA', '5'], ['Medidas estructurales MAGNA', '6'], ['Elementos puntuales MAGNA', '7'], ['Identificadores lineales MAGNA', '8'], ['Identificadores anotados MAGNA', '9'], ['Medidas estructurales anotadas MAGNA', '10'], ['Hojas MAGNA 1:50.000', '11']
    ].map(([label, layer]) => cartoWms(`carto-magna-${layer}`, 'IGME · MAGNA 1:50.000', label, IGME_MAGNA, layer, { short: 'Cartografía geológica · WMS', attribution: 'IGME · MAGNA' })),
    ...[
      ['Unidades tectónicas 1:1.000.000', '0'], ['Unidades de metamorfismo 1:1.000.000', '1'], ['Elementos diversos tectónicos', '2'], ['Estructuras de plegamiento tectónicas', '3'], ['Contactos y fallas tectónicos', '4'], ['Elementos puntuales tectónicos', '5']
    ].map(([label, layer]) => cartoWms(`carto-tectonic-${layer}`, 'IGME · tectónica 1:1.000.000', label, IGME_TECTONIC, layer, { short: 'Mapa tectónico · WMS', attribution: 'IGME' })),
    ...[
      ['Unidades geológicas plataforma peninsular y Baleares', '0'], ['Unidades geológicas plataforma Canarias', '1'], ['Unidades geológicas generales', '2'], ['Estructuras peninsulares y Baleares', '3'], ['Estructuras de plataforma', '4'], ['Formas Canarias', '5'], ['Diques', '6'], ['Volcanes', '7']
    ].map(([label, layer]) => cartoWms(`carto-europe-${layer}`, 'IGME · geología nacional 1:1.000.000', label, IGME_EUROPE, layer, { short: 'Mapa geológico nacional · WMS', attribution: 'IGME' })),
    ...[
      ['Masas movidas BDMOVES', '0'], ['Zonas de movimientos generalizados BDMOVES', '1'], ['Flujos de derrubios BDMOVES', '2'], ['Escarpes BDMOVES', '3'], ['Eventos observados BDMOVES', '4']
    ].map(([label, layer]) => cartoWms(`carto-moves-${layer}`, 'IGME · movimientos del terreno', label, IGME_MOVES, layer, { short: 'Base de datos de movimientos · WMS', attribution: 'IGME · BDMOVES' })),
    cartoWms('carto-qafi', 'IGME · riesgos geológicos', 'Fallas del Cuaternario de Iberia (QAFI)', 'https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_EP_Geologico_1M_2018/MapServer/WMSServer', '2', { short: 'Base de fallas cuaternarias · WMS', attribution: 'IGME · QAFI' }),
    cartoWms('carto-zesis', 'IGME · riesgos geológicos', 'Zonas sismogénicas de la Península Ibérica', 'https://mapas.igme.es/gis/services/BasesDatos/IGME_ZESIS/MapServer/WMSServer', '2', { short: 'Zonificación sísmica · WMS', attribution: 'IGME · ZESIS' }),
    cartoXyz('carto-esri-imagery', 'Bases globales', 'Esri World Imagery', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { short: 'Imagen satélite global · XYZ', attribution: 'Esri, Maxar, Earthstar Geographics', opacity: .9 }),
    cartoXyz('carto-opentopo', 'Bases globales', 'OpenTopoMap', 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { short: 'Topografía mundial · XYZ', attribution: 'OpenTopoMap · OpenStreetMap contributors' }),
    cartoXyz('carto-natgeo', 'Bases globales', 'Esri National Geographic', 'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { short: 'Mapa mundial de referencia · XYZ', attribution: 'Esri' }),
    ...[
      ['Infrarrojo global', 'globalir'], ['Vapor de agua global', 'globalwv'], ['Espectro visible global', 'globalvis'], ['Espectro visible global 1 km', 'global1kmvis'], ['Infrarrojo CONUS', 'conusir']
    ].map(([label, product]) => cartoXyz(`carto-ssec-${product}`, 'Teledetección · UW-Madison SSEC', label, `https://re.ssec.wisc.edu/api/image?products=${product}&x={x}&y={y}&z={z}`, { short: 'Imagen meteorológica · XYZ', attribution: 'UW-Madison SSEC' }))
  ];

  const CARTO_REFERENCE_LAYERS = [
    { label: 'Ruiz de Alda · Cuenca del Segura (1929–1930)', description: 'Fotogramas y fotoplanos históricos consultables en la Fototeca/CNIG; no se fuerza una capa WMS si el proveedor no la publica como ortofoto nacional.', url: 'https://centrodedescargas.cnig.es/CentroDescargas/vuelo-ruiz-alda-cuenca-segura' },
    { label: 'Ruiz de Alda · Cuenca del Ebro (1927)', description: 'Mosaicos de fotoplanos históricos; deben tratarse como referencia histórica y no como ortofoto verdadera.', url: 'https://centrodedescargas.cnig.es/CentroDescargas/novedades?codSerie=FPLEB' },
    { label: 'Fototeca digital IGN-CNIG', description: 'Huellas de vuelo, fotogramas y disponibilidad de vuelos históricos.', url: 'https://fototeca.cnig.es/' }
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

  const state = { records: [], selectedId: null, layer: null, photoCache: new Map(), loadedSources: new Map(), imageryLayers: new Map(), imageryCatalog: [], imageryOpacity: .82, baseLayers: new Map(), baseLayer: null, scaleControl: null, cartoLayers: new Map(), cartoOrder: [], cartoFilter: '', swipeEnabled: false, swipeLayerId: '', swipePosition: 50, measure: { mode: '', points: [], layer: null }, clicked: null };
  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput: $('fileInput'), sourceSelect: $('sourceSelect'), loadSourceBtn: $('loadSourceBtn'), exampleBtn: $('exampleBtn'), customName: $('customName'), customUrl: $('customUrl'), customLoadBtn: $('customLoadBtn'), sourceMeta: $('sourceMeta'), imageryLayerList: $('imageryLayerList'), discoverLayersBtn: $('discoverLayersBtn'), removeImageryBtn: $('removeImageryBtn'), imageryOpacity: $('imageryOpacity'), imageryOpacityValue: $('imageryOpacityValue'), imageryStatus: $('imageryStatus'), loadNgbeBtn: $('loadNgbeBtn'), referenceCatalog: $('referenceCatalog'), approximateBtn: $('approximateBtn'), status: $('status'), filterText: $('filterText'), periodFilter: $('periodFilter'), loadedSourceFilter: $('loadedSourceFilter'), totalCount: $('totalCount'), visibleCount: $('visibleCount'), sourceCount: $('sourceCount'), namedCount: $('namedCount'), approxCount: $('approxCount'), exportGeoBtn: $('exportGeoBtn'), exportCsvBtn: $('exportCsvBtn'), exportReportBtn: $('exportReportBtn'), clearBtn: $('clearBtn'), resultHint: $('resultHint'), resultTable: $('resultTable'), detailPanel: $('detailPanel'), detailTitle: $('detailTitle'), detailMeta: $('detailMeta'), detailProperties: $('detailProperties'), detailLinks: $('detailLinks'), closeDetailBtn: $('closeDetailBtn'), photoBtn: $('photoBtn'), photoStatus: $('photoStatus'), photoGrid: $('photoGrid'), cartoLayerFilter: $('cartoLayerFilter'), baseLayerSelect: $('baseLayerSelect'), cartoHomeBtn: $('cartoHomeBtn'), cartoLocateBtn: $('cartoLocateBtn'), cartoCatalog: $('cartoCatalog'), activeCartoLayers: $('activeCartoLayers'), cartoLayerCount: $('cartoLayerCount'), clearCartoBtn: $('clearCartoBtn'), exportCartoBtn: $('exportCartoBtn'), scaleToggle: $('scaleToggle'), cursorToggle: $('cursorToggle'), navigationToggle: $('navigationToggle'), swipeToggle: $('swipeToggle'), swipeLayer: $('swipeLayer'), swipeRange: $('swipeRange'), swipeOutput: $('swipeOutput'), brightnessRange: $('brightnessRange'), contrastRange: $('contrastRange'), saturationRange: $('saturationRange'), hueRange: $('hueRange'), brightnessOutput: $('brightnessOutput'), contrastOutput: $('contrastOutput'), saturationOutput: $('saturationOutput'), hueOutput: $('hueOutput'), resetImageBtn: $('resetImageBtn'), northBtn: $('northBtn'), customLayerType: $('customLayerType'), customLayerUrl: $('customLayerUrl'), customLayerName: $('customLayerName'), customLayerNameField: $('customLayerNameField'), customLayerLabel: $('customLayerLabel'), customLayerBtn: $('customLayerBtn'), fullscreenBtn: $('fullscreenBtn'), measureDistanceBtn: $('measureDistanceBtn'), measureAreaBtn: $('measureAreaBtn'), clearMeasureBtn: $('clearMeasureBtn'), measureStatus: $('measureStatus'), cursorCoords: $('cursorCoords'), swipeLine: $('swipeLine')
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
    const name = pickValue(properties, ['nombre', 'name', 'denominacion', 'denominación', 'denominacion_registral', 'denominación registral', 'yacimiento', 'sitio', 'site', 'toponimo', 'topónimo', 'title']) || `Registro ${index + 1}`;
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
    const baseDefinitions = [
      ['osm', L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' })],
      ['esri', L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' })],
      ['opentopo', L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'OpenTopoMap · OpenStreetMap contributors' })],
      ['carto-light', L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20, attribution: 'CARTO · OpenStreetMap contributors' })],
      ['carto-dark', L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, attribution: 'CARTO · OpenStreetMap contributors' })]
    ];
    state.baseLayers = new Map(baseDefinitions);
    state.baseLayer = state.baseLayers.get('osm');
    state.baseLayer.addTo(map);
    state.scaleControl = L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    placeSearch = window.CartografiaPlaceSearch?.(map, { input: $('placeQuery'), button: $('placeSearchButton'), results: $('placeResults'), status: $('placeStatus'), zoom: 12, onLocate: ({ lat, lng, displayName }) => { map.setView([lat, lng], Math.max(map.getZoom(), 12)); L.popup().setLatLng([lat, lng]).setContent(`<strong>${escapeHtml(displayName)}</strong>`).openOn(map); } });
    map.on('mousemove', (event) => { if (els.cursorCoords) { els.cursorCoords.textContent = `${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}`; } });
    map.on('click', handleMapClick);
    map.on('dblclick', (event) => { if (state.measure.mode) { event.originalEvent?.preventDefault(); finishMeasure(); } });
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

  function normaliseUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
  function cartoItems() { return state.cartoOrder.map((id) => state.cartoLayers.get(id)).filter(Boolean); }
  function makeCartoLeafletLayer(config) {
    if (config.type === 'xyz') return L.tileLayer(config.url, { maxZoom: config.maxZoom || 19, opacity: config.opacity ?? .8, attribution: config.attribution || 'Teselas públicas' });
    return L.tileLayer.wms(config.service, { layers: config.layerName, format: config.format || 'image/png', transparent: config.transparent !== false, version: '1.3.0', opacity: config.opacity ?? .8, maxZoom: 22, attribution: config.attribution || 'Servicio WMS público' });
  }
  function updateCartoZIndexes() { cartoItems().forEach((item, index) => item.leafletLayer.setZIndex(450 + index)); }
  function addCartoLayer(config) {
    const existing = state.cartoLayers.get(config.id);
    if (existing) { existing.visible = true; existing.leafletLayer.addTo(map); renderCartoState(); setStatus(`«${config.label}» ya estaba preparada y vuelve a estar visible.`, 'ok'); return existing; }
    const layer = makeCartoLeafletLayer(config);
    const item = { ...config, leafletLayer: layer, visible: true, loaded: false, errorTimer: null };
    layer.on('loading', () => { if (els.measureStatus) els.measureStatus.textContent = `Cargando ${item.label}…`; });
    layer.on('tileload load', () => { item.loaded = true; if (item.errorTimer) clearTimeout(item.errorTimer); if (els.measureStatus) els.measureStatus.textContent = `${state.cartoOrder.length + state.imageryLayers.size} capa${state.cartoOrder.length + state.imageryLayers.size === 1 ? '' : 's'} cartográfica${state.cartoOrder.length + state.imageryLayers.size === 1 ? '' : 's'} activa${state.cartoOrder.length + state.imageryLayers.size === 1 ? '' : 's'}.`; applyCartoSwipe(); });
    layer.on('tileerror', () => { if (item.loaded || item.errorTimer) return; item.errorTimer = setTimeout(() => { if (!item.loaded) setStatus(`«${item.label}» no ha entregado teselas en esta vista. Puede requerir otra escala o que el servicio haya cambiado.`, 'error'); }, 3000); });
    state.cartoLayers.set(config.id, item); state.cartoOrder.push(config.id); layer.addTo(map); updateCartoZIndexes(); renderCartoState(); setStatus(`Añadida «${config.label}».`, 'ok'); return item;
  }
  function removeCartoLayer(id) { const item = state.cartoLayers.get(id); if (!item) return; item.leafletLayer.remove(); state.cartoLayers.delete(id); state.cartoOrder = state.cartoOrder.filter((value) => value !== id); if (state.swipeLayerId === id) state.swipeLayerId = state.cartoOrder.at(-1) || ''; updateCartoZIndexes(); renderCartoState(); }
  function toggleCartoLayer(id, visible) { const item = state.cartoLayers.get(id); if (!item) return; item.visible = visible; if (visible) item.leafletLayer.addTo(map); else item.leafletLayer.remove(); applyCartoSwipe(); renderCartoState(); }
  function updateCartoOpacity(id, value) { const item = state.cartoLayers.get(id); if (!item) return; item.opacity = Number(value); item.leafletLayer.setOpacity(item.opacity); const output = els.activeCartoLayers.querySelector(`[data-carto-output="${CSS.escape(id)}"]`); if (output) output.textContent = `${Math.round(item.opacity * 100)}%`; }
  function moveCartoLayer(id, direction) { const index = state.cartoOrder.indexOf(id); const next = index + direction; if (index < 0 || next < 0 || next >= state.cartoOrder.length) return; [state.cartoOrder[index], state.cartoOrder[next]] = [state.cartoOrder[next], state.cartoOrder[index]]; updateCartoZIndexes(); renderCartoState(); }
  function applyCartoSwipe() { const selected = state.cartoLayers.get(state.swipeLayerId); cartoItems().forEach((item) => { const container = item.leafletLayer.getContainer?.(); if (container) container.style.clipPath = state.swipeEnabled && selected && item.id === selected.id && item.visible ? `inset(0 0 0 ${state.swipePosition}%)` : ''; }); const visible = Boolean(state.swipeEnabled && selected?.visible); els.swipeLine.hidden = !visible; els.swipeLine.style.left = `${state.swipePosition}%`; }
  function renderCartoCatalog() {
    if (!els.cartoCatalog) return;
    const filter = state.cartoFilter.toLocaleLowerCase('es');
    const groups = [];
    CARTO_LAYER_CATALOG.filter((config) => !filter || `${config.label} ${config.short} ${config.group}`.toLocaleLowerCase('es').includes(filter)).forEach((config) => {
      if (groups.at(-1)?.name !== config.group) groups.push({ name: config.group, items: [] });
      groups.at(-1).items.push(config);
    });
    const markup = groups.map((group) => `<div class="catalog-group">${escapeHtml(group.name)}</div>${group.items.map((config) => { const active = state.cartoLayers.has(config.id); return `<div class="layer-row${active ? ' is-active' : ''}"><span><b>${escapeHtml(config.label)}</b><small>${escapeHtml(config.short)}</small><small class="layer-kind">${escapeHtml(config.type === 'xyz' ? config.url : `${config.service} · ${config.layerName}`)}</small></span><button type="button" data-carto-add="${escapeHtml(config.id)}">${active ? 'Mostrar' : 'Añadir'}</button></div>`; }).join('')}`).join('');
    const references = CARTO_REFERENCE_LAYERS.filter((item) => !filter || `${item.label} ${item.description}`.toLocaleLowerCase('es').includes(filter)).map((item) => `<article class="reference-card"><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.description)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Abrir referencia ↗</a></article>`).join('');
    els.cartoCatalog.innerHTML = (markup || references) ? `${markup}${references ? `<div class="catalog-group">Fuentes históricas con consulta externa</div>${references}` : ''}` : '<p class="hint">No hay coincidencias en el catálogo.</p>';
  }
  function updateCartoSwipeOptions() { const current = state.swipeLayerId; els.swipeLayer.replaceChildren(); const items = cartoItems(); if (!items.length) { const option = document.createElement('option'); option.value = ''; option.textContent = 'Activa una capa primero'; els.swipeLayer.appendChild(option); state.swipeLayerId = ''; } else { items.forEach((item) => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; els.swipeLayer.appendChild(option); }); state.swipeLayerId = items.some((item) => item.id === current) ? current : items.at(-1).id; els.swipeLayer.value = state.swipeLayerId; } applyCartoSwipe(); }
  function renderActiveCartoLayers() { const items = cartoItems(); els.cartoLayerCount.textContent = `${items.length} activa${items.length === 1 ? '' : 's'}`; if (!items.length) { els.activeCartoLayers.innerHTML = '<p class="hint">Activa una capa del catálogo.</p>'; updateCartoSwipeOptions(); return; } els.activeCartoLayers.innerHTML = items.map((item, index) => `<div class="active-layer-row"><input type="checkbox" data-carto-visible="${escapeHtml(item.id)}" ${item.visible ? 'checked' : ''} aria-label="Visibilidad de ${escapeHtml(item.label)}"><div class="active-layer-name"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.type === 'xyz' ? item.url : `${item.service} · ${item.layerName}`)}</small></div><div class="active-layer-tools"><input type="range" min="0" max="1" step=".01" value="${item.opacity}" data-carto-opacity="${escapeHtml(item.id)}" aria-label="Opacidad de ${escapeHtml(item.label)}"><output data-carto-output="${escapeHtml(item.id)}">${Math.round(item.opacity * 100)}%</output><button type="button" data-carto-action="up" data-carto-id="${escapeHtml(item.id)}" ${index === 0 ? 'disabled' : ''}>▲</button><button type="button" data-carto-action="down" data-carto-id="${escapeHtml(item.id)}" ${index === items.length - 1 ? 'disabled' : ''}>▼</button><button type="button" data-carto-action="remove" data-carto-id="${escapeHtml(item.id)}">×</button></div></div>`).join(''); updateCartoSwipeOptions(); }
  function renderCartoState() { renderCartoCatalog(); renderActiveCartoLayers(); }
  function setBaseLayer(id) { const next = state.baseLayers.get(id); if (!next || next === state.baseLayer) return; state.baseLayer?.remove(); state.baseLayer = next; next.addTo(map); }
  function updateMapFilter() { const brightness = els.brightnessRange.value, contrast = els.contrastRange.value, saturation = els.saturationRange.value, hue = els.hueRange.value; map.getContainer().style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`; els.brightnessOutput.textContent = `${brightness}%`; els.contrastOutput.textContent = `${contrast}%`; els.saturationOutput.textContent = `${saturation}%`; els.hueOutput.textContent = `${hue}°`; }
  function resetImage() { ['brightnessRange', 'contrastRange', 'saturationRange', 'hueRange'].forEach((id) => { els[id].value = id === 'hueRange' ? 0 : 100; }); updateMapFilter(); }
  function exportCartoConfig() { const payload = { tool: 'Arqueo Atlas · Cartotecnia Next', generatedAt: new Date().toISOString(), baseLayer: els.baseLayerSelect.value, center: map.getCenter(), zoom: map.getZoom(), layers: cartoItems().map(({ id, group, label, type, service, layerName, url, opacity, visible, attribution }) => ({ id, group, label, type, service, layer: layerName, url, opacity, visible, attribution })) }; download('arqueo-atlas-cartotecnia-configuracion.json', JSON.stringify(payload, null, 2), 'application/json'); els.measureStatus.textContent = 'Configuración de capas descargada.'; }

  function distanceBetween(a, b) { const radius = 6371008.8; const p1 = a.lat * Math.PI / 180, p2 = b.lat * Math.PI / 180, dp = (b.lat - a.lat) * Math.PI / 180, dl = (b.lng - a.lng) * Math.PI / 180; const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }
  function formatDistance(value) { return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`; }
  function polygonArea(points) { const radius = 6371008.8, meanLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length * Math.PI / 180; let area = 0; for (let i = 0; i < points.length; i += 1) { const a = points[i], b = points[(i + 1) % points.length]; area += (b.lng - a.lng) * Math.PI / 180 * (2 + Math.sin(a.lat * Math.PI / 180) + Math.sin(b.lat * Math.PI / 180)); } return Math.abs(area * radius * radius * Math.cos(meanLat) / 2); }
  function updateMeasureLayer() { state.measure.layer?.remove(); const points = state.measure.points; if (!points.length) return; const latLngs = points.map((point) => [point.lat, point.lng]); state.measure.layer = state.measure.mode === 'area' && points.length >= 3 ? L.polygon(latLngs, { color: '#f2bd72', weight: 3, dashArray: '7 5', fillColor: '#f2bd72', fillOpacity: .16 }) : L.polyline(latLngs, { color: '#f2bd72', weight: 3, dashArray: '7 5' }); state.measure.layer.addTo(map); }
  function startMeasure(mode) { if (state.measure.mode === mode) { finishMeasure(); return; } clearMeasure(); state.measure.mode = mode; els.measureDistanceBtn.classList.toggle('primary', mode === 'distance'); els.measureAreaBtn.classList.toggle('primary', mode === 'area'); els.measureStatus.textContent = mode === 'distance' ? 'Medición de distancia: haz clic en varios puntos y doble clic para terminar.' : 'Medición de área: marca al menos tres vértices y doble clic para terminar.'; }
  function finishMeasure() { const mode = state.measure.mode, points = state.measure.points.slice(); if (!mode) return; state.measure.mode = ''; els.measureDistanceBtn.classList.remove('primary'); els.measureAreaBtn.classList.remove('primary'); updateMeasureLayer(); if (mode === 'distance' && points.length >= 2) { const total = points.slice(1).reduce((sum, point, index) => sum + distanceBetween(points[index], point), 0); els.measureStatus.textContent = `Distancia medida: ${formatDistance(total)} · ${points.length} vértices.`; } else if (mode === 'area' && points.length >= 3) { const area = polygonArea(points); els.measureStatus.textContent = `Área medida: ${area >= 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${Math.round(area).toLocaleString('es-ES')} m²`} · ${points.length} vértices.`; } else { els.measureStatus.textContent = 'Medición cancelada: faltan vértices.'; clearMeasure(); } }
  function clearMeasure() { state.measure.layer?.remove(); state.measure = { mode: '', points: [], layer: null }; els.measureDistanceBtn.classList.remove('primary'); els.measureAreaBtn.classList.remove('primary'); els.measureStatus.textContent = 'Haz clic en el mapa para consultar coordenadas o iniciar una medida.'; }
  function handleMapClick(event) { if (state.measure.mode) { state.measure.points.push(event.latlng); updateMeasureLayer(); if (state.measure.mode === 'distance' && state.measure.points.length > 1) { const total = state.measure.points.slice(1).reduce((sum, point, index) => sum + distanceBetween(state.measure.points[index], point), 0); els.measureStatus.textContent = `Distancia provisional: ${formatDistance(total)} · doble clic para terminar.`; } else if (state.measure.mode === 'area' && state.measure.points.length > 2) { els.measureStatus.textContent = `Área provisional: ${Math.round(polygonArea(state.measure.points)).toLocaleString('es-ES')} m² · doble clic para terminar.`; } return; } state.clicked = event.latlng; const coords = `${event.latlng.lat.toFixed(6)}, ${event.latlng.lng.toFixed(6)}`; els.measureStatus.textContent = `Coordenadas WGS84: ${coords}`; L.popup().setLatLng(event.latlng).setContent(`<b>Coordenadas WGS84</b><br>${escapeHtml(coords)}`).openOn(map); }

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
    els.cartoLayerFilter.addEventListener('input', () => { state.cartoFilter = els.cartoLayerFilter.value; renderCartoCatalog(); });
    els.baseLayerSelect.addEventListener('change', () => setBaseLayer(els.baseLayerSelect.value));
    els.cartoHomeBtn.addEventListener('click', () => map.fitBounds([[35.95, -9.4], [43.9, 4.5]], { padding: [20, 20] }));
    els.cartoLocateBtn.addEventListener('click', () => map.locate({ setView: true, maxZoom: 14 }));
    els.cartoCatalog.addEventListener('click', (event) => { const button = event.target.closest('[data-carto-add]'); if (!button) return; const config = CARTO_LAYER_CATALOG.find((item) => item.id === button.dataset.cartoAdd); if (config) addCartoLayer(config); });
    els.activeCartoLayers.addEventListener('change', (event) => { const target = event.target; if (target.matches('[data-carto-visible]')) toggleCartoLayer(target.dataset.cartoVisible, target.checked); if (target.matches('[data-carto-opacity]')) updateCartoOpacity(target.dataset.cartoOpacity, target.value); });
    els.activeCartoLayers.addEventListener('click', (event) => { const button = event.target.closest('[data-carto-action]'); if (!button) return; const action = button.dataset.cartoAction; const id = button.dataset.cartoId; if (action === 'remove') removeCartoLayer(id); if (action === 'up') moveCartoLayer(id, -1); if (action === 'down') moveCartoLayer(id, 1); });
    els.clearCartoBtn.addEventListener('click', () => { cartoItems().forEach((item) => item.leafletLayer.remove()); state.cartoLayers.clear(); state.cartoOrder = []; state.swipeLayerId = ''; renderCartoState(); els.measureStatus.textContent = 'Capas de Cartotecnia retiradas del mapa.'; });
    els.exportCartoBtn.addEventListener('click', exportCartoConfig);
    els.scaleToggle.addEventListener('change', () => { if (els.scaleToggle.checked) state.scaleControl.addTo(map); else state.scaleControl.remove(); });
    els.cursorToggle.addEventListener('change', () => { els.cursorCoords.hidden = !els.cursorToggle.checked; });
    els.navigationToggle.addEventListener('change', () => { if (els.navigationToggle.checked) { map.dragging.enable(); map.scrollWheelZoom.enable(); map.doubleClickZoom.enable(); } else { map.dragging.disable(); map.scrollWheelZoom.disable(); map.doubleClickZoom.disable(); } });
    els.swipeToggle.addEventListener('change', () => { state.swipeEnabled = els.swipeToggle.checked; applyCartoSwipe(); });
    els.swipeLayer.addEventListener('change', () => { state.swipeLayerId = els.swipeLayer.value; applyCartoSwipe(); });
    els.swipeRange.addEventListener('input', () => { state.swipePosition = Number(els.swipeRange.value); els.swipeOutput.textContent = `${state.swipePosition}%`; applyCartoSwipe(); });
    [els.brightnessRange, els.contrastRange, els.saturationRange, els.hueRange].forEach((input) => input.addEventListener('input', updateMapFilter));
    els.resetImageBtn.addEventListener('click', resetImage);
    els.northBtn.addEventListener('click', () => map.setView(map.getCenter(), map.getZoom()));
    els.customLayerType.addEventListener('change', () => { const wms = els.customLayerType.value === 'wms'; els.customLayerNameField.hidden = !wms; els.customLayerName.required = wms; els.customLayerUrl.placeholder = wms ? 'https://servidor.example/wms' : 'https://servidor.example/{z}/{x}/{y}.png'; });
    els.customLayerBtn.addEventListener('click', () => { const url = normaliseUrl(els.customLayerUrl.value.trim()); const type = els.customLayerType.value; if (!url) { setStatus('Escribe una URL http:// o https:// válida para la capa.', 'error'); return; } if (type === 'wms' && !els.customLayerName.value.trim()) { setStatus('Para un WMS indica también el nombre de la capa.', 'error'); return; } const label = els.customLayerLabel.value.trim() || els.customLayerName.value.trim() || 'Capa personalizada'; addCartoLayer(type === 'wms' ? cartoWms(`custom-${Date.now()}`, 'Capas personalizadas', label, url, els.customLayerName.value.trim(), { attribution: 'WMS indicado por el usuario' }) : cartoXyz(`custom-${Date.now()}`, 'Capas personalizadas', label, url, { attribution: 'XYZ indicado por el usuario' })); els.customLayerUrl.value = ''; els.customLayerName.value = ''; els.customLayerLabel.value = ''; });
    els.fullscreenBtn.addEventListener('click', () => { const panel = document.querySelector('.map-panel'); if (document.fullscreenElement) document.exitFullscreen?.(); else if (panel.classList.contains('is-fullscreen-fallback')) { panel.classList.remove('is-fullscreen-fallback'); document.body.style.overflow = ''; setTimeout(() => map.invalidateSize(), 150); } else if (panel.requestFullscreen) { const request = panel.requestFullscreen(); request?.catch?.(() => { panel.classList.add('is-fullscreen-fallback'); document.body.style.overflow = 'hidden'; setTimeout(() => map.invalidateSize(), 150); }); } else { panel.classList.add('is-fullscreen-fallback'); document.body.style.overflow = 'hidden'; setTimeout(() => map.invalidateSize(), 150); } });
    document.addEventListener('fullscreenchange', () => setTimeout(() => map.invalidateSize(), 150));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { const panel = document.querySelector('.map-panel'); if (panel.classList.contains('is-fullscreen-fallback')) { panel.classList.remove('is-fullscreen-fallback'); document.body.style.overflow = ''; setTimeout(() => map.invalidateSize(), 150); } } });
    els.measureDistanceBtn.addEventListener('click', () => startMeasure('distance')); els.measureAreaBtn.addEventListener('click', () => startMeasure('area')); els.clearMeasureBtn.addEventListener('click', clearMeasure);
    [els.filterText, els.periodFilter, els.loadedSourceFilter].forEach((element) => element.addEventListener('input', render));
    els.resultTable.addEventListener('click', (event) => { const button = event.target.closest('[data-record-id]'); if (button) selectRecord(button.dataset.recordId, true); });
    els.closeDetailBtn.addEventListener('click', () => { els.detailPanel.hidden = true; state.selectedId = null; });
    els.photoBtn.addEventListener('click', searchPhotos);
    els.exportGeoBtn.addEventListener('click', exportFeatures); els.exportCsvBtn.addEventListener('click', exportCsv); els.exportReportBtn.addEventListener('click', exportReport); els.clearBtn.addEventListener('click', clearAll);
    initMap();
    map.on('locationfound', (event) => { L.circleMarker(event.latlng, { radius: 7, color: '#72dfba', fillColor: '#72dfba', fillOpacity: .9 }).addTo(map).bindPopup('Tu ubicación aproximada').openPopup(); });
    map.on('locationerror', () => { els.measureStatus.textContent = 'El navegador no ha permitido obtener la ubicación.'; });
    renderReferenceCatalog();
    renderImageryCatalog();
    renderCartoState();
    resetImage();
    render();
    discoverImageryLayers();
  }

  init();
})();
