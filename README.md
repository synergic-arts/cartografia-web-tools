# Cartografía Web Tools

Colección de herramientas web abiertas para cartografía, rutas y datos geoespaciales.

## Catálogo

- [Abrir el catálogo](herramientas/): entrada común para las utilidades.
- [GeoJSON Inspector](herramientas/geojson-inspector/): revisión local de entidades GeoJSON, extensión, mapa y exportación de vértices CSV.
- [Atlas Compare](herramientas/atlas-compare/): comparador de capas históricas WMS del SCUAM y la Cartoteca Rafael Mas de la UAM, con pantalla completa opcional.
- [Spectral Lab](herramientas/spectral-lab/): cálculo local de NDVI con bandas RED y NIR.
- [GeoRef Lite](herramientas/georef-lite/): puntos de control, transformación afín y exportación para mapas escaneados.
- [Coord Converter](herramientas/coord-converter/): conversión local entre WGS84 decimal, DMS y UTM.
- [Raster Color Lab](herramientas/raster-color-lab/): rampas de color, rango y gamma para imágenes ráster locales.
- [Grid Lab](herramientas/grid-lab/): cuadrícula AOI numerada con exportación GeoJSON y CSV para muestreo y teselas.

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
