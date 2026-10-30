# Fuera de Plan

Proyecto académico con Next.js App Router, React y Supabase. Catálogo, cuentas cliente/admin, CRUD de experiencias y compra directa de una experiencia con Mercado Pago Checkout Pro. Las reservas y los pagos habilitados en esta rama son de demostración.

**Preview privada:** https://tp-pw-rugolo-e4e6-programacion-web.vercel.app

**PR sin fusionar:** https://github.com/irugolo/TP-PW-Rugolo/pull/5

Preview y producción usan bases separadas. Esta etapa modifica código y Preview; no habilita pagos reales, no publica producción ni contrata recursos. El webhook de Preview es público y exige firma; la web mantiene Deployment Protection.

## Desarrollo y pruebas

Node >=24 (CI y Vercel: 24.x); CI utiliza `.nvmrc`. Las versiones instaladas están fijadas por `package-lock.json`.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm test
npm run lint
npm run build
python3 -m unittest discover -s tests -p 'test_*.py'
```

Completar únicamente las variables públicas Supabase de Preview y `APP_ORIGIN=http://localhost:3000` para desarrollo. No copiar claves secretas en `NEXT_PUBLIC_*`. `.env*` está ignorado salvo `.env.example`; los secretos también están excluidos del despliegue mediante `.vercelignore`.

La lectura de catálogo y las operaciones de perfil/administración usan sesiones normales y RLS. Checkout y webhook necesitan una clave privilegiada **solo en servidor**, además del token del vendedor de prueba y la firma de Webhooks. Se configuran mediante los asistentes `scripts/configure-mp-test.py` y `scripts/configure-mp-webhook.py`, con entrada oculta. Nunca publicar sus valores ni pasarlos como argumentos. La aplicación de prueba del vendedor es distinta de la aplicación de la cuenta personal de developer.

## Autenticación y permisos

1. Registro: el navegador envía email y contraseña directamente a Supabase Auth. El proveedor valida la contraseña (mínimo 12), administra hashing/salting y exige confirmación por correo. El trigger crea siempre un perfil cliente, ignorando roles en metadata.
2. Confirmación: callback PKCE, intercambio de código y retorno a una ruta interna fija. Los enlaces deben abrirse en el mismo navegador/perfil. Enlace inválido o vencido: mensaje genérico y posibilidad de solicitar otro.
3. Sesión: `@supabase/ssr` mantiene cookies y renovación; Proxy renueva/verifica claims. Las páginas y API protegidas usan `getUser()` y consultan el perfil actual en servidor.
4. Autorización: `identity(true)` exige admin. RLS y permisos SQL controlan los datos, incluso con llamadas directas a Supabase. El rol no es editable por clientes ni administradores desde la web.
5. Logout: cierra explícitamente la sesión actual (`scope: local`), limpia el estado del cliente y vuelve a `/auth`. No equivale a invalidar inmediatamente todo JWT previamente copiado ni a cerrar otros dispositivos.

### Matriz de permisos

| Ruta / operación | Visitante | Cliente | Admin |
|---|---|---|---|
| `/experiencias`, detalle, GET `/api/experiencias[/id]` | Publicados | Publicados | Publicados en API pública |
| `/auth`, callback | Registro/login/recuperación | Disponible | Disponible |
| `/mi-cuenta`, PATCH `/api/perfil` | 401 / redirección | Perfil propio: nombre/teléfono | Perfil propio: nombre/teléfono |
| `/admin`, POST/PATCH/DELETE `/api/experiencias[/id]` | 401 / redirección | 403 / redirección | CRUD autorizado |
| `/pedidos`, GET `/api/pedidos[/id]` | 401 / redirección | Solo propios | Lectura administrativa |
| POST `/api/pedidos` y checkout | 401 | Pedido propio, precio del servidor | Pedido propio, mismas reglas |
| Alterar rol/precio del pedido/pago/cupos | No | No | No desde API cliente |
| Webhook público | Firma + consulta API obligatorias; no sesión de usuario | Igual | Igual |

Un pedido ajeno y uno inexistente devuelven 404 para no revelar su existencia. Los errores no exponen credenciales ni mensajes internos del proveedor. Los POST/PATCH/DELETE de la web exigen Origin exacto y JSON, además de identidad/permisos. Las respuestas privadas no se cachean.

Ver [auditoría de clase 09](docs/clase09-seguridad.md) para cookies, límites, pruebas y restricciones de revocación.

## Base de datos y migraciones

Supabase Preview: `kulvagylilutnpckpiuw`, región São Paulo, plan Free. No reutilizar las credenciales de producción. Revisar el proyecto enlazado antes de ejecutar:

```sh
npx supabase db push --dry-run
npx supabase db push
```

