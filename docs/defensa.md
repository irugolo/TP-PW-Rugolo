# Guía para defender Fuera de Plan

No memorizar una promesa de seguridad o una nota: mostrar comportamiento y explicar los límites. El proyecto vende experiencias ficticias con pagos exclusivamente de prueba. Ver [rúbrica](rubrica.md) para el estado exacto y [pruebas](pruebas.md) para evidencia.

## Recorrido de demo (8–10 minutos)

1. Abrir Preview autorizada (o dominio público solo después de publicar). Catálogo, filtros y detalle; cantidad/precio y “Reservar plan”. Aclarar que es compra directa, sin carrito de varias experiencias.
2. Cuenta cliente: perfil y pedidos propios. Intentar `/admin`: no entra. Mostrar que ocultar un enlace no es la protección: Route Handler controla identidad y DB aplica RLS.
3. Cuenta admin en sesión separada: crear experiencia ficticia borrador, editar, publicar/despublicar y eliminar solo esa experiencia nueva. Borrador no aparece ni por URL/API pública. Si una experiencia tiene pedidos, FK evita eliminar el historial.
4. Mostrar pedido de prueba previamente confirmado y sus detalles. Explicar webhook firmado, GET a MP y transacción de cupos. No repetir compras ni mostrar credenciales por hacer la demo.
5. Mostrar PR/CI del mismo commit, prueba de fallo del pipeline si está registrada, tests y matriz con pendientes. Separar simulaciones, DB real y compra completa de prueba.

## Preguntas y respuestas

**¿QA y QC son lo mismo?** QA previene: contratos, checklist, revisión, CI y separación de entornos. QC comprueba el producto: casos de prueba, tests E2E, exploratorio y resultados observados. B02 se encontró midiendo CLS y el elemento que saltaba; luego se corrigió y agregó regresión.

**¿Qué se ejecuta en cliente y en servidor?** React maneja formulario/filtro/carga y muestra errores. Route Handlers validan entrada, origen e identidad; Supabase aplica RLS. El servidor obtiene precio de DB y habla con MP; secretos nunca son props del cliente.

**¿Por qué Supabase Auth?** Administra cuentas, confirmación, hashing y sesiones. No almacenamos contraseñas. Cookies SSR sincronizan sesión, Proxy renueva claims; cada operación protegida verifica usuario y rol actual. Logout local revoca refresh de esa sesión; un JWT copiado puede seguir válido hasta expirar. No prometer cierre instantáneo de todos los dispositivos.

**¿Por qué RLS si ya hay un control de admin?** Porque la API de Supabase también puede llamarse directamente. Cada cliente ve filas propias, no se puede promover a admin ni editar pagos/cupos. El rol real sale del perfil de DB; metadata del navegador no decide permisos.

**¿Por qué el regreso de Mercado Pago no confirma?** Una URL puede escribirse a mano. El webhook valida HMAC, consulta el pago real por API y compara referencia, monto, moneda, vendedor y pruebas. Solo la conciliación SQL cambia el pedido. La pantalla muestra lo persistido.

**¿Qué pasa si llegan dos notificaciones?** El pago tiene ID único y fecha de actualización; conciliación evita repetir cupos y descarta estados antiguos. La prueba real de DB lanzó llamadas paralelas al último cupo: una confirmó y otra quedó en revisión. No es una prueba con cobros reales.

**¿Y si se aprobó sin cupos?** Se registra el pago en revisión, no se inventa una reserva. No hay retención temporal de cupos ni devolución automática. Es una política explícita del demo que requeriría operación adicional para un comercio real.

**¿Por qué apareció live_mode=true con cuentas de prueba?** No se infiere entorno por un texto o ese flag aislado. Se verifica el par fijo vendedor/comprador de prueba, vendedor test_user/MLA y descriptor fake cuando corresponde. Se preserva el flag original y la evidencia de cuentas verificadas.

**¿Cómo funciona en serverless?** Las instancias no comparten memoria ni disco durable. Los pedidos, límites, locks e idempotencia están en PostgreSQL. El webhook espera el commit antes del200, devuelve503 si falla para permitir reintento; no deja el trabajo crítico para después de responder.

**¿Cómo se protegen secretos y logs?** Variables privadas de servidor, `.env` ignorados, temporales privados borrados, respuesta sanitizada. Logs solo estado/correlación, no payload/token/email. Traces de Playwright pueden contener secretos; no se suben al repo público.

**¿CI verde garantiza que anda todo?** No. Cubre lo automatizado en ese SHA. Hay fixtures/mocks, sesiones reales contra Preview y evidencia MP por separado. Recuperación por correo se confirmó manualmente29/10. VoiceOver/zoom y escenarios MP que no se ejecutaron siguen pendientes.

**¿Cómo se bloquea código roto?** main exige CI estricta incluso a admins; build Vercel corre lint/test antes de Next. No alcanza con ver dos checks independientes. El ejercicio de fallo registra su SHA y resultado; admins todavía podrían cambiar reglas o usar CLI, límite que se documenta.

**¿Qué significa el rendimiento medido?** Es laboratorio local Chromium, no usuarios reales. Se corrigió un CLS0.226 causado por footer visible en loading; después0 en las cargas medidas. Las métricas actuales son LCP, INP y CLS; no se reemplaza INP por FID ni se afirma un percentil75 sin muestra.

**¿Por qué Preview privada y webhook público?** MP necesita alcanzar el endpoint sin iniciar sesión Vercel. Solo se expone la función que autentica con firma; web privada se mantiene. Publicación final usará base separada y dominio existente, únicamente con aprobación.

**¿Qué falta y qué no hicimos?** Mirar la matriz actual: producción pausada/publicación no ejecutada, controles manuales y alcance exacto de E6. No pagos reales, no servicios pagos, no garantía de disponibilidad Free ni calificación asegurada.
