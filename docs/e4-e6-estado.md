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

## Auditoría antes de pagar y ajuste visual (19/10/2026)

La autora detuvo el checkout al ver una tarjeta personal guardada. No confirmó pago. Se consultaron solo GET de Mercado Pago (`/users/me`, preferencia existente, búsqueda de pagos por external_reference) y lectura de pedidos Preview. La API confirmó vendedor 3762598376, MLA, tag test_user y coincidencia con la configuración local. Pedido 86fe8f07-9195-4664-a584-6ba1a0812af7: cerámica y vino, cantidad 1, ARS 50.000, pendiente. Preferencia 3762598376-416f4fd8-213e-4473-968e-cfa5915c4525: collector coincide, external_reference coincide, importe/cantidad/moneda coinciden, webhook Edge Preview y retornos privados correctos. URL almacenada igual al init_point de API, HTTPS www.mercadopago.com.ar/checkout/v1/redirect y pref_id correcto. Vigente al consultarla, vence 2026-10-19T21:33:52.087Z. Búsqueda de pagos: total 0. No se concluye live_mode=false de un pago inexistente ni se infiere entorno por la apariencia del checkout.

La sesión compradora del navegador NO puede verificarse desde estas APIs. Se pidió únicamente User ID del comprador de prueba para corroborar identidad. La tarjeta personal es compatible con una sesión personal abierta, pero no prueba por sí sola qué entorno usa el vendedor. No se autoriza retomar el pago con esa sesión. Usar sesión privada separada, comprador de prueba y tarjetas oficiales; la web cliente y Mercado Pago tienen cuentas distintas.

Problema concreto corregido: la reutilización de checkout devolvía URL almacenada sin volver a consultar vigencia/preferencia. Ahora se consulta la preferencia y se valida vendedor, referencia, item, cantidad, precio, ARS, callback/webhook y URL, tanto nueva como reutilizada; rechaza vencidas y no crea otra automáticamente. No se cambian estados de pago ni se agregan cobros. La UI verifica vendedor en servidor y configuración antes de habilitar controles; el POST conserva su propia verificación.

Compra integrada al detalle: precio/cantidad/total/botón agrupados, etiqueta demostración, controles y foco accesibles, estilos responsive con tamaños acotados. Resumen en dos columnas que se apilan en móvil. Aviso «reservas no disponibles» eliminado. Sin promesas de «sin dinero real». Estado inicial «Pendiente de pago»; «Estamos verificando tu pago» solo con un pago pending/in_process persistido. Parámetros de retorno ignorados. Compra de una sola experiencia preservada.

Validación local: 34 pruebas JS aprobadas, lint y build Next.js aprobados. Nuevas pruebas de preferencia alterada/ajena/vencida, estados basados en registros, bloqueo visual sin configuración y conservación de cantidad/reintento ante error de red. Revisión visual por navegador no realizada por instrucción de la autora. Manual pendiente: revisar experiencia y resumen a 375 px y escritorio, zoom 200% y recorrido Tab. E6 sigue pendiente del comprador y circuito real de prueba con webhook.

Fuente: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/integration-test/test-purchases .

## Pago aprobado pendiente de entrega y confirmación (20/10/2026)

La autora completó Checkout Pro y aportó el comprobante de operación 185062285072. Consulta autenticada GET `/v1/payments/185062285072`: approved/accredited, ARS18.000, vendedor 3762598376, comprador 3762598386, external_reference d16d91f9-580b-4d61-8ee8-5505900cc14d, descriptor Mercadopago*fake, **live_mode=true**. La API del vendedor lo identifica como MLA/test_user; la autora identificó al comprador en Cuentas de prueba y mostró su sesión test_user y tarjeta oficial. No se identifica una transacción de prueba solo por el flag o por la captura.

La condición original live_mode=false era incompatible con este pago entre cuentas de prueba. El handler y la migración nueva permiten live_mode=true ÚNICAMENTE si la API del pago informa ese par fijo de cuentas y descriptor fake, y `/users/me` confirma nuevamente el vendedor test_user MLA. Se guarda el live_mode original (no se falsifica como false), comprador y evidencia cuentas_test_verificadas. SQL impide true para otra pareja o sin evidencia; función sigue exclusiva de service_role. Se mantienen firma HMAC, referencia, importe/ARS, transacción, estados, idempotencia/RLS. Se agrega bloqueo transaccional por ID de pago para prevenir carreras entre pedidos. Este ajuste es específico de la demo, no habilita pagos reales o vendedores genéricos.

Migración 20261020000100_verified_test_accounts.sql aplicada exclusivamente a Preview, webhook Edge redeployado. No se hizo UPDATE manual del pedido ni se creó otro pago. Última lectura: pedido pendiente, cupos_asignados=false, pagos_demo vacío. No está probada aún la recepción/conciliación de una notificación firmada auténtica. Se pidió a la autora el código HTTP del historial Webhooks para esa operación; no pedir otra compra. E6 permanece abierta.

Interfaz: CTA «Reservar plan», «¡Compra exitosa!» solo para estado persistido pagado; detalle de reserva con ID, cantidad, precio/total, fecha de creación y zona/duración/inclusiones actuales del plan (no inventa fecha/sede real). Mis pedidos presenta «Pago confirmado» para pagado. Seis consultas de actualización de pantalla separadas por 5s mientras el pedido tiene preferencia y sigue pendiente, sin consultas en pestaña oculta ni confirmación por parámetros URL. Sin carrito multiexperiencia.

Validación: pruebas de rechazo de live_mode=true sin evidencia, comprador incorrecto, descriptor incorrecto y vendedor sin test_user; aceptación de par verificado preservando true; duplicados sin doble cupo; polling limitado y apagado en estado final; firma inválida y estados existentes. Build/lint y resultados finales se registran en PR. Revisión visual manual pendiente; no se abrió navegador.

Procedimiento oficial de prueba con credenciales de cuenta vendedor de prueba e init_point: https://www.mercadopago.com.ar/developers/es/news/2023/11/16/Questions-on-how-to-test-your-integration-- . La combinación observada de live_mode y evidencia se documenta como resultado de esta API, no como garantía general sobre ese flag.
