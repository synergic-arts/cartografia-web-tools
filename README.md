# Cartografía Web Tools

Colección de herramientas web abiertas para cartografía, rutas y datos geoespaciales.

## Catálogo

- [Abrir el catálogo](herramientas/): entrada común para las utilidades.
- [GeoJSON Inspector](herramientas/geojson-inspector/): revisión local de entidades GeoJSON, extensión, mapa y exportación de vértices CSV.
- [Atlas Compare](herramientas/atlas-compare/): comparador de capas históricas WMS del SCUAM y la Cartoteca Rafael Mas de la UAM, con giro y volteo sincronizados para el mapa completo y pantalla completa.
- [Spectral Lab](herramientas/spectral-lab/): cálculo local de NDVI con bandas RED y NIR.
- [GeoRef Lite](herramientas/georef-lite/): puntos de control, transformación afín y exportación para mapas escaneados.
- [Coord Converter](herramientas/coord-converter/): conversión local entre WGS84 decimal, DMS y UTM.
- [Raster Color Lab](herramientas/raster-color-lab/): rampas de color, rango y gamma para imágenes ráster locales.
- [Raster Inspector](herramientas/raster-inspector/): control local de imágenes PNG, JPEG y WebP con dimensiones, estadísticas por canal, percentiles, histogramas, transparencia, lectura de píxel e informe JSON/CSV. No inventa CRS ni sustituye al dato GeoTIFF.
- [Privacy Redactor](herramientas/privacy-redactor/): minimiza GeoJSON antes de compartirlo, redondea coordenadas, elimina campos o geometrías y exporta una auditoría JSON local. No promete anonimato absoluto.
- [Measure Lab](herramientas/measure-lab/): mide localmente longitudes, perímetros, superficies y vértices de cada geometría GeoJSON, filtra el informe, consulta entidades sobre el mapa y exporta GeoJSON enriquecido, CSV o JSON.
- [Geo Format Bridge](herramientas/format-bridge/): convierte GeoJSON, KML y CSV/TSV de puntos localmente, conserva atributos, previsualiza la capa y exporta a GeoJSON, KML o CSV sin subir los datos.
- [Layer Merge Lab](herramientas/layer-merge/): combina varios GeoJSON locales, conserva la procedencia de cada entidad, permite eliminar duplicados geométricos exactos, muestra las fuentes por color y exporta GeoJSON o CSV.
- [Footprint Lab](herramientas/footprint-lab/): calcula una envolvente convexa y una caja de extensión desde vértices o centros aproximados de una capa GeoJSON, mide su superficie y exporta la huella.
- [Digitize Lab](herramientas/digitize-lab/): digitaliza puntos, líneas y polígonos sobre Leaflet o mediante coordenadas manuales, permite deshacer vértices y exporta GeoJSON/CSV localmente.
- [Route Stations Lab](herramientas/route-stations/): genera estaciones a intervalos regulares sobre LineString y MultiLineString, calcula kilometraje acumulado y rumbo y exporta GeoJSON/CSV.
- [Contour Lab](herramientas/contour-lab/): interpola puntos XYZ con IDW local y genera segmentos de isolíneas exploratorias mediante marching squares; exporta GeoJSON/CSV.
- [Hillshade Lab](herramientas/hillshade-lab/): calcula sombreado, pendiente y orientación desde una malla regular de elevaciones, muestra el resultado en Leaflet y exporta CSV, GeoJSON o PNG.
- [Solar Lab](herramientas/solar-lab/): calcula posición solar, horas de salida y puesta y dirección y longitud de sombra para una fecha y lugar, con mapa y exportación local.
- [Network Lab](herramientas/network-lab/): analiza redes LineString y MultiLineString, ajusta extremos, calcula nodos, grados, componentes, extremos y longitudes y exporta GeoJSON/CSV.
- [Projection Lab](herramientas/projection-lab/): transforma GeoJSON WGS84 a Web Mercator, UTM o equirectangular, compara extensiones, previsualiza la geometría y exporta la capa y sus vértices.
- [Track Lab](herramientas/track-lab/): analiza recorridos GeoJSON 3D, calcula distancia, desnivel, pendiente, velocidad y perfil de elevación y exporta segmentos y puntos.
- [Label Lab](herramientas/label-lab/): calcula una propuesta local de etiquetado GeoJSON con prioridades, separación, detección de conflictos, mapa de anclajes y exportación enriquecida.
- [Legend Lab](herramientas/legend-lab/): detecta atributos GeoJSON, crea clasificaciones cuantitativas o categóricas, aplica paletas, genera leyendas y exporta una especificación reproducible.
- [Viewshed Lab](herramientas/viewshed-lab/): calcula una cuenca visual exploratoria desde una malla local de elevaciones, permite mover el observador, clasifica celdas y exporta GeoJSON/CSV.
- [Route Opt Lab](herramientas/route-opt-lab/): ordena puntos de campo con vecino más cercano y 2-opt, compara el ahorro frente a la entrada y exporta itinerarios GeoJSON/CSV.
- [Clip Lab](herramientas/clip-lab/): recorta puntos, líneas y polígonos GeoJSON por una caja WGS84, conserva atributos, informa entidades descartadas y exporta la capa resultante.
- [Raster Mask Lab](herramientas/raster-mask-lab/): crea máscaras raster exploratorias desde imágenes locales por brillo, dominancia RGB, saturación o distancia a un color y exporta PNG e informes.
- [Proportional Lab](herramientas/proportional-lab/): convierte atributos numéricos de puntos GeoJSON en símbolos proporcionales con escalas lineal, raíz o logarítmica y exporta la capa enriquecida.
- [Raster Reclass Lab](herramientas/raster-reclass-lab/): reclasifica imágenes locales por intervalos de brillo, color o saturación, revisa el reparto de clases y exporta PNG e informes.
- [Raster Composite Lab](herramientas/raster-composite-lab/): combina tres bandas locales en composiciones RGB o falso color, ajusta el estiramiento radiométrico y exporta PNG e informes.
- [ROI Stats Lab](herramientas/roi-stats-lab/): dibuja regiones de interés sobre imágenes locales, calcula estadísticas RGB y de brillo por muestra y exporta una tabla reproducible.
- [WFS Explorer](herramientas/wfs-explorer/): descubre tipos de entidad en servicios WFS públicos, consulta GeoJSON desde el navegador, visualiza el resultado y exporta entidades y atributos.
- [Join Lab](herramientas/join-lab/): une un GeoJSON con una tabla CSV o TSV por una clave, detecta coincidencias, ausencias y duplicados y exporta una capa temática trazable.
- [WMS Identify Lab](herramientas/wms-identify-lab/): descubre capas WMS, carga una previsualización y consulta `GetFeatureInfo` al hacer clic para ver y guardar la respuesta real del servicio.
- [Explode Lab](herramientas/explode-lab/): separa MultiPoint, MultiLineString, MultiPolygon y GeometryCollection, conserva atributos y añade índices de origen para edición y análisis.
- [Segment Lab](herramientas/segment-lab/): divide líneas GeoJSON en tramos consecutivos de longitud controlada, conserva atributos y calcula kilometraje, longitud y rumbo para campo o SIG.
- [Suitability Lab](herramientas/suitability-lab/): combina hasta tres atributos numéricos con pesos y dirección, calcula una puntuación de aptitud 0–100 y exporta un ranking cartográfico trazable.
- [Zonal Stats Lab](herramientas/zonal-stats-lab/): cruza puntos con polígonos y calcula conteo, suma, media, mínimo y máximo por zona, enriqueciendo la capa sin enviar datos a un servidor.
- [Hexbin Stats Lab](herramientas/hexbin-stats-lab/): agrega puntos en celdas hexagonales y calcula conteo, suma o media de un atributo para producir mapas temáticos exportables.
- [Photo Geotag Lab](herramientas/photo-geotag-lab/): extrae coordenadas GPS EXIF de fotografías JPEG localmente, muestra la campaña en un mapa y exporta los puntos GeoJSON y el informe CSV.
- [Kriging Lab](herramientas/kriging-lab/): interpola un campo numérico puntual con kriging ordinario exploratorio, permite ajustar alcance, nugget y modelo y exporta la superficie estimada.
- [Hotspot Lab](herramientas/hotspot-lab/): detecta concentraciones locales de valores altos y bajos con Getis-Ord Gi*, vecindad configurable y exportación enriquecida.
- [Line Density Lab](herramientas/line-density-lab/): calcula longitud lineal y densidad por km² en una malla configurable para caminos, ríos, transectos y redes cartográficas.
- [Flow Accumulation Lab](herramientas/flow-accumulation-lab/): deriva flujo D8, acumulación, salidas y posibles cauces desde una malla regular de elevaciones, con mapa y exportación.
- [Terrain Metrics Lab](herramientas/terrain-metrics-lab/): calcula pendiente, orientación, TPI y rugosidad desde una malla regular de elevaciones, con mapa temático y exportación.
- [Raster Algebra Lab](herramientas/raster-algebra-lab/): combina hasta tres mallas regulares locales con diferencias, ratios, índices normalizados o expresiones reproducibles y exporta la superficie derivada.
- [Rasterize Lab](herramientas/rasterize-lab/): convierte entidades GeoJSON en una malla regular por conteo, suma, media, mínimo o máximo y exporta la cuadrícula temática con los índices de origen.
- [Cost Path Lab](herramientas/cost-path-lab/): calcula rutas de menor coste con Dijkstra sobre una malla local de fricción, elevación o dificultad, permite elegir celdas en el mapa y exporta el recorrido.
- [Classification Accuracy Lab](herramientas/classification-accuracy-lab/): compara clases de referencia y predichas, calcula matriz de confusión, exactitud global, precisión, recall, F1, kappa y mapa de aciertos/errores.
- [Coordinate QA Lab](herramientas/coordinate-qa-lab/): audita coordenadas de CSV/GeoJSON, detecta ausencias, rangos imposibles, duplicados y posibles ejes invertidos y exporta un control trazable.
- [Geometry Repair Lab](herramientas/geometry-repair-lab/): detecta y repara anillos abiertos, vértices consecutivos repetidos, geometrías vacías y líneas cortas conservando propiedades y trazabilidad.
- [Georeference Lab](herramientas/georeference-lab/): calcula una transformación afín desde puntos píxel–destino, revisa residuos y exporta transformación JSON, world file y puntos ajustados.
- [Land Cover Change Lab](herramientas/landcover-change-lab/): compara dos clases o fechas de cobertura, calcula transiciones, persistencias y cambio espacial y exporta matrices y datos anotados.
- [Time Series Lab](herramientas/time-series-lab/): explora mediciones temporales, calcula mínimos, máximos, cambios y tendencias por serie, grafica la evolución y localiza entidades.
- [Positional Accuracy Lab](herramientas/positional-accuracy-lab/): compara posiciones observadas y de referencia en WGS84, calcula RMSE, CEP50, P95, sesgo y rumbo, muestra vectores y exporta un control trazable.
- [Vector Field Lab](herramientas/vector-field-lab/): cartografía observaciones de viento, corrientes o desplazamientos con flechas escaladas, rosa direccional, estadísticas de módulo y exportación GeoJSON, CSV e informe.
- [Grid Lab](herramientas/grid-lab/): cuadrícula AOI numerada con exportación GeoJSON y CSV para muestreo y teselas.
- [Carto Local AI](herramientas/carto-local-ai/): diagnóstico local de GeoJSON con modo rápido determinista y WebLLM opcional sobre WebGPU.
- [Layer Mixer](herramientas/layer-mixer/): mezcla capas WMS públicas, incluida cartografía histórica del SCUAM y fuentes del IGN, con opacidad, orden, cortina y exportación de configuración.
- [WMS Explorer](herramientas/wms-explorer/): consulta GetCapabilities, descubre los nombres de capa reales y previsualiza servicios WMS públicos en el mapa.
- [Spectral Indices](herramientas/spectral-indices/): cálculo local de NDVI, NDWI, NDBI, GNDVI y SAVI a partir de bandas RED, GREEN, NIR y SWIR.
- [Cartotecnia Next](herramientas/cartotecnia-next/): actualización del visor histórico de Cartotecnia con capas IGN/SCUAM, búsqueda, consulta de coordenadas, opciones de imagen, cortina y créditos.
- [GeoJSON QA](herramientas/geojson-qa/): control local de calidad para geometrías vacías, coordenadas fuera de rango, anillos abiertos, vértices duplicados y entidades repetidas; también señala posibles inversiones lat/lon, CRS proyectados y dimensiones mixtas, con informes JSON/CSV y copia revisada.
- [Arqueo Atlas](herramientas/arqueo-atlas/): atlas arqueológico local que agrega fuentes públicas, integra el catálogo ampliado de Cartotecnia Next (PNOA, OLISTAT, SIGPAC, vuelos históricos, MDT, SCUAM, MAGNA, GEODE, tectónica, riesgos IGME y teledetección), filtra por cronología, conserva procedencia, compara capas, mide geometrías, exporta inventarios y busca fotografías relacionadas en Wikimedia Commons.
- [Topo Profile](herramientas/topo-profile/): perfil topográfico local desde CSV, JSON, GeoJSON o GPX, con distancia acumulada, ascensos, pendientes, gráfico interactivo y exportación.
- [Field Notes](herramientas/field-notes/): cuaderno de campo local con GPS, observaciones, fotografías reducidas, importación y exportación GeoJSON/CSV.
- [Transect Planner](herramientas/transect-planner/): diseño local de transectos orientables, puntos de muestreo, métricas y exportación GeoJSON/CSV para campañas de campo.
- [Map Layout Studio](herramientas/map-layout/): composición local de mapas PNG desde GeoJSON, con título, cuadrícula, escala, flecha norte, leyenda y temas visuales.
- [Layer Diff](herramientas/layer-diff/): comparación local de dos capas GeoJSON por clave estable, con altas, bajas, modificaciones, mapa de diferencias e informe exportable.
- [Raster Change Lab](herramientas/raster-change-lab/): comparación local de imágenes raster renderizables, umbral de cambio, mezcla temporal, métricas y exportación PNG.
- [Vector Generalizer](herramientas/vector-generalizer/): simplificación local de líneas y polígonos GeoJSON con Douglas–Peucker, tolerancia aproximada en metros, comparación visual y exportación.
- [GeoJSON Reproject](herramientas/geojson-reproject/): reproyección local de capas entre WGS84 lon/lat y UTM WGS84 o ETRS89, con zona, hemisferio, vista previa y exportación.
- [Spatial Join](herramientas/spatial-join/): unión espacial local de observaciones con polígonos por contención, resumen por zona y exportación GeoJSON/CSV.
- [Density Lab](herramientas/density-lab/): agregación local de puntos en celdas hexagonales, mapa de concentraciones, control de escala y exportación GeoJSON/CSV.
- [Topology Lab](herramientas/topology-lab/): revisión local de autointersecciones, anillos abiertos, áreas nulas y problemas estructurales, con informes JSON/CSV.
- [Temporal Atlas](herramientas/temporal-atlas/): visor temporal local para GeoJSON con años/fechas, animación, modo acumulado o instantánea y exportación de la vista.
- [Proximity Lab](herramientas/proximity-lab/): relación local entre dos capas GeoJSON por destino más cercano, distancia Haversine, umbral opcional y exportación enriquecida GeoJSON/CSV.
- [Directional Lab](herramientas/directional-lab/): centro medio ponderado, dispersión, orientación y elipse de desviación estándar para patrones espaciales GeoJSON, con exportación analítica.
- [Buffer Lab](herramientas/buffer-lab/): crea áreas de influencia geodésicas alrededor de entidades GeoJSON, admite radios por atributo, controla la resolución y exporta GeoJSON/CSV.
- [Voronoi Lab](herramientas/voronoi-lab/): genera polígonos de Thiessen locales para asignar áreas de proximidad, calcula superficies y perímetros y exporta GeoJSON/CSV.
- [Tile Index Lab](herramientas/tile-index-lab/): calcula el índice de teselas XYZ que cubren una caja o extensión GeoJSON, con conteo por zoom, límites, URLs y exportación GeoJSON/CSV.
- [IDW Surface Lab](herramientas/idw-lab/): interpola valores puntuales con distancia inversa ponderada, genera una malla GeoJSON exploratoria, colorea la superficie y exporta GeoJSON/CSV.
- [Cluster Lab](herramientas/cluster-lab/): detecta agrupaciones espaciales y ruido con DBSCAN, etiqueta las entidades, resume tamaños y exporta GeoJSON/CSV.
- [Attribute Stats Lab](herramientas/attribute-stats-lab/): resume atributos numéricos y categóricos, muestra histogramas, detecta valores ausentes, clasifica entidades por cuantiles y exporta GeoJSON/CSV/JSON.
- [Moran Lab](herramientas/moran-lab/): calcula Moran global, explora agrupaciones y contrastes locales tipo LISA con vecindad por k vecinos o distancia y exporta una capa enriquecida.
- [Sampling Lab](herramientas/sampling-lab/): genera puntos de muestreo reproducibles dentro de polígonos, respeta una distancia mínima y exporta GeoJSON/CSV para campañas de campo.
- [Style Lab](herramientas/style-lab/): clasifica atributos GeoJSON por cuantiles, intervalos iguales o categorías, aplica paletas y exporta la capa estilizada junto con una especificación reutilizable.
- [GeoJSON Query Lab](herramientas/geojson-query/): filtra entidades por atributos, geometría y reglas combinadas, revisa el resultado en mapa y tabla y exporta el subconjunto a GeoJSON o CSV sin subir los datos.
- [GeoJSON Field Calculator](herramientas/field-calculator/): crea o reemplaza atributos derivados con operaciones numéricas, concatenaciones, coordenadas, vértices, longitudes y áreas aproximadas; permite deshacer y exportar GeoJSON/CSV.
- [AOI Extract Lab](herramientas/aoi-extract/): extrae entidades GeoJSON por una caja WGS84, extensión visible o selección dibujada en el mapa, usando intersección o centroide y exportando el subconjunto a GeoJSON/CSV.

