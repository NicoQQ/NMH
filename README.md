# Sitio web de NMH ENGINEERING S.A.S.

Sitio estático de 12 páginas, sin compilación ni dependencias, listo para GitHub Pages con dominio propio. Los servicios, las imágenes de proyectos y el logo provienen del portafolio de servicios de NMH (brochure) y del documento comercial de Climatización Inteligente.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `index.html` | Inicio institucional: quiénes somos, seis líneas de servicio, ciclo del proyecto, sectores y proyectos |
| `servicios.html` | Resumen de las seis líneas y sus 24 servicios |
| `estructuras.html` | Edificaciones, cimentaciones especiales, geotecnia y laboratorio, reforzamiento y revisión de diseños |
| `hidraulica.html` | Hidrosanitarios, acueducto y alcantarillado, bombeo y redes contra incendio |
| `combustibles.html` | Transferencia y almacenamiento de combustibles, procesos y biogás |
| `salud.html` | Edificaciones hospitalarias, climatización y climatización inteligente |
| `energia.html` | Granjas solares, solar para industria, protección atmosférica y eficiencia energética |
| `costos.html` | Presupuestos, programación, licitaciones, construcción y alquiler de equipos |
| `proyectos.html` | Portafolio de proyectos con fotos y filtro por línea |
| `empresa.html` | Cómo trabajamos, equipo directivo y datos legales |
| `contacto.html` | Teléfono, WhatsApp, correos y qué enviar para cotizar |
| `404.html` | Página para enlaces rotos |
| `assets/estilos.css` | Estilos compartidos |
| `assets/sitio.js` | Botones de copiar y filtro de proyectos |
| `assets/img/` | Logo (versión clara y azul), ícono de 192 px, fotos de proyectos y sus versiones de 640 px para celular |
| `CNAME` | Dominio personalizado (`nmh.com.co`) |
| `sitemap.xml`, `robots.txt` | Mapa del sitio con páginas e imágenes, e instrucciones para buscadores |
| `.nojekyll` | Evita que GitHub procese el sitio con Jekyll |

## Logo

- `assets/img/logo-nmh-claro.png`: «nmh» verde y «ENGINEERING SAS» blanco, para fondos azules (encabezado y pie).
- `assets/img/logo-nmh-azul.png`: todo en azul, para fondos claros.

Ambos tienen fondo transparente y se obtuvieron del brochure. Si tienen el logo en vector (SVG o AI), conviene reemplazarlos por esa versión con el mismo nombre de archivo.

## Puesta en marcha en GitHub Pages

### 1. Preparar los archivos
1. Descomprima `nmh-web-github.zip` en una carpeta de su computador.
2. Revise que la carpeta tenga `index.html`, `CNAME`, `.nojekyll` y la carpeta `assets`.

