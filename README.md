# TP de Programación Web

Base del trabajo final, desarrollada con React, Vite y JavaScript. La temática
todavía está pendiente de definición. Por ahora contiene una página sencilla y
un botón «Saludar» que cambia el mensaje usando `useState`.

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

- `src/App.jsx`: contenido de la página, título visible y función del botón.
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
   automáticamente la interacción del botón.
4. La integración existente de Vercel con GitHub se encarga de compilar y
   publicar. Revisar el check/comentario de Vercel en el PR, abrir su preview y
   comprobar la página y el botón antes de fusionarlo.
5. Después de revisar y fusionar el PR, comprobar en Vercel que el despliegue
   de producción corresponde al nuevo commit de `main` y está en estado Ready.
   Abrir la URL de producción y verificar la página y el saludo.

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