Carto Local AI funciona sin servidor: el modo rápido calcula métricas y recomendaciones en JavaScript. Si el navegador ofrece WebGPU, el usuario puede pulsar «Preparar IA local» para cargar explícitamente `Llama-3.2-1B-Instruct-q4f16_1-MLC` mediante WebLLM; el primer arranque descarga y almacena la caché del modelo en ese navegador. La aplicación no envía el GeoJSON a un backend propio.

## RutaLite

La primera herramienta del repositorio es una PWA estática para convertir archivos GPX en rutas ligeras y seguirlas con GPS.

- Importación local de GPX y `.route.json`.
- Simplificación radial y Douglas–Peucker.
- Exportación a Ruta Compacta, GPX Lite y GeoJSON.
- Mapa Leaflet/OpenStreetMap y navegación sobre el track.
- Procesamiento del archivo y de la posición en el navegador, sin backend propio.

### Uso

Abre la aplicación publicada en GitHub Pages y carga un GPX desde el móvil u ordenador. Para GPS e instalación PWA se necesita HTTPS; GitHub Pages cumple ese requisito.

La navegación sigue la geometría del track y no recalcula rutas por carretera. El mapa base solicita teselas a OpenStreetMap cuando está activo.

## Desarrollo local

No requiere compilación. Sirve esta carpeta con cualquier servidor HTTP estático, por ejemplo:

```text
python -m http.server 8000
```

Después abre `http://localhost:8000/`.