Nunca ejecutar reset en remoto. Migraciones versionadas: perfiles/experiencias y RLS; fixtures de catálogo; pedidos/pagos/cupos; comprobación de cuentas de prueba; límite persistente de creación de pedidos. Una experiencia nueva necesita cupos demo provisionados antes de poder comprarse.

Los pedidos guardan el nombre, descripción, precio y cantidad utilizados en la compra. La confirmación asigna cupos en una transacción, con manejo de duplicados y estados fuera de orden. No hay reservas temporales ni carrito multiexperiencia. Un pago sin cupo disponible queda en revisión, no fuerza sobreventa ni devolución automática.

## Evidencia y límites

- [E3: pruebas previas de formularios, CRUD y sesiones](docs/e3-verificacion.md). La autora confirmó registro, correo, ingreso y permisos cliente/admin. El 29/10 volvió a confirmar recuperación: formulario Nueva contraseña y login posterior correcto. El asistente interactivo probó sesiones normales contra servidor local y Supabase Preview; no implica cobertura nueva de todas las rutas en Vercel.
- [E4/E6: historial de implementación](docs/e4-e6-estado.md). Compra nueva de Cocina en equipo por ARS35.000, pago `185404201114`, webhook automático 200, pedido pagado y un cupo asignado. [Evidencia en PR](https://github.com/irugolo/TP-PW-Rugolo/pull/5#issuecomment-6325400430).
- Los tests de HTTP usan identidades/proveedores simulados; PGlite ejecuta PostgreSQL con `auth.uid()` emulado. No equivalen a sesiones reales, concurrencia remota ni pagos externos en todos los escenarios.
- Concurrencia remota verificada con fixtures: último cupo y duplicados simultáneos, sin sobreasignación; limpieza completa. La autora confirmó accesibilidad manual y compra sin retorno, contrastada con pago/pedido el30/10. Pendientes: excepciones MP completas y publicación final autorizada. Reembolsos parciales/contracargos y preferencias inciertas requieren revisión operativa; no se declara seguridad absoluta.
- Controles manuales de esta etapa: [checklist breve](docs/clase09-seguridad.md#controles-manuales-pendientes). La nueva captura de compra confirma escritorio, no móvil/zoom/teclado.

Para pruebas autenticadas locales sin compartir credenciales: iniciar `npm run dev` y ejecutar `python3 scripts/verify-interactive.py` en otra terminal. Pide credenciales ocultas, mantiene tokens en memoria, modifica/restaura un perfil y crea/elimina una experiencia temporal. No repetir sin necesidad; esta auditoría no requiere nuevas compras ni correos.

## Auditoría de rúbrica y defensa (29/10/2026)

- [Matriz E1–E6 y cinco criterios](docs/rubrica.md): aceptación, evidencia y pendientes.
- [Pruebas, bugs reales y checklist manual](docs/pruebas.md): distingue mocks, navegador aislado, SQL real y compra MP histórica.
- [Entornos, logs, CI/CD y publicación/reversión](docs/operacion.md): producción está pausada; publicación requiere aprobación.
- [Recorrido y preguntas de defensa](docs/defensa.md).

CI ejecuta Chromium headless con backend ficticio sin secretos:

```sh
npm run build:e2e
npx playwright install chromium
npm run test:e2e
```

Ese build usa datos/configuración ficticios: nunca desplegarlo como producción. Vercel construye con sus propias variables mediante integración Git; lint y pruebas preceden al build. main exige el check de CI. No subir trazas/capturas con sesiones a este repositorio público. Pruebas reales aisladas de Auth/CRUD y concurrencia tienen comandos/precondiciones en la documentación; crean y eliminan únicamente fixtures.

Modelo: `auth.users` 1:1 `perfiles`; usuarios 1:N `pedidos_demo`; experiencias 1:N pedidos y 1:1 `cupos_demo`; pedidos 1:N `pagos_demo`. IDs/foreign keys, cantidades y montos controlados; snapshot del pedido conserva condiciones de compra. No borrar experiencias con pedidos: despublicarlas.

La habilitación preparada para la demo pública es explícita (`MP_DEMO_PRODUCTION_ENABLED`), usa exclusivamente base Production y pagos test; actualmente no está activada. No se copian usuarios entre bases. El proyecto sigue pendiente de publicación final y no puede considerarse disponible públicamente mientras Supabase Production esté pausada.

### Renovación de portada y catálogo (Preview)
23 nuevas propuestas reservables, videos progresivos, filtros combinables y contenido editable. Alcance, migración idempotente, recursos y evidencia: [docs/renovacion-catalogo.md](docs/renovacion-catalogo.md). La producción no se modifica en esta etapa.
