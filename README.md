# Fuera de Plan · E3

Next.js App Router, React y Supabase. Mantiene la portada, fotografías, filtros y rutas de E2. Experiencias ficticias, precios ilustrativos en ARS; no hay reservas ni pagos.

**Estado:** Supabase Preview conectado, migraciones aplicadas y seis experiencias consultadas desde la base real. Organización **Fuera de Plan**, plan **Free**, proyecto **fuera-de-plan-preview** (`kulvagylilutnpckpiuw`), región São Paulo (`sa-east-1`). Producción conserva su catálogo estático y no comparte esta base. Faltan el registro confirmado de la autora, la asignación de admin y las pruebas con sesiones normales cliente/admin.

Registro habilitado en [la preview configurada](https://tp-pw-rugolo-mlo1e0avn-programacion-web.vercel.app/auth). Elegir Registrarme, usar el email autorizado y una contraseña propia de al menos 12 caracteres; abrir el correo de confirmación en el mismo navegador y perfil. Si Vercel solicita acceso, ingresar con la cuenta propietaria de Vercel. No compartir contraseña, enlace de confirmación ni cookies.

## Desarrollo

Node >=22.12 (CI usa `.nvmrc`). Dependencias y CLI Supabase fijadas en `package-lock.json`.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Completar `.env.local` localmente, sin compartir su contenido:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto autorizado.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública publishable (también admite anon heredada).
- `APP_ORIGIN`: origen exacto, sin barra final; local `http://localhost:3000`.

No agregar claves secretas o service_role a estas variables. La aplicación no necesita claves privilegiadas. `.env*` está ignorado salvo `.env.example`, que solo contiene nombres vacíos.

## Conexión y migraciones

Las dos migraciones versionadas ya están aplicadas a la base de Preview. Se comprobó el esquema vacío antes de aplicarlas, el historial posterior y RLS activa en ambas tablas. No se ejecutó reset.

Se reutilizó la sesión nativa del llavero. `scripts/check-supabase-plan.sh` permite verificar el plan por API cuando la CLI no lo expone: usa `mktemp`, permisos privados y limpieza ante salida, errores y señales capturables; guarda solo metadatos no secretos en `supabase/.temp/`. Ningún proceso garantiza limpieza ante SIGKILL o apagado abrupto.

`.env.local` contiene únicamente la URL, clave pública y origen local. La contraseña de base generada quedó en `.env.supabase-db`, con permisos 600. Ambos archivos están ignorados por Git y excluidos explícitamente de Vercel mediante `.vercelignore`; no se exportó el access token a una ruta fija.

Para futuros entornos, usar la CLI instalada con `npx supabase`. No instalar globalmente ni levantar Docker.

1. `npx supabase login`: ingresar el **access token** solo en la terminal. No confundirlo con una clave service_role.
2. `npx supabase projects list`: seleccionar explícitamente el proyecto y confirmar si comparte base con producción. Si no existe, crear únicamente uno gratuito en la organización autorizada mediante CLI/API.
3. `npx supabase link --project-ref REF`: utilizar la contraseña de DB solo en el prompt o mediante `SUPABASE_DB_PASSWORD` local, nunca en Git ni en mensajes.
4. Inspeccionar esquema, triggers, permisos y `supabase_migrations.schema_migrations` con `npx supabase db query --linked`. Consultar `--help` para la sintaxis de esta versión. Guardar cualquier exportación fuera del repositorio; puede contener datos privados.
5. Revisar posibles conflictos con `perfiles`, `experiencias`, funciones y triggers propuestos. La migración falla ante objetos incompatibles; **no** usa `DROP`, reset ni reemplazo silencioso. Adaptar mediante migración aditiva si ya existe esquema.
6. `npx supabase db push --dry-run`, revisar el resultado; después `npx supabase db push`. No ejecutar `db reset` sobre la base remota.
7. Consultar nuevamente tablas y políticas; ejecutar la verificación remota indicada abajo.

`20261001000100_schema.sql` crea perfiles vinculados a `auth.users` por UUID (borrado de cuenta elimina su perfil), experiencias y políticas. Los usuarios existentes reciben perfil cliente. `20261001000200_demo.sql` reutiliza los seis planes originales por slug y usa `ON CONFLICT DO NOTHING`; no sobrescribe datos existentes. `src/data/experiencias.js` queda como fuente histórica de fixtures y formato monetario, no como fuente del catálogo en ejecución.

## Auth, permisos y seguridad

- `@supabase/ssr`: clientes de servidor y navegador; cookies renovadas en `src/proxy.js` para Next 16. `getUser()` valida identidad en cada página/operación protegida, sin confiar en `getSession()`.
- `/auth`: registro, ingreso, recuperación y actualización de contraseña. Callback PKCE en `/auth/callback`; destinos internos fijos, sin redirecciones arbitrarias.
- Registro público siempre cliente: trigger ignora metadata editable. Contraseñas solo en Supabase Auth.
- `/mi-cuenta`: lee el perfil propio y modifica únicamente nombre y teléfono.
- `/admin`: CRUD, detalle, publicación/borrador, confirmación de eliminación y métricas reales (total, publicadas, borradores, clientes).
- RLS: visitantes ven publicados; clientes solo su perfil; admin gestiona experiencias. Permisos por columna impiden modificar rol, ID y fecha, incluso por API directa. Función `private.is_admin()` con `search_path` vacío evita recursión en políticas. `admin_metrics()` autoriza dentro de SQL y devuelve agregados, sin exponer perfiles ajenos.
- IDs de experiencias inmutables; restricciones de texto, precio, arrays y valores permitidos también en SQL. Si una FK futura impide eliminar, la API devuelve conflicto y conserva datos. No hay relaciones ficticias con reservas inexistentes.
- Mutaciones Route Handler requieren Origin exacto y JSON; no se confía en Host/Forwarded-Host para autorizar orígenes. Sin `APP_ORIGIN`, preview usa `https://${VERCEL_URL}` y local usa localhost:3000. Usar el mismo origen en callbacks y pruebas.

**Asignación de admin:** email `irugolo@itba.edu.ar` confirmado por la autora; pendiente de que se registre y confirme el correo en Auth. Solo mediante SQL privilegiado desde terminal, después de verificar el registro en `auth.users`; actualizar `perfiles.rol` para ese UUID exacto y consultar nuevamente. No hay endpoint de promoción ni claves secretas en la app. No ejecutar una promoción para una cuenta inferida.

## Confirmación de correo y recuperación

El archivo `supabase/config.toml` configura el entorno local. La configuración alojada de Preview ya se revisó y aplicó mediante `supabase config diff/push` con un archivo mínimo temporal. Solo cambiaron Site URL, allowlist y longitud mínima; las demás propiedades remotas se conservaron. Configuración comprobada:

- Confirmación por email habilitada (`mailer_autoconfirm: false`).
- Contraseña mínima 12 (`password_min_length: 12`).
- Site URL autorizada y allowlist con URLs exactas: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/callback?next=recovery` y sus equivalentes HTTPS del deployment preview seleccionado.
- No usar comodines amplios. Mantener URLs de producción existentes si la base es compartida; no cambiar Site URL de producción para una prueba.
- Mantener plantillas PKCE compatibles con `ConfirmationURL`, que retornan `code` al callback. El enlace debe abrirse en el mismo navegador donde comenzó el flujo PKCE. Un enlace inválido/expirado muestra error y permite solicitar otro.

El agente no creó cuentas ni envió correos. El registro y la recuperación deben completarse con una cuenta propia autorizada. El SMTP predeterminado de Supabase solo permite destinatarios del equipo del proyecto y tiene límites bajos de envío; la autora es propietaria de esta organización. Registrar otros clientes por email requiere configurar un SMTP autorizado, sin desactivar confirmaciones ni contratar servicios pagos automáticamente. [Restricciones oficiales del SMTP predeterminado](https://supabase.com/docs/guides/auth/auth-smtp).

## Evidencia E3

`DataForm.jsx` comparte esquemas Zod con el servidor: tipos, requeridos, longitudes, formatos, límites y enums; objetos estrictos rechazan atributos adicionales. Perfil y experiencias llaman **fetch explícito** a `/api/perfil` y `/api/experiencias[/id]` (PATCH/POST). El servidor verifica identidad, rol y datos antes de persistir con la sesión normal del usuario. DELETE también usa fetch y confirmación.

Formularios con labels, errores asociados, foco al primer error, mensajes `role=status`, bloqueo de doble envío, timeout y conservación de texto ante fallos. `response.ok` obligatorio. El resultado guardado actualiza campos/lista/métricas mediante estado React sin recargar la página. El catálogo se consulta desde Supabase en cada navegación SSR; hay estados vacío, carga y error.

## Verificación por terminal

```sh
npm run lint
npm test
npm run build
npm run start
```

`npm test` ejecuta validación y HTTP (JSON, origen, errores sanitizados) y aplica las migraciones en PostgreSQL embebido PGlite sin Docker. Comprueba seed no duplicado, registro cliente pese a metadata admin, aislamiento de perfiles, denegación de escalada, publicación, CRUD y reconsulta, métricas y restricciones. **auth.uid está emulado en esa prueba: no demuestra sesiones reales de Supabase.**

Para probar el proyecto remoto autorizado, guardar en un archivo `.env.remote` ignorado las variables públicas, `TEST_ORIGIN` y tokens access/refresh de **dos sesiones normales existentes y autorizadas**, una cliente y una admin: `TEST_CLIENT_ACCESS_TOKEN`, `TEST_CLIENT_REFRESH_TOKEN`, `TEST_ADMIN_ACCESS_TOKEN`, `TEST_ADMIN_REFRESH_TOKEN`. No usar service_role, compartir tokens ni registrarlos en salida.

```sh
node --env-file=.env.remote scripts/verify-remote.mjs
```

El script no crea usuarios ni envía correos. Prueba Route Handlers y API directa con sesiones normales, no acceso a admin, payloads inválidos, perfiles ajenos, elevación de rol, CRUD y reconsulta. Crea una experiencia temporal identificada `e3-verificacion-*` y la elimina al finalizar; si el proceso se interrumpe, retirar únicamente esa fila. Requiere acceso HTTP a la preview (si Vercel tiene protección, usar una sesión/bypass autorizado por terminal). Pendiente de dos sesiones normales autorizadas; todavía no se ejecutó. Para una preview protegida, puede usarse `TEST_VERCEL_BYPASS_SECRET` local: el script lo envía como header sin imprimirlo. El perfil se modifica, se vuelve a consultar y se restaura; también se elimina la experiencia temporal.

**Revisión visual pendiente a cargo de la autora:** 360/768/1440 px, zoom 200 %, teclado/foco, anuncios con lector de pantalla, formularios válidos/erróneos y fallo de red, registro y recuperación con correo propio. No se abrió ni automatizó ningún navegador en E3. La evidencia visual de E2 permanece en el historial del PR #3, no se asume válida para los nuevos formularios.

## GitHub y preview

Rama E3 derivada de `feat/e2-nextjs`; PR apilado sobre E2 para no duplicar su revisión. CI ejecuta instalación limpia, lint, tests y build. No fusionar ni usar `vercel --prod`.

Las dos variables públicas ya están configuradas únicamente en Preview, rama `feat/e3-supabase-auth`, mediante `vercel env add NOMBRE preview --git-branch feat/e3-supabase-auth`, ingresando valores por stdin. Production no tiene variables Supabase. `APP_ORIGIN` solo está configurado localmente. Sin `APP_ORIGIN`, se usa la URL exacta de deployment de Vercel. Recompilar tras configurar variables `NEXT_PUBLIC_*`. Si preview comparte DB de producción, las escrituras de preview afectan esa misma base: no aplicar cambios incompatibles ni alterar su Auth sin revisar el impacto.

## Documentación contrastada

- [Supabase SSR y Proxy para Next 16](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Auth por email y contraseña](https://supabase.com/docs/guides/auth/passwords)
- [RLS y políticas](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [CLI oficial mediante npm](https://supabase.com/docs/guides/local-development/cli/getting-started)

Se consultó el material local de clase “08-clase Supabase-08.pptx.pdf”: relaciones PK/FK, CRUD, Auth, aislamiento por fila y separación de claves privilegiadas.

Verificación local realizada el 01/10/2026: `npm ci`, lint, 10 pruebas y build correctos. HTTP: inicio/catálogo/auth 200, ruta inexistente 404, admin/cuenta redirigen a auth sin contenido protegido y mutación con origen ajeno devuelve 403. Next puede emitir la redirección como meta refresh con HTTP 200 cuando ya empezó el streaming de `loading.js`; la prueba comprueba el destino y ausencia del panel, no solo el código HTTP.


## Evidencia de la conexión remota

- `node --env-file=.env.local scripts/verify-public.mjs`: seis planes persistidos consultados dos veces; perfiles y métricas denegados para anónimos.
- `node --env-file=.env.local scripts/verify-anonymous-rls.mjs`: crea un borrador temporal mediante CLI únicamente en este proyecto de Preview; comprueba con clave pública que está oculto y que INSERT/UPDATE/DELETE devuelven `42501`; elimina las filas temporales en `finally` y comprueba su ausencia. No crea usuarios, no envía correos ni usa service_role en las aserciones.
- Preview HTTP por `vercel curl`: catálogo, detalle y registro disponibles; `/admin` redirige a `/auth` sin panel; PATCH perfil y POST experiencias anónimos devuelven 401; origen ajeno devuelve 403; callback inválido devuelve 307 a un destino interno fijo.
- Lint, diez pruebas locales y build aprobados. Estas pruebas locales usan PostgreSQL embebido; las remotas anteriores prueban el rol anónimo real. Cliente/admin, edición de perfil, CRUD autenticado y recuperación siguen pendientes del registro y sesiones de prueba autorizadas.
- Auditoría de dependencias de ejecución: sin vulnerabilidades. La auditoría completa detectó un aviso en `braces` (herramientas de lint) sin parche compatible disponible al consultar; no se aplicó el downgrade mayor sugerido por `npm audit --force`.
