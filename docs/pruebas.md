# Registro de pruebas y defectos

Fecha 29/10/2026. Base `d8e8999`, cambios de auditoría en PR#5. No se atribuyen resultados actuales a producción. El detalle final de SHA/CI/Ready se añade en el cierre de este archivo.

## Ejecuciones

| ID / requisito | Método, precondiciones y datos | Pasos / esperado | Observado / evidencia |
|---|---|---|---|
| T01 E3/API | `npm test`, datos ficticios, mocks de identidad/proveedor | Vacíos, formatos, rangos, origen ajeno, JSON inválido; 400/401/403/413/415/422 sin persistir | Suite JS pasa; tests nombran alcance en `tests/` |
| T02 E3/red | Testing Library + jsdom, fetch rechaza o responde422 | Editar perfil/experiencia/cantidad; enviar; error claro, termina carga, conserva campos, permite reintentar | Pasa `tests/ui`; contraseñas no se almacenan en disco/localStorage |
| T03 E4/E2 | Playwright Chromium headless, backend fixture aislado | Filtros→detalle→volver; Auth inválido; páginas privadas inaccesibles; Axe375/768/1440 | 7 pruebas pasan localmente con Node24, incluida regresión CLS; CI final pendiente |
| T04 E5/Auth | `node --env-file=.env.local scripts/verify-auth-isolated.mjs`, servidor localhost3300 con Preview real | Crea2 usuarios QA sin enviar correo; login UI, recarga, cliente403, promoción soloQA, CRUD draft/publicado y segunda sesión, democión, logout y refresh revocado | Pasa; también Axe/perfil/pedidos vacíos/admin en3anchos; cuentas y experiencia eliminadas |
| T05 E5/E6 | `node scripts/verify-concurrency.mjs`, Preview PostgreSQL real con TLS verificado | Dos pedidos QA, último cupo1, dos conexiones concilian en paralelo; repetir mismo pago en paralelo | Pasa: pagado+revision,1cupo;2pagos sin duplicar; FK23503, RLS otrocliente invisible; limpieza final |
| T06 E6 estados | PGlite `tests/orders.test.js`; RPC real, auth.uid emulado | pending→approved, duplicado, pending antiguo, otro rejected, sin cupo, refund completo y duplicado, importe incorrecto | Pasa. Es PostgreSQL embebido, no MP real ni concurrencia |
| T07 E6 HMAC/API | `tests/payment-webhook.test.js`, HTTP/fetch simulado | Firma inválida401, cuerpo400/413, ajeno422, API/commit fallan503, correcto200 después de commit | Pasa; ningún pago real; correlación sin payload |
| T08 E6 integral | Compra efectuada por autora21/10 en Preview con comprador/vendedor test | Pagar Cocina35000; recepción automática, API validada, pedido pagado y1cupo | Verificado histórico: [PR evidencia](https://github.com/irugolo/TP-PW-Rugolo/pull/5#issuecomment-6325400430); no volver a pagar solo para repetir evidencia |
| T09 Auth recuperación | Autora29/10, correo real, navegador que inició PKCE | Solicitar una vez, abrir enlace, “Nueva contraseña”, guardar e ingresar | Autora confirmó todos esos pasos. No se recibió contraseña ni enlace privado |
| T10 rendimiento | `node scripts/measure-lab.mjs`, build production local, Chromium, viewport900alto, sin throttling | Medir inicio/catálogo/cocina; sin imágenes rotas/desbordes | Resultados debajo; no INP ni percentiles de campo |
| T11 scripts | `python3 -m unittest discover -s tests -p 'test_*.py'` | Manejo SMTP, credenciales test, destinos y fallos sin secretos | 10 pruebas pasan |

T04 necesita permisos de creación/eliminación en Preview: usa CLI nativa, secretos solo en memoria, UUIDs nuevos, nunca usuarios reales. T05 necesita `.env.supabase-db` privado y CA de Supabase. Descargar CA pública oficial y pasar `SUPABASE_CA_CERT_PATH`; no desactivar validación TLS. Una interrupción puede impedir finally: revisar solo IDs `qa-...` de esa ejecución, nunca limpiar por prefijo global.

```sh
# Servidor para T04 y T10, después de npm run build con variables reales Preview:
APP_ORIGIN=http://localhost:3300 npm run start -- -p3300 -H127.0.0.1
# Otra terminal:
node --env-file=.env.local scripts/verify-auth-isolated.mjs
node scripts/measure-lab.mjs
# T03 usa build y backend completamente ficticios, no desplegar ese artefacto:
npm run build:e2e
npx playwright install chromium
npm run test:e2e
```

## Bugs reales encontrados

| ID | Severidad / prioridad | Reproducción / observado vs esperado | Causa, corrección y regresión |
|---|---|---|---|
| B01 recuperación (histórico22/10) | Alta / alta | Volver desde email a Auth ya montado mostraba login; debía mostrar nueva contraseña | Estado inicial obsoleto; modo deriva de prop y callback reconoce recovery. Unitario de rerender + T09 confirmado29/10. |
| B02 salto de catálogo | Media / media | Cargar catálogo móvil: footer aparecía y desaparecía; CLS0.226 | PerformanceObserver identificó FOOTER. Fallback corto no reservaba espacio; `loading.js` reserva100svh. Lab posterior0; E2E con latencia simulada agregado. |
| B03 dependencias vulnerables | Alta (aviso crítico en Next) / alta | `npm audit` señaló Next16.3.6, Zod4.6.5 y undici transitivo | Next/eslint-config-next16.4.2, Zod4.6.7, lock actualizado sin audit force. Auditoría posterior0 hallazgos conocidos; no equivale a ausencia de vulnerabilidades. |
| B04 falta de bloqueo main | Alta / alta | API GitHub mostró main sin protección; check fallido no era requisito de integración | Se activó check estricto y enforce_admins, prohibiendo force/delete. Ejercicio controlado del pipeline registrado aparte; no es un bug ficticio de producto. |

## Laboratorio antes/después de B02

Un muestreo, misma máquina, sin throttling; caché y red Supabase influyen. CLS aquí es suma de entradas sin interacción durante la carga, no estadística de campo por ventanas de sesión.

| Vista | Ancho | CLS antes | CLS después | LCP después(ms) |
|---|---:|---:|---:|---:|
| Inicio |375|0|0|132|
| Catálogo |375|0.2263|0|820|
| Cocina |375|0.1433|0|344|
| Inicio |1440|0|0|28|
| Catálogo |1440|0.1894|0|360|
| Cocina |1440|0.0287|0|356|

Sin overflow ni imágenes rotas en esas6cargas. Next Image sirve tamaños responsive; dimensiones/aspect-ratio reservan espacio. Captura local `/tmp/fdp-mobile.png`, no subida. No hay muestra real para INP/LCP/CLS p75: no se afirma aprobación Core Web Vitals de campo.

## Casos manuales aún pendientes

Usar [Preview privada](https://tp-pw-rugolo-e4e6-programacion-web.vercel.app), autorizar Vercel con cuenta de la autora; después usar cuenta propia de la web. No compartir contraseñas. Datos de ejemplo: Nombre “Prueba”, Teléfono “abc@”. Resultados observados y evidencia: **pendientes**, salvo T09 arriba y controles históricos identificados en E3/clase09.

| ID | Requisito / precondición | Pasos exactos | Resultado esperado |
|---|---|---|---|
| M01 | E2 teclado, cliente | `/auth`, `/mi-cuenta`, `/pedidos`: Tab/Shift+Tab, Enter; usar “Saltar al contenido” | Foco visible, orden lógico, controles activables, sin trampa; datos privados solo propios |
| M02 | E2 zoom/móvil | Inicio, catálogo, detalle y pedido confirmado: zoom200%; ancho320px, luego móvil real | Texto y botones legibles sin solapamiento ni scroll horizontal; no perder acciones |
| M03 | E2 lector pantalla | VoiceOver: recorrer h1/h2, links y campos en auth/perfil; enviar perfil vacío | Labels anunciados, error asociado y foco en primer campo inválido; estado entendible |
| M04 | E6 independiente del retorno | Solo cuentas MPtest ya verificadas: nueva compra demo; una vez aprobado cerrar checkout antes de volver. Abrir `/pedidos` desde otra pestaña | Pedido confirmado por webhook, cupo1; correlacionar pago/registro servidor. No confirmar desde query de retorno. No usar medios reales |
| M05 | E2/E3 exploratorio10min | Filtrar y volver, abrir URL inexistente, desconectar red antes de guardar perfil temporal, reconectar/reintentar y restaurar nombre | Vacíos/404 claros, sin duplicados, recupera carga, conserva campos; anotar ruta/pasos/resultado sin credenciales |

## Capturas/trazas

Playwright solo Chromium headless aislado, sin sesión del navegador personal. Capturas de fallo en `test-results/`, ignoradas en Git/Vercel; no se suben artifacts a este repo público. Traces desactivadas por defecto. Para diagnóstico de fixtures se puede ejecutar `npm run test:e2e -- --trace retain-on-failure`, revisar localmente, nunca adjuntar sin depurar y borrar tras diagnóstico (máximo7d). No hacerlo en recorridos con cuentas personales; una traza puede incluir cookies y cuerpos. No se promete Firefox/WebKit ni dispositivos reales.

## Escaneo de secretos y configuración

29/10: comparación exacta de **Access Token test y service_role Preview** reales contra122archivos versionados/bundles `.next/static`:0coincidencias. Se capturó service_role con CLI nativa en memoria. El secreto HMAC de Vercel es sensible/no descargable: no se afirma haber comparado su valor; se revisó su uso exclusivo en servidor y que respuestas/logs no lo serialicen. El primer intento con env pull contenía marcadores, por eso no se tomó como evidencia de secretos MP. Temporales0600 eliminados. Un escaneo por coincidencia exacta no detecta toda transformación posible; revisión de flujo y tests sanitizados complementan.

Node local de validación final24.22.2 mediante npm exec; Vercel24.x. Lint, build Next16.4.2,48pruebasJS y7E2E pasan. Python10 pasa. No se comparan estos resultados con producción pausada.
