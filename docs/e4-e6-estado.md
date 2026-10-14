# E4/E6 — trabajo en curso

## Recuperación Preview (12 de octubre de 2026)

Preview `kulvagylilutnpckpiuw` estaba INACTIVE. Se solicitó una única restauración mediante POST `/v1/projects/{ref}/restore` de Management API, con credencial del llavero solo en memoria. Pasó por COMING_UP y RESTORING hasta ACTIVE_HEALTHY. Producción `lvkglhdckvnkixglyvms` permaneció ACTIVE_HEALTHY. No se crearon proyectos ni se cambiaron planes; no se configuró actividad artificial.

Verificación posterior: Auth health/settings 200; catálogo consultado dos veces y siete experiencias publicadas; borradores ocultos y perfiles/métricas anónimos denegados con 42501. Preview publicada: `/experiencias`, `/experiencias/juegos` y `/auth` 200 con contenido correcto. No se ejecutó login con contraseña ni recuperación de email: requiere sesión de la autora.

## Retoma

No había implementación ni pruebas de Mercado Pago anteriores a la pausa. Se creó `feat/e4-e6-checkout-pro` desde main limpio. La autora confirmó aplicación argentina Checkout Pro y cuentas vendedor/comprador de prueba disponibles; credenciales todavía no configuradas para la integración.

Primer avance E4 local, aún no publicado: GET `/api/experiencias` con filtro opcional `filtro=Con amigos|En pareja|Conocer gente`; GET `/api/experiencias/{id}`. Solo datos públicos; campos explícitos; parámetros inválidos 400, detalle no publicado/inexistente 404, colección vacía 200, error interno sin detalles 500. GET no modifica las rutas de escritura existentes. Pruebas con catálogo simulado; 23 pruebas JS, lint y build aprobados. No se declara E4/E6 terminada ni E5 verificada.

Pendiente: revisar PDF de clase, completar pedidos/cupos, Preferences API y webhook payments, pruebas de concurrencia y conciliación, configuración segura de credenciales, preview de rama y prueba real con Mercado Pago. Ninguna compra realizada ni pagos reales habilitados. Producción no se modifica.

Fuentes: https://supabase.com/docs/reference/api/v1-restore-a-project y documentación de Checkout Pro vía Preferences API https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/test-accounts .

## Implementación en curso (12 de octubre)

PDF de clase leído: 18 páginas; coincide con preferencia/back_urls/external_reference y webhook como fuente de confirmación. Se implementaron pedidos de una experiencia, resumen, enlace Checkout Pro, listado cliente/admin, lectura de pagos y webhook firmado con consulta `/v1/payments/{id}`. No se usan Orders API ni datos de tarjetas. No se pide Public Key: se redirige desde servidor al init_point de la preferencia del vendedor verificado de prueba.

Migración `20261012000100_test_orders.sql` aplicada SOLO a Preview. Cantidad 1–10, precio/descripcion copiados desde base, ARS; idempotencia de creación por usuario+UUID, preferencia con claim atómico. Si el resultado de crear preferencia es incierto, se bloquea su recreación y se requiere conciliación manual (todavía falta automatizar búsqueda de preferencia). Cupos demo iniciales: 20 por experiencia existente. Las experiencias nuevas requieren provisionar cupos explícitamente; no se habilitan automáticamente.

Política de cupos: no hay reservas temporales. Se verifica disponibilidad al crear pedido/checkout y se asigna al recibir aprobación en una transacción con bloqueo de fila. Sin cupos, el pago queda en revisión, sin reserva adicional; puede requerir devolución manual, que esta integración NO ejecuta. Dos pagos aprobados del mismo pedido generan revisión, sin doble asignación. Reembolsos completos liberan cupos una vez. Reembolso parcial, contracargo y automatización de resolución de incidencias pendientes; no se presentan como implementados.

Pruebas locales: 25 JS aprobadas, lint y build. Incluyen estados pendiente/aprobado/rechazado/reembolsado, duplicados/fuera de orden, control de capacidad secuencial y RLS en PostgreSQL embebido. NO equivalen a concurrencia real multi-conexión ni compra completa MP. Firma HMAC probada con fixtures. Falta cobertura HTTP completa de checkout/webhook, fallos de API y concurrencia real.

