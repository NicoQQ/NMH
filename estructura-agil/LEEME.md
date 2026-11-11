# Estructura Ágil · portal del suscriptor

Publicado en: https://nmh.com.co/estructura-agil/ (página no indexada en buscadores).

## Archivos

- `index.html`: estructura de la página (ingreso, cotizador, tabla de tenores y plan).
- `estilos.css`: diseño con la paleta del sitio NMH.
- `app.js`: lógica de cálculo. No necesita editarse para calibrar.
- `datos.js`: **todo lo que se ajusta**: usuario y clave de demostración, cuota, cupo de m², tarifas, factores de complejidad, tenores de acero, Aa y Av por municipio y viento por departamento.

## Cómo calibrar

1. Abrir `datos.js` y cambiar los números (por ejemplo `tarifaSuscriptor`, `cupoM2Eq` o el `base` de un tipo de construcción).
2. Cambiar `version` con la fecha del ajuste.
3. Hacer commit y push desde GitHub Desktop. GitHub Pages publica en uno o dos minutos.

## Importante

- El ingreso con usuario y clave es **solo de demostración**: la clave está en el código y cualquier persona que vea el código fuente la puede leer. Para clientes reales se debe migrar a un ingreso con servidor (por ejemplo Supabase, Firebase o Cloudflare Access).
- Los consumos del cupo se guardan solo en el navegador del usuario (demostración).
- Los valores de Aa y Av provienen de la NSR-10 (Tabla A.2.3-2 y Apéndice A-4). Las velocidades de viento son valores por defecto conservadores y deben confirmarse con la Figura B.6.4-1 vigente.
- Los tenores de acero son de orden de magnitud para propuestas (±25 %) y deben calibrarse con los proyectos que diseñe NMH.
