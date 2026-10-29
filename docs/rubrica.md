# Matriz de aceptación — Fuera de Plan

Corte: 29/10/2026. Esta matriz distingue evidencia histórica, ejecución actual y pendientes. No calcula una nota: no se proporcionó la explicación del asterisco de ponderaciones. “Verificado” se refiere al criterio concreto de la fila, no a certificación ni cobertura universal.

Entornos: Preview privada `kulvagylilutnpckpiuw` ACTIVE_HEALTHY; producción `lvkglhdckvnkixglyvms` INACTIVE en consulta CLI de este corte. PR [#5](https://github.com/irugolo/TP-PW-Rugolo/pull/5), rama `feat/e4-e6-checkout-pro`, base inicial `d8e8999`. Los commits de esta auditoría se identifican en el PR y en [pruebas](pruebas.md). No se restauró ni modificó producción.

| Requisito | Aceptación | Implementación y evidencia | Entorno / estado | Pendiente |
|---|---|---|---|---|
| E1 instalación | Instalación limpia, Node compatible, lockfile | `npm ci`, `.nvmrc` 24, `engines >=24`; Vercel project inspect informa Node 24.x; `vercel.json` sobrescribe preset antiguo Vite con Next.js | local/CI; verificado en versión anterior, nueva CI pendiente | Confirmar CI del commit final |
| E1 checks | Lint + pruebas + build + E2E, PR y main | `.github/workflows/ci.yml`, permisos contents:read; sin secretos ni pull_request_target | implementado sin verificar para CI ampliada | Resultado remoto del commit final |
| E1 bloqueo | Fallo impide integración y publicación final | Protección main: check “Instalar y compilar Next.js”, strict, enforce_admins, sin force/delete; Vercel build ejecuta lint/test antes de Next | configuración API verificada; ejercicio de fallo pendiente | Registrar ejercicio controlado y recuperación |
| E1 preview | Mismo SHA que PR, Ready, acceso autorizado | Git integration; no duplicar con `vercel deploy`; alias privado estable | pendiente para nuevo SHA | Confirmar Ready y lectura publicada |
| E2 UI | Landmarks, encabezados, labels, contraste, responsive | Axe WCAG 2.2 AA pertinente + Chromium 375/768/1440; inicio, catálogo, detalle, auth, perfil, pedidos vacíos, admin; captura local detalle | verificado local, fixtures/QA real diferenciados | Zoom real, VoiceOver, confirmación móvil actual; no certificación |
| E2 estabilidad | Sin saltos visibles durante carga | `loading.js` reserva viewport; footer identificado como fuente; CLS lab catálogo móvil 0.226→0 | verificado local | Rendimiento de usuarios reales no disponible |
| E3 formularios | Datos inválidos no se guardan; errores y reintento accesibles | Zod server, HTML/React; Route Handlers/Testing Library: vacíos, rangos, red, 422, foco, fin de carga, preservación de campos | verificado unitario/DOM + Auth E2E | Exploratorio manual actual |
| E3 fetch | Cambio reactivo con persistencia real | Perfil PATCH, CRUD POST/PATCH/DELETE, creación pedido POST y checkout POST; Supabase SDK para Auth | verificado por tests + CRUD remoto QA | No introducir fetch artificial |
| E4 catálogo | Navegación, filtros, vacío, 400/404/500 coherentes | `Catalogo`, `catalog.js`, GET `/api/experiencias[/id]`; tests contratos/E2E; draft API404 y RLS oculto | verificado local y DB Preview | Revalidar catálogo publicado nuevo SHA |
| E4 revisión | Checklist y evidencia en PR | Template `.github/pull_request_template.md`, esta matriz y evidencia PR | implementado sin verificar | Actualizar PR final |
| E5 modelo | Relaciones y restricciones, sin pérdida de historial | Migraciones perfiles/experiencias/pedidos/pagos/cupos; FK impide eliminar experiencia con pedidos | verificado PGlite + PostgreSQL Preview | Producción requiere migraciones después de aprobación |
| E5 CRUD | Crear, leer, editar, publicar/despublicar, eliminar, persistencia | QA temporal: admin normal HTTP, recarga y segundo cliente; limpieza finally | verificado Preview vía localhost | No se alteraron cuentas de la autora |
| E5 permisos | Visitante401, cliente403, aislamiento, rol inmutable | `identity/getUser`, perfil server actualizado, RLS/grants; metadata ignorada, no caché privada | verificado mocks + sesiones reales + SQL | JWT de acceso copiado conserva vigencia hasta expiración; no afirmar revocación instantánea |
| E6 checkout | Precio/moneda/cantidad en servidor, compra directa | RPC calcula snapshot, cantidad1–10; vendedor test verificado, preferencia validada, claim evita duplicar | verificado SQL/unitario; compra histórica completa | UI de checkout final actual tras nuevos cambios |
| E6 webhook | Firma + API + coherencia antes de confirmar | Handler compartido Next/Edge; referencia, importe, moneda, vendedor/test; solo 200 después RPC | verificado unitario + compra automática 21/10 | Nuevo Edge solo cambia logs/control de destino; revisar despliegue |
| E6 estados | Pendiente, rechazo, duplicados, retrasos, fuera de orden, fallos | tests webhook y PostgreSQL; pago sin cupo → revisión, sin devolución automática | verificado simulación/SQL | No todos los escenarios se ejecutaron contra MP real |
| E6 concurrencia | Último cupo y duplicados simultáneos no sobreasignan | `verify-concurrency.mjs`, tres conexiones reales, dos conciliaciones paralelas, FK/RLS | verificado Preview; pagos SQL sintéticos, fixtures eliminados | No equivale a concurrencia de red MP |
| E6 pago completo | Webhook automático confirma pedido y cupo | Pago185404201114, pedido ddea66e7-568d-46ba-8c8d-3b8e2ed20bc5; [evidencia21/10](https://github.com/irugolo/TP-PW-Rugolo/pull/5#issuecomment-6325400430) | verificado histórico Preview | Aprobación cerrando checkout antes del regreso no observada; pendiente manual |
| Auth correo | Registro confirmado, login/logout, recuperación | Historial E3 y confirmación autora29/10: apareció “Nueva contraseña”, cambió y pudo ingresar | verificado manual Preview d8e8999 | No repetir correos sin cambio relevante |
| Auth sesiones | Renovación y rechazo tras logout | Refresh real válido; refresh revocado rechazado; recarga conserva sesión, logout UI redirige | verificado QA Preview | Expiración natural de1h no cronometrada; rechazo vencido simulado |
| Seguridad secretos | Valores privados fuera de cliente/Git/logs | server-only, env ignorados, escáner por valores + revisión imports/respuestas, logs correlación sin payload | verificación en curso | No confundir enmascarado del CLI con valor real escaneado |

## Cinco criterios transversales

No se compensan entre sí.

| Criterio | Estado global | Evidencia / límite |
|---|---|---|
| Funcionalidad robusta | implementado sin verificar en totalidad | Recorridos centrales y errores cubiertos; sin-regreso y excepciones MP completas pendientes. |
| Código modular y legible | verificado por revisión de código | UI, contratos, acceso, proveedor, HMAC y transacción SQL separados; handler compartido, sin duplicar validación Edge/Next. |
| Interfaz intuitiva/accesible | implementado sin verificar en totalidad | Axe y responsive automatizados; controles manuales actuales pendientes. |
| Despliegue final público estable | bloqueado | Requiere aprobación final y restaurar producción existente. Preview sigue privada. Free puede pausarse; no garantía de disponibilidad. |
| Documentación coherente | implementado sin verificar | README + matriz + pruebas + operación + defensa; revisar links/evidencia del commit final. |

## Material de clase y alcance

Leídos completos `12-clase-12.pptx.pdf` y `13-clase-13.pptx.pdf` (18 páginas cada uno): QA preventivo con checklist/CI, QC con casos ejecutados, debugging por causa y regresión; entornos separados, serverless, secretos y logs.

Los YAML/Node20 de la clase son ejemplos: se usa Node24 compatible con el despliegue observado. La métrica vigente es INP, no FID. Los umbrales de campo son LCP≤2.5s, INP≤200ms, CLS≤0.1 en percentil75; un muestreo local no demuestra esos resultados en usuarios reales. Dominio propio/DNS y Log Drains son opcionales, no requisitos de esta rúbrica; `.vercel.app` y logs existentes bastan, sin contratar servicios.

Fuentes oficiales contrastadas: [Playwright CI](https://playwright.dev/docs/ci), [trazas y contenido sensible](https://playwright.dev/docs/trace-viewer), [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks), [métricas vigentes PSI](https://developers.google.com/speed/docs/insights/v5/about), [umbrales Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds), [TLS Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement). Un check de Vercel aislado no sustituye la protección de main ni el resultado de CI.
