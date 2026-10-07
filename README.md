# Carta Dubai · versión de demostración (sitio estático)

Esta carpeta es una web **100 % estática**: HTML, CSS, JavaScript y archivos JSON. No necesita PHP ni base de datos,
así que funciona en **GitHub Pages**, Netlify, Cloudflare Pages o cualquier alojamiento de archivos.
Es solo la parte visual: **no incluye el panel de administración** ni el registro de pedidos.

**Lleva la carta real** (productos, precios, categorías y ajustes copiados del panel el 8/10/2026). Los pedidos se envían por
WhatsApp al **número real del local**: si la compartes para que alguien la revise, avísale de que no envíe pedidos de prueba.
Si cambias precios o productos en el panel, esta copia **no se actualiza sola**: hay que volver a exportar `data/menu.json`.

## Publicarla en GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo `dubai-demo`).
2. Sube **el contenido de esta carpeta** (no la carpeta en sí): `index.html` debe quedar en la raíz del repositorio.
   Desde la web: *Add file → Upload files*, arrastra todo y pulsa *Commit changes*.
3. Entra en *Settings → Pages*. En *Build and deployment* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. Espera uno o dos minutos. La dirección será `https://TU-USUARIO.github.io/dubai-demo/`.

Para probar una mesa, añade `?mesa=5` al final de la dirección.

## Cambiar textos, productos y precios

Todo el contenido está en dos archivos de la carpeta `data/`. Se editan con cualquier editor de texto y, al guardar y subir
el cambio, la web se actualiza sola (GitHub Pages tarda un par de minutos; si no lo ves, recarga con Ctrl+F5).

**`data/site.json`** — datos del local

| Campo | Para qué sirve |
|---|---|
| `nombre` | Nombre del local (título, pedido de WhatsApp y portada si no hay logo) |
| `whatsapp` | Número que recibe los pedidos: solo cifras, con prefijo de país (ej. `240222123456`) |
| `whatsapp_reservas` | Número para las reservas. Vacío (`""`) = usan el mismo número |
| `lema` | Frase grande de la portada |
| `instagram` | Usuario de Instagram sin espacios (opcional) |
| `horario` | Línea de horario en el pie (opcional) |
| `aviso` | Franja dorada de arriba (opcional; vacío = no se muestra) |

**`data/menu.json`** — categorías y productos

- `categorias`: `id`, `nombre`, `slug` (sin espacios ni acentos), `imagen` (`null` o la ruta de una foto, p. ej. `public/uploads/foto.webp`), `icono` y `padre`.
  `padre` es el `slug` de la categoría principal si es una subcategoría, o `null`. Solo hay un nivel de subcategorías.
  `icono` puede ser `coctel`, `botella`, `vaso`, `cachimba`, `comida`, `promocion`, `estrella`, `regalo`, `rombo` o `null` (automático).
- `productos`: `id`, `nombre`, `descripcion`, `precio` (número entero en XAF), `categoria` (el `slug` donde va), `imagen` (`null`)
  y `opciones`.
- Opciones con precio propio: pon `opcion_titulo` (por ejemplo `"Presentación"`) y una lista en `opciones`
  (`{"id": 1, "nombre": "Chupito", "precio": 2000}`). Si pones `opcion_base` (por ejemplo `"Botella"`), el `precio` del producto
  se ofrece como una opción más. Si es `null`, cada opción tiene su propio precio (como los sabores de la cachimba).
- Los `id` no se pueden repetir. Las categorías sin productos no se muestran.
- Cuidado con las comas y las comillas: un error de formato en el JSON hace que la carta no cargue. Puedes comprobarlo pegando el archivo en cualquier validador de JSON.

## Probarla en tu ordenador

No funciona con doble clic en `index.html` (los navegadores bloquean la lectura de los JSON desde `file://`). Abre una terminal en esta carpeta y ejecuta:

    python3 -m http.server 8000

Luego entra en `http://localhost:8000/`. (En Windows, `py -m http.server 8000`.)

## Estructura

    index.html          página de la carta
    404.html            página de «no encontrada»
    robots.txt          pide a los buscadores que no indexen la demo
    data/               site.json (local) y menu.json (productos)
    public/css/         estilos
    public/js/          app.js (la carta) y demo.js (lee data/site.json y la arranca)
    public/fonts/       tipografías
    public/img/         logo, icono y la imagen para compartir
    public/uploads/     fotos de categorías y productos (las mismas que en el panel)

Para que el enlace se vea con foto al compartirlo por WhatsApp, abre `index.html` y quita los comentarios de las etiquetas `og:` (instrucciones dentro).
