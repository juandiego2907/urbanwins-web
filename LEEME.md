# Urban Wings · web

Sitio estático (HTML + Tailwind CDN + JavaScript). No necesita instalación: se abre `index.html` o se sube la carpeta a cualquier hosting (Vercel, Netlify, Hostinger).

## Qué editar

| Qué | Dónde |
|---|---|
| Número de WhatsApp, horarios, dirección, datos de Pago Móvil / Zelle / transferencia | `js/data.js` → `UW_CONFIG` |
| Productos, descripciones y precios | `js/data.js` → `UW_MENU` (`price: null` muestra "Consultar") |
| Salsas | `js/data.js` → `UW_SALSAS` |
| Sectores de delivery y su costo | `js/data.js` → `UW_SECTORES` (hoy todos en `precio: 0`) |
| Ubicación del mapa | `js/data.js` → `UW_CONFIG.mapa` (coordenadas o nombre exacto en Google Maps) |
| Colores y animaciones | `css/styles.css` y el bloque `tailwind.config` de `index.html` |

## Video del hero

Coloca dos archivos MP4 (sin audio, en bucle, idealmente < 5 MB):

- `assets/video/hero.mp4` — horizontal, para PC
- `assets/video/hero-movil.mp4` — vertical, para celular

Si no existen, el hero muestra un fondo animado de brasas.

## Tasa BCV

Se consulta en vivo en `https://ve.dolarapi.com/v1/dolares/oficial`, se guarda en el navegador y se refresca cada 30 minutos. Si la API no responde, usa la última tasa guardada o `tasaRespaldo`.
