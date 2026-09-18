# TP de Programación Web

Fuera de Plan es una propuesta académica de experiencias sociales, desarrollada
con React, Vite y JavaScript. Esta versión local incluye inicio, seis planes de
demostración, filtros por compañía y un detalle accesible. Los precios son
ilustrativos: no hay eventos reales, reservas, pagos ni autenticación.

La nueva propuesta visual todavía no fue publicada; el enlace de producción
puede mostrar la versión anterior hasta que se aprueben y suban estos cambios.

- Repositorio: https://github.com/irugolo/TP-PW-Rugolo
- Producción: https://tp-pw-rugolo.vercel.app

## Requisitos y uso local

Node.js 22.12 o superior de la serie 22 (la versión usada por CI), npm y Git.
Desde la carpeta del proyecto:

```bash
npm ci
npm run dev
```

Abrir la dirección que indique la terminal, normalmente http://localhost:5173.
Los cambios guardados se reflejan en el navegador. Para detener el servidor,
presionar Ctrl + C en la terminal.

```bash
npm run build    # Genera la versión de producción en dist/
npm run preview  # Permite revisar esa compilación localmente
```

## Archivos principales

- `src/App.jsx`: reúne las secciones y guarda la experiencia seleccionada.
- `src/components/`: textos y presentación de cada sección; la portada está en `Hero.jsx`.
- `src/data/experiencias.js`: nombres, descripciones, categorías, zonas, duración y precios.
- `public/images/`: fotografías locales; su licencia y procedencia están en `PROCEDENCIA.md`.
- `src/main.jsx`: inicia React e importa los estilos.
- `styles.css`: estilos de la página.
- `index.html`: contenedor de React y título de la pestaña del navegador.
- `vite.config.js`: configuración de Vite para React.
- `package.json` y `package-lock.json`: comandos, dependencias y versiones.
- `.github/workflows/ci.yml`: comprobación automática de instalación y build.

## Flujo GitHub–Vercel

1. Crear una rama, realizar cambios y guardarlos con commits.
2. Subir la rama y abrir un pull request (PR) hacia `main`.
3. GitHub Actions ejecuta `npm ci` y `npm run build` en cada PR y en los pushes
   a `main`. Este control comprueba la compilación; no publica la web ni prueba
   automáticamente las interacciones de la página.
4. La integración existente de Vercel con GitHub se encarga de compilar y
   publicar. Revisar el check/comentario de Vercel en el PR, abrir su preview y
   comprobar la página, los filtros y el detalle antes de fusionarlo.
5. Después de revisar y fusionar el PR, comprobar en Vercel que el despliegue
   de producción corresponde al nuevo commit de `main` y está en estado Ready.
   Abrir la URL de producción y verificar la página, los filtros y el detalle de las experiencias.

No hay un segundo mecanismo de despliegue desde GitHub Actions. El build de
la aplicación usa `npm run build` y genera `dist/`.

## Comprobaciones de E1

- Repositorio operativo y despliegue inicial de producción verificado.
- Instalación limpia con `npm ci` y compilación local verificadas.
- Para cerrar E1, comprobar los checks del PR, su preview y el botón, y después
  de fusionarlo confirmar la actualización automática de producción.

`node_modules/`, `dist/`, `.vercel/`, archivos `.env`, claves y `.npmrc` están
excluidos de Git. `package-lock.json` se conserva para instalaciones reproducibles.
No incluir credenciales en el código ni en un eventual `.env.example`; las
variables `VITE_*` son públicas en la aplicación del navegador.
