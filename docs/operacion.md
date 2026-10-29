# Entornos, operación y publicación

## Aislamiento comprobado (29/10/2026)

| Entorno | Aplicación/base | Situación |
|---|---|---|
| Development | localhost + Preview para pruebas explícitas; E2E CI usa fixture local sin secretos | Nunca apuntar tests a producción |
| Preview | Alias privado `tp-pw-rugolo-e4e6-programacion-web.vercel.app`; Supabase `kulvagylilutnpckpiuw` | ACTIVE_HEALTHY; web exige Vercel, Edge público exige HMAC |
| Production | `tp-pw-rugolo.vercel.app`; Supabase `lvkglhdckvnkixglyvms` | DB INACTIVE; Vercel viejo E3 Ready no implica app funcional |

Secrets no viajan al cliente: `server-only` en cliente privilegiado, SDK Auth usa solo publishable key, selección explícita del catálogo, respuestas sanitizadas. `.env.example` contiene nombres sin valores; `.env*` reales fuera de Git y Vercel upload. `.next/static` y archivos versionados se contrastan con valores privados realmente disponibles; los valores enmascarados del CLI no cuentan. Las URL/refs/IDs de prueba no son credenciales. No registrar emails, tokens, cookies, payloads MP ni respuestas SMTP.

Variables públicas: NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY. Server: APP_ORIGIN (origen exacto), MP_TEST_MODE=true, MP_TEST_ACCESS_TOKEN (vendedor de prueba), MP_TEST_SELLER_ID, MP_WEBHOOK_SECRET (app del mismo vendedor), MP_BASE_URL y SUPABASE_SERVICE_ROLE_KEY propia de cada base. `MP_DEMO_PRODUCTION_ENABLED=true` será necesario **solo después de aprobación final**, en Production y su Edge. Hoy no está activado. Lista cerrada de proyectos/orígenes en `demo-environment.js`; Production nunca puede usar DB Preview. No hay modo de cobros reales.

## CI/CD y límites

GitHub Actions en PR/main: npm ci → lint → pruebas JS/Python → build con fixtures → Chromium E2E. Node 24 coincide con versión mayor Vercel observada. Proyecto Vercel aún muestra preset histórico Vite; `vercel.json` declara explícitamente Next.js/build/install y tiene precedencia, no es necesario cambiar la configuración de producción para resolverlo.

main exige “Instalar y compilar Next.js”, rama actualizada (strict), aplica a admins, forcepush/delete prohibidos. Vercel ejecuta lint/test antes del build, por lo que un fallo no crea deployment Ready. La CI ampliada es obligatoria para integrar en main y disparar su publicación Git. No hay un segundo workflow de deploy ni despliegues manuales duplicados.

Límite: quien administra el proyecto puede cambiar protecciones o desplegar por CLI; la protección Git no revoca esos privilegios. Una Preview puede construirse antes de finalizar E2E de Actions; no debe fusionarse hasta que el check obligatorio pase. No se afirma que ambos proveedores compartan una única transacción.

## Logs y diagnóstico

- Build: Actions (paso y commit), Vercel build (lint/test/build). Consultar primer error, no “Ready” de otro SHA.
- Runtime: Vercel funciones y Supabase Edge. Respuestas de error API y webhook incluyen `x-correlation-id`; JSON log solo component/correlation/status y duración en webhook. No hay trabajo crítico después de responder.
- 401 webhook: comprobar firma/app del vendedor, data.id/request-id; nunca desactivar HMAC. 422: verificar por GET servidor pago/ref/ARS/importe/vendedor/test y pedido. 503: revisar proveedor/DB y reintento. No tratar retry como nuevo pedido.
- Webhook200 solo después del commit SQL. Estado en DB persistente, locks SQL para cupos/claim; no confiar en variables globales, disco efímero ni tareas en segundo plano serverless.
- Preferencia “incierta”: no crear otra automáticamente; revisar API del proveedor y pedido con acceso autorizado. Pagado sin cupo queda revisión, no se promete reserva ni se devuelve dinero automáticamente. Reembolsos parciales/contracargos requieren revisión fuera del alcance automático.

## Publicación final preparada, NO ejecutada

Destino concreto: main → proyecto Vercel existente → `https://tp-pw-rugolo.vercel.app`, catálogo público; cuenta/pedidos/admin siguen protegidos por Supabase. Preview continúa privada. No recursos nuevos ni pagos.

Después de **una aprobación explícita** para publicar:

1. Restaurar **proyecto Production existente** por mecanismo oficial; consultar estado hasta ACTIVE_HEALTHY. Si Free no permite restaurar, detenerse sin contratar ni crear reemplazo. No tareas artificiales de actividad.
2. Obtener respaldo privado de tablas/datos existentes y listado de migraciones; permisos0600, fuera del repo. No `db reset`. Revisar diferencia: producción E3 frente a migraciones `20261012000100`, `20261020000100`, `20261021000100` y `20261029000100` (opción de imagen/corrección condicionada). Aplicar solo pendientes, abortar ante divergencia. Su estado real no puede confirmarse mientras está pausada.
3. Configurar variables de Production con su URL/publishable/service key, APP_ORIGIN/MP_BASE_URL del dominio final, mismas cuentas MP **test**, secreto de app correcto; habilitación explícita de demo. No copiar usuarios ni DB desde Preview.
4. Desplegar Edge firmado en `https://lvkglhdckvnkixglyvms.supabase.co/functions/v1/mercadopago-webhook`, modo demo explícito. Solo esa función sin JWT; HMAC sigue obligatorio. Preferencias nuevas usan ese destino; preferencias Preview conservan el suyo. Comprobar configuración MP para notificaciones de esa app sin borrar URL Preview si todavía se usa.
5. Revisar SMTP/callbacks de Production y cuenta admin ya existente sin resetear contraseña. El registro/confirmación de Production es independiente de Preview.
6. Con PR actualizado y CI verde, fusionar una vez. Esperar despliegue Git, comprobar SHA, Ready, HTTPS, acceso sin login Vercel al catálogo y 401/403 en datos privados. Verificar catálogo/roles/recuperación sin datos destructivos; compra exclusivamente test si hace falta validar el nuevo entorno.

Riesgos concretos: pausa Free, configuración/correo envejecidos, migraciones pendientes, MPfirma ligada a otra app, rate limits y disponibilidad proveedores. Free no ofrece garantía de disponibilidad. Hay que revisar el estado antes de la defensa, sin cron de keepalive.

Reversión: dejar anotado SHA/deployment anterior y export privado de configuración. Si falla el nuevo build, no promoverlo. Si falla runtime tras publicar, rollback al deployment anterior y deshabilitar `MP_TEST_MODE` en Production hasta resolver; mantener registros/migraciones aditivas, no borrar pedidos ni ejecutar down destructivo. Un rollback de código no deshace DB y el antiguo E3 no resuelve por sí solo una base pausada.

Hasta la aprobación: revisar por lectura; no restaurar Production, aplicar migraciones allí, cambiar sus variables ni fusionar. `.vercel.app` es suficiente; no DNS, dominio ni Log Drains pagos.
