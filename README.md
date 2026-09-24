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