Bloqueos reales: credencial del vendedor pendiente de ingreso mediante `python3 scripts/configure-mp-test.py`, webhook secret y alcance de protección Vercel. No se habilitan pagos reales ni se declara E6 completa. El formulario se bloquea hasta completar credenciales verificadas. La autora confirmó login de Preview después de restauración.

## Webhook público, preview privada (14 de octubre de 2026)

Se descartó abrir Vercel por decisión de la autora. Se desplegó únicamente `mercadopago-webhook` en el proyecto Preview existente, mediante `supabase functions deploy ... --project-ref kulvagylilutnpckpiuw --use-api`. No se creó otro proyecto ni se cambió el plan. Solo esta función tiene `verify_jwt=false`; autentica las notificaciones con HMAC-SHA256 Web Crypto. No se usa bypass de Vercel.

URL: https://kulvagylilutnpckpiuw.supabase.co/functions/v1/mercadopago-webhook

Next.js y Edge comparten el mismo manejador. Solo acepta POST/payment, cuerpo limitado a 16 KB mientras se lee, data.id único y consistente, firma válida; consulta `/v1/payments/{id}` y exige live_mode=false, vendedor configurado, ARS, referencia UUID, monto y estado válidos. El destino Supabase está fijado a Preview. Ejecuta la misma RPC transaccional/idempotente, responde 200 únicamente después del commit y devuelve 503 ante errores para permitir reintentos. Las llamadas externas no siguen redirecciones y tienen un plazo conjunto de 18 segundos. No registra secretos ni devuelve datos de proveedores. Las nuevas preferencias usan esta URL; las existentes no se modificaron.

Credenciales existentes del vendedor de prueba verificadas nuevamente con `/users/me` y cargadas solo en los secretos de Edge Preview mediante temporal privado eliminado. La clave de firma de Mercado Pago sigue pendiente. `python3 scripts/configure-mp-webhook.py` la pide oculta y la carga en Edge Preview y en la variable de la rama E4/E6 de Vercel. Usa temporal 0600 y limpieza en errores/interrupción/SIGTERM, sin secretos en argumentos ni logs. Después debe redesplegarse Vercel para habilitar checkout.

Verificado: 30 pruebas JS, lint y build Next.js aprobados. Incluyen HTTP simulado de firma/método/cuerpo inválidos, entorno y pago ajeno, monto/referencia/estado inválidos, fallos de API/lectura/commit; SQL embebido verifica idempotencia y cupos. Endpoint remoto real: GET 405; POST 503 «Webhook sin configurar». Preview privada: acceso sin sesión 302. No se simularon estos resultados como una compra real ni se escribió un pago ficticio en remoto.

Estado consultado por CLI: Preview ACTIVE_HEALTHY, producción INACTIVE. No se restauró ni modificó producción por el alcance de esta tarea.

### Pasos pendientes de la autora

1. En la aplicación de Mercado Pago correspondiente al vendedor de prueba: Webhooks, configuración de pruebas, URL anterior, evento Pagos/payment. Guardar. Usar la clave secreta de esa misma aplicación.
2. En zsh, dentro del proyecto: `python3 scripts/configure-mp-webhook.py`. Pegar la clave en el prompt oculto. Informar solamente el mensaje final. No volver a ingresar el Access Token.
3. Tras redespliegue y verificación del agente, abrir https://tp-pw-rugolo-e4e6-programacion-web.vercel.app y entrar a la web con la cuenta cliente isabelrugolo@gmail.com (Vercel puede pedir primero acceso a la preview).
4. Elegir una experiencia, cantidad 1 y crear un pedido nuevo. Continuar a Mercado Pago usando el comprador de prueba, distinto del vendedor; usar exclusivamente las tarjetas de prueba indicadas en la documentación oficial, nunca una tarjeta real. Las cuentas de Mercado Pago son distintas de las cuentas cliente/admin de la web.
5. Volver al pedido y actualizar su estado. Informar el ID del pedido y resultado visible, sin credenciales. El agente debe contrastar el pago con Mercado Pago y su registro/estado/cupos persistidos por el webhook, y comprobar reintento sin doble cupo.

E6 continúa abierta hasta verificar ese circuito. El simulador de notificaciones por sí solo no demuestra un pago aprobado ni debe evitar la validación de firma.

Referencias: https://supabase.com/docs/guides/functions/function-configuration ; https://supabase.com/docs/guides/functions/pricing ; https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/payment-notifications .
