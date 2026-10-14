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
