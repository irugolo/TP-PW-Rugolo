# Fuera de Plan · E2

Proyecto académico de experiencias sociales con Next.js 16.3.6, App Router,
React y JavaScript. Conserva el diseño claro, las fotografías y los seis planes
ficticios de la versión anterior. Los precios son ilustrativos: no hay reservas,
pagos, autenticación, API ni base de datos todavía.

Repositorio: https://github.com/irugolo/TP-PW-Rugolo

Producción: https://tp-pw-rugolo.vercel.app (conserva la versión aprobada de main).
La migración E2 se revisa en una preview antes de fusionarla.

## Trabajar localmente

Recomendado: Node 22 LTS, versión 22.12 o posterior de esa serie, y npm.
`.nvmrc` selecciona Node 22 si usás nvm; CI usa esa misma serie. Next 16 requiere
Node >=20.9; este proyecto declara >=22.12. También se verificó localmente con
Node 26.7 y npm 11.19.

```bash
npm ci
npm run dev
```

Abrí http://localhost:3000. Al guardar se actualiza la vista local.
Para detener el servidor, presioná **Ctrl + C** en esa terminal.

Para probar el resultado real de producción (con el servidor de desarrollo detenido):

```bash
npm run build
npm run start
```

`build` ejecuta `next build`; `start` ejecuta `next start`. Next genera `.next/`.
No usamos exportación estática ni una salida `dist`: se conservan las capacidades
de servidor para las próximas entregas. Que los datos locales permitan prerenderizar
estas páginas no convierte el proyecto en `output: "export"`.

## Rutas y archivos

| Ruta | Archivo | Función |
| --- | --- | --- |
| `/` | `src/app/page.js` | Portada y Cómo funciona |
| `/experiencias` | `src/app/experiencias/page.js` | Catálogo con filtros |
| `/experiencias/[slug]` | `src/app/experiencias/[slug]/page.js` | Detalle, por ejemplo `/experiencias/cocina` |
| Ruta o experiencia inexistente | `src/app/not-found.js` | 404 con enlace al catálogo |

- `src/app/layout.js`: `html lang="es"`, metadata, estilos, encabezado, main y pie compartidos.
- `src/components/`: componentes visuales. Editá la portada en `Hero.jsx` y el resto en el componente correspondiente.
- `src/data/experiencias.js`: nombres, descripciones, zonas, duración, categorías y precios.
  El `id` estable sirve de slug: cambiarlo cambia el enlace del detalle.
- `styles.css`: estilos globales y variables de color al comienzo.
- `public/images/`: fotos locales; licencia y fuentes en `PROCEDENCIA.md`.
- `vercel.json`: configuración Next.js aplicada por despliegue, sin modificar ajustes globales del proyecto.

Las páginas, layout, Header, Hero, ComoFunciona, Footer y DetalleExperiencia son
componentes de servidor. `Catalogo` usa `use client` porque tiene `useState` y
botones de filtro. `TarjetaExperiencia` queda dentro de ese árbol cliente: no es
un componente de servidor independiente, aunque no necesite estado propio.
Los componentes cliente también reciben HTML inicial; no desactivamos SSR.

La navegación usa `next/link` y las fotos `next/image` con dimensiones y `sizes`.
El detalle reemplaza al modal anterior, sin dos implementaciones duplicadas.
La navegación móvil mantiene los enlaces visibles; no hay menú colapsable.
La selección de filtros usa `aria-pressed`, marca visual y anuncio del resultado.

No agregamos `loading.js`, `error.js`, fetch o Server Actions sin una necesidad
real de esta etapa con datos locales. `not-found.js` sí maneja casos reales.
En Next 16 `params` se espera con `await`; no asumimos que `fetch` almacene todas
las respuestas en caché por defecto. Cuando se incorpore la API se elegirá esa
política expresamente. Ningún secreto debe viajar como prop al cliente ni llevar
el prefijo `NEXT_PUBLIC_`.

Referencias: [instalación](https://nextjs.org/docs/app/getting-started/installation),
[servidor y cliente](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[rutas dinámicas](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes),
[fetch](https://nextjs.org/docs/app/api-reference/functions/fetch).

## Verificación E2 (24/09/2026)

| Criterio | Evidencia local | Límites |
| --- | --- | --- |
| Semántica | Layout con header/nav/main/footer; secciones y artículos; un h1 por ruta; enlaces para navegar y botones para filtrar | Revisión manual, no certificación |
| Responsive | Landing, catálogo y detalle inspeccionados en Chrome a 360, 768 y 1440 px; sin desbordamiento horizontal observado | No se probaron dispositivos físicos ni todos los navegadores |
| Accesibilidad | Tab, Enter, Space, foco visible y salto al main probados; filtros 4/4/5/6; zoom real al 200 % sin desbordamiento; 404 navegable | Sin auditoría automatizada ni prueba completa con lector de pantalla; regla reduced-motion revisada en CSS |
| Consistencia visual | Misma paleta, tipografía, imágenes, tarjetas y controles en las rutas; detalle adaptado al diseño existente | Pendiente revisión de la autora |

- `npm ci`, `npm run build` y `npm run start`: correctos.
- HTTP 200 en inicio, catálogo y los seis detalles; HTTP 404 en `/no-existe` y `/experiencias/no-existe`.
- Navegación por enlaces y recarga directa de detalle verificadas. Sin errores de consola/hidratación observados en las pruebas.
- Contraste calculado: gris sobre fondo cálido 5,62:1; gris sobre sección gris 5,01:1;
  lavanda oscuro sobre fondo 7,15:1; texto del filtro seleccionado 10,39:1.
- No había lint configurado. No se añadió una herramienta nueva solo para esta migración;
  el build de Next 16 no equivale a ejecutar un linter.
- Eliminados `index.html`, `src/main.jsx`, `src/App.jsx`, `vite.config.js` y dependencias exclusivas de Vite.
- `.gitignore` excluye `.next`, dependencias, salidas antiguas y credenciales. Se conserva `package-lock.json`.

## GitHub y Vercel

CI instala con `npm ci` y compila en cada PR hacia main y push a main. Vercel
publica mediante su integración GitHub existente: no hay otro pipeline de despliegue.
`vercel.json` selecciona Next.js, `npm ci`, `npm run build`, `npm run dev` y restablece
la salida automática del framework. Esa configuración viaja en la rama E2 y no
cambia la rama de producción mientras el PR siga abierto.

La CLI de Vercel está instalada. Para vincular esta carpeta una vez autenticada:

```bash
vercel login
vercel link --project tp-pw-rugolo --scope programacion-web
```

Elegir el proyecto existente; no crear uno nuevo. `.vercel/` no se versiona.
No compartir tokens o contraseñas. La sesión de CLI estaba pendiente durante las
pruebas locales; los checks y la preview se revisan por GitHub.

Después de aprobar E2:

1. Revisar CI y preview del PR; probar navegación, filtros y detalles.
2. Fusionar a main solamente con aprobación.
3. Esperar el despliegue automático Production/Ready del nuevo commit.
4. Abrir la URL pública y recargar `/experiencias/cocina`; probar filtros y 404.
5. Confirmar en los logs que se ejecutó Next.js. No usar `vercel --prod` durante la revisión.