### 2. Crear el repositorio
1. Entre a [github.com](https://github.com) con la cuenta que administrará el sitio (idealmente una cuenta u organización de NMH).
2. Haga clic en **New repository**.
3. Nombre: `nmh-web`. Visibilidad: **Public** (con el plan gratuito, GitHub Pages solo publica repositorios públicos).
4. Haga clic en **Create repository**.

### 3. Subir el sitio
1. En el repositorio vacío, haga clic en **uploading an existing file**.
2. Arrastre **el contenido** de la carpeta (todos los archivos y la carpeta `assets`), no la carpeta que los contiene.
3. Escriba un mensaje como «Primera versión del sitio» y haga clic en **Commit changes**.
4. Verifique que `index.html` quedó en la raíz del repositorio, no dentro de otra carpeta.

### 4. Activar GitHub Pages
1. En el repositorio, vaya a **Settings → Pages**.
2. En *Build and deployment*, elija **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y haga clic en **Save**.
3. Espere uno o dos minutos. GitHub muestra la dirección provisional, del tipo `https://USUARIO.github.io/nmh-web/`. Ábrala para revisar el sitio.

### 5. Conectar el dominio
1. En la misma pantalla de **Pages**, en **Custom domain**, escriba `nmh.com.co` (sin www) y haga clic en **Save**.
2. En el panel del proveedor del dominio (donde se compró `nmh.com.co`), cree los registros DNS de la tabla siguiente.
3. La propagación puede tardar hasta 24 horas. Cuando GitHub muestre «DNS check successful», marque **Enforce HTTPS**.
4. Opcional y recomendado: en la configuración de la cuenta de GitHub, en **Pages**, agregue `nmh.com.co` como dominio verificado para evitar que otra cuenta lo use.

### 6. Actualizar el sitio más adelante
Abra el archivo en GitHub, haga clic en el lápiz (**Edit**), cambie el texto y haga clic en **Commit changes**. Para reemplazar fotos o el logo, use **Add file → Upload files** con el mismo nombre de archivo. Los cambios se publican en uno o dos minutos.

## SEO aplicado (guías de Google Search Central)

- Título y meta descripción únicos en cada página, con el nombre de la empresa al final del título.
- URL canónica en cada página. El inicio se enlaza como `/` para que coincida con su URL canónica.
- Datos estructurados JSON-LD: `WebSite` (nombre del sitio) y `Organization` (logo, teléfono, correo, NIT, LinkedIn) en el inicio, y `BreadcrumbList` en las páginas interiores, iguales a la ruta visible.
- Imágenes con texto alternativo descriptivo, nombres de archivo descriptivos, ancho y alto declarados, versiones de 640 px con `srcset` para celular, carga diferida fuera de la primera pantalla y prioridad alta para la imagen principal.
- Un solo `h1` por página, encabezados en orden y enlaces internos con texto descriptivo.
- Favicon cuadrado de 192 px e ícono para dispositivos Apple.
- Metadatos Open Graph y de tarjeta grande para compartir en redes, con idioma `es-CO`.
- `sitemap.xml` con fecha de actualización e imágenes de cada página, y `robots.txt` que lo declara.
- `404.html` con `noindex` y rutas absolutas.
- No se usa la etiqueta `meta keywords` porque Google no la tiene en cuenta.

## Registrar el sitio en Google Search Console

1. Entre a [Google Search Console](https://search.google.com/search-console) y agregue una propiedad de tipo **Dominio** con `nmh.com.co`.
2. Google entrega un registro **TXT**: créelo en el DNS del dominio y haga clic en **Verificar**.
3. En **Sitemaps**, envíe `https://nmh.com.co/sitemap.xml`.
4. En **Inspección de URLs**, revise el inicio y haga clic en **Solicitar indexación**.
5. Valide los datos estructurados con la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results) y el [Validador de Schema.org](https://validator.schema.org/).
6. Cada vez que cambie contenido importante, actualice la fecha `lastmod` del sitemap y vuelva a enviarlo.

La aparición en Google puede tardar de días a semanas después de la verificación.

## Registros DNS

El sitio se publica en el dominio principal `nmh.com.co`. En el panel del proveedor del dominio cree estos registros:

| Tipo | Nombre | Valor | Uso |
| --- | --- | --- | --- |
| A | `@` | 185.199.108.153 | Obligatorio |
| A | `@` | 185.199.109.153 | Obligatorio |
| A | `@` | 185.199.110.153 | Obligatorio |
| A | `@` | 185.199.111.153 | Obligatorio |
| AAAA | `@` | 2606:50c0:8000::153 | Recomendado (IPv6) |
| AAAA | `@` | 2606:50c0:8001::153 | Recomendado (IPv6) |
| AAAA | `@` | 2606:50c0:8002::153 | Recomendado (IPv6) |
| AAAA | `@` | 2606:50c0:8003::153 | Recomendado (IPv6) |
| CNAME | `www` | `USUARIO.github.io` | Recomendado: quien escriba `www.nmh.com.co` llega a `nmh.com.co` |

- `USUARIO` es el usuario u organización de GitHub dueña del repositorio, sin el nombre del repositorio.
- Si el dominio ya tiene registros A en `@` que apuntan a otro servidor (una página de parqueo o un hosting anterior), elimínelos: deben quedar solo los cuatro de GitHub.
- No borre los registros MX ni TXT del correo (`michael.miranda@nmh.com.co`, `hermes.ramirez@nmh.com.co`): conviven con los de la web.

Fuente: [GitHub Docs, Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Si cambia el dominio

Actualice `CNAME`, `sitemap.xml`, `robots.txt` y las etiquetas `canonical`, `og:url` y `og:image` de cada página.
