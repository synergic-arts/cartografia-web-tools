# Datos locales de Arqueo Atlas

## `barcelona-carta-2022.geojson`

- Fuente: Ajuntament de Barcelona, Servei d'Arqueologia de l'Institut de Cultura de Barcelona.
- Distribución original: [Carta arqueológica de la ciudad de Barcelona](https://datos.gob.es/es/catalogo/l01080193-carta-arqueologica-de-la-ciudad-de-barcelona).
- Descarga original: <https://opendata-ajuntament.barcelona.cat/data/dataset/b58a1160-0d27-45d3-91a6-f93efee0c916/resource/98f39a8e-7d76-4789-b275-b1160ed8bf65/download>.
- Licencia declarada por el catálogo: CC BY 4.0.
- Copia local incluida para permitir el uso client-side en GitHub Pages aunque el servidor municipal no exponga CORS.
- La copia conserva las propiedades y geometrías publicadas; no se han añadido coordenadas ni se han reinterpretado los registros.

## Fuentes dinámicas y trazabilidad

Arqueo Atlas mantiene las fuentes remotas como consultas client-side y conserva en cada registro el identificador, la URL y las propiedades devueltas por el proveedor:

- [Wikidata SPARQL](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service): elementos con coordenadas y clasificación arqueológica dentro de una caja aproximada de España. Es una fuente comunitaria, CC0, y puede contener duplicados, generalizaciones o registros incompletos.
- [OpenStreetMap / Overpass](https://wiki.openstreetmap.org/wiki/Key:historic): objetos etiquetados como `historic=archaeological_site` o `site_type=archaeological_site` en España. La licencia y atribución son ODbL; el volumen puede hacer que el proveedor limite o tarde en responder.
- [IPCA del Principado de Asturias](https://sig.asturias.es/servicios/rest/services/IPCA/MapServer): capas de yacimientos en puntos y áreas mediante ArcGIS REST/GeoJSON, conservando los atributos devueltos.
- [Lugares de interés histórico de La Palma](https://lapalmasmart-open.lapalma.es/datosabiertos/catalogo/dataset/lugares-de-interes-historico-de-la-palma): inventario público georreferenciado. Si el portal bloquea CORS, se puede descargar el GeoJSON y abrirlo como archivo local.

No se afirma que exista un inventario público único y exhaustivo de todos los yacimientos de España. Las fuentes tienen coberturas, licencias, escalas y criterios distintos; Arqueo Atlas las mantiene separadas para que el usuario pueda comparar procedencia, duplicados y precisión. Los registros geocodificados por nombre se marcan como aproximados y nunca sustituyen la localización oficial.

## Coordenadas y consultas

El lector admite GeoJSON, ArcGIS GeoJSON, JSON de Wikidata/Overpass y archivos locales con latitud/longitud, DMS, UTM o columnas X/Y. Se puede indicar un CRS cuando el archivo no lo declara (EPSG:25828–25831, 32628–32631, 23028–23031, 4258 y 4230); las geometrías se transforman a WGS84 para el mapa.

Al pulsar un registro vectorial se muestran sus atributos originales y enlaces de procedencia. Al pulsar el mapa, las capas WMS activas se consultan con `GetFeatureInfo` y se muestran las respuestas de cada servicio; si el proveedor no permite CORS o no implementa la consulta, se informa del fallo sin inventar atributos.
## Reutilización de Gods Eye View

Se revisó el repositorio público [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view). Su código está bajo MIT, pero el propio proyecto separa los datos y activos de terceros. ArqueoAtlas reutiliza el patrón técnico de fuentes browser-direct y la idea de catálogo bajo demanda, y adapta las URLs públicas de NASA GIBS/CMR para imágenes HLS Sentinel-2, HLS Landsat 8/9 y VIIRS. No se copian código, modelos 3D, datasets restringidos ni activos gráficos del repositorio.

La atribución de las imágenes recientes se muestra como `NASA GIBS / ESDIS`; HLS y cada proveedor conservan sus propias condiciones. Las capas que requieren servidor proxy, claves o licencias incompatibles con una aplicación estática no se presentan como disponibles client-side.