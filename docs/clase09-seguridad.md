# Clase 09 — autenticación, autorización y sesiones

Revisión del 21–22/10/2026 en `feat/e4-e6-checkout-pro`, PR #5. Se leyeron las 18 páginas de `09-clase-09.pptx.pdf`, incluida la comparación visual de sesiones/JWT. Versiones instaladas: Next 16.3.6, @supabase/ssr 0.12.7 y supabase-js 2.117.2. No se reemplaza Auth ni se implementan hashes o JWT propios.

## Diagnóstico y correcciones

Ya implementado: registro/confirmación, login, recuperación, perfil cliente/admin, identidad validada con `getUser()`, rol consultado en perfiles, protección por página/handler y RLS. Las contraseñas se transmiten a Supabase por HTTPS; hashing y salt son responsabilidad del proveedor. Se mantienen 12 caracteres mínimos sin imponer reglas nuevas a las cuentas existentes. React escapa texto y Supabase usa consultas parametrizadas; no se renderiza HTML de formularios.

Cambios concretos:

- Cookies con `Secure` en HTTPS y `SameSite=Lax`. `HttpOnly=false` es intencional: esta arquitectura usa cliente Supabase para leer/renovar sesión. Forzarlo rompería ese flujo. No se confunde con una defensa completa contra XSS.
- Logout explícitamente local: cierra la sesión actual, no todas las sesiones de otros dispositivos. Error controlado y reintento si no se confirma.
- Límite de 15 segundos por solicitud fetch del cliente Supabase; mensajes accesibles y estado de carga liberado ante error. Los reintentos internos de renovación del SDK pueden durar más que una solicitud individual.
- Validación nativa antes de enviar Auth y mensaje específico para 429, sin indicar si un email existe.
- Lectura incremental de JSON con máximo de 20.000 bytes, también para texto multibyte, y MIME exacto. Origin requerido en mutaciones; no se autoriza mediante Host/Forwarded-Host.
- Callback PKCE con destinos fijos, `no-store` y `no-referrer`; código vencido/inválido produce mensaje genérico. No se aceptan redirecciones externas del usuario.
- Errores privados `no-store`; permisos SQL denegados se representan como 403, no conflicto 409.
- Creación de pedidos limitada a 10 nuevos por 10 minutos/usuario en PostgreSQL. Bloqueo transaccional por usuario, índice para consulta y error PT429/HTTP429. La misma clave idempotente retorna el pedido previo antes del límite. No depende de memoria serverless y también cubre RPC directa. No es un límite general de tráfico ni defensa DDoS.
- Site URL de Auth Preview corregida al alias estable; no se modificó producción ni se quitaron URLs autorizadas existentes.

## Responsabilidades y permisos

La [matriz de permisos del README](../README.md#matriz-de-permisos) diferencia visitante, cliente y administrador.

Supabase Auth verifica credenciales, confirmación, firma/expiración y renovación. Proxy sincroniza cookies y valida claims; no sustituye autorización. `identity()` consulta Auth y perfil en servidor; `identity(true)` exige admin. RLS aplica propiedad y rol incluso en llamadas directas; los permisos por columna impiden cambiar rol/ID. Los administradores leen pedidos pero no modifican pagos/cupos desde el cliente. El checkout exige propietario incluso para admin. El webhook no requiere sesión: exige firma y comprobación autoritativa de Mercado Pago antes de conciliar.

No hay caché compartida de respuestas privadas: páginas protegidas dinámicas, cookies por solicitud, Proxy `private, no-store` y APIs de pedidos `no-store`. El servicio privilegiado está limitado a checkout/webhook; nunca se usa para autorizar perfil o CRUD.

## Sesiones y límites reales

Configuración remota de Preview inspeccionada por Management API, mostrando solo campos no secretos: confirmación habilitada; mínimo 12 caracteres; JWT 3600 segundos; rotación activa; tolerancia de reutilización 10 segundos; OTP 3600 segundos; frecuencia de correo 60 segundos. Consulta inicial: cuota de correo 2/h, token 150 y verificación 30. No se sometió el proyecto a una ráfaga real para provocar límites. El archivo TOML local no demuestra la configuración alojada.

Auth se llama directamente desde navegador; Supabase aplica sus límites por IP. No se creó un proxy de login ni un contador en memoria. No se agregó CAPTCHA ni un servicio externo. El límite de pedidos protege escrituras; catálogo/lecturas y CRUD no tienen un limitador propio adicional. Preview conserva protección Vercel; antes de publicación abierta debe evaluarse tráfico/abuso y cuotas SMTP. No se afirma que protección de acceso equivalga a rate limiting.

No hay expiración por inactividad ni duración máxima configuradas. Una sesión puede renovarse hasta logout/revocación. La cookie persistente no significa que el JWT sea válido indefinidamente. Proxy puede renovar un JWT vencido con refresh válido; si falla, páginas/handlers protegidos deniegan acceso. Las pruebas de esta etapa simulan estas respuestas; no aceleran el reloj real del proveedor.

Logout elimina la sesión local y revoca su refresh token. **No se promete invalidación instantánea de un access token ya copiado**: la Data API puede aceptarlo hasta su expiración (hasta una hora). No se implementó una denylist ni consulta a auth.sessions en cada política. `getUser()` valida la identidad en las operaciones de servidor, pero no se presenta como prueba remota de todas las variantes de revocación. Los cambios de rol se consultan en la base en cada operación nueva; RLS usa el rol actual, no metadata editable ni un rol antiguo del JWT. Una pantalla ya abierta puede conservar información visual hasta refrescar; no permite nuevas escrituras sin autorización.

## Pruebas y evidencia

- 44 pruebas JavaScript aprobadas: formularios/red, origen/MIME/tamaño, callback inválido/retornos, cookies, visitante y sesión inválida 401, cliente 403, metadata admin ignorada, cambio de rol, pedido invisible 404, payload con rol rechazado, logout local/429 y SQL de pedidos/cupos.
- PostgreSQL embebido PGlite: RLS de perfiles y experiencias, revocación de admin, aislamiento de pedidos, denegación de alteración de pagos/cupos y ejecución de conciliación como cliente, límite de pedidos e idempotencia. `auth.uid` emulado; no equivale a concurrencia real entre conexiones ni sesiones remotas.
- Handlers usan mocks del proveedor/identidad donde se indica; ningún test simulado se declara login real. Registro, confirmación y recuperación reales fueron comunicados por la autora en E3; no se repitieron correos ni se pidieron contraseñas.
- Migración `20261021000100_order_creation_limit.sql`: dry-run y aplicación únicamente a `kulvagylilutnpckpiuw` confirmados. No se crearon pedidos de prueba remotos para llenar el límite.
- E6 conserva evidencia real de pago automático `185404201114`: 200 del webhook, pedido pagado, un cupo y captura de confirmación. No se repitieron compras en esta etapa.
- Lint y build local aprobados. Ver el PR para comprobación de CI y despliegue del commit final.

Pendientes explícitos: sesiones reales con renovación/vencimiento y revocación tras este cambio, dos clientes reales en Vercel para aislamiento completo, concurrencia multi-conexión, preferencias inciertas, reembolso parcial/contracargo y validación visual de nuevas pantallas. No se declara seguridad absoluta ni cierre formal de pruebas exhaustivas.

## Controles manuales pendientes

Base: https://tp-pw-rugolo-e4e6-programacion-web.vercel.app (puede pedir primero acceso Vercel).

1. `/auth` → ingresar con cuenta propia → `/mi-cuenta` → recargar: debe conservar sesión. Cerrar sesión, abrir `/mi-cuenta` y `/pedidos` de nuevo: debe volver a login, sin datos privados. No repetir registro ni correo.
2. Como cliente, abrir `/admin`: debe impedir acceso. No alcanza con que falte el botón.
3. `/auth`, `/mi-cuenta`, `/experiencias/cocina` y una reserva ya pagada en `/pedidos`: recorrer Tab/Shift+Tab, foco visible, etiquetas comprensibles y ningún bloqueo. En Auth enviar vacío/email inválido: debe impedir envío. No realizar otra compra.
4. En esas pantallas, ancho móvil 375px y zoom 200%: texto/botones legibles, sin solapamientos ni pérdida de controles. La captura de reserva de escritorio no aprueba estos controles.
5. Login con red desconectada: debe finalizar carga con mensaje claro, conservar email y permitir reintento al conectar. El resultado está automatizado con errores simulados; esta prueba verifica navegador real.

No se consideran aprobados hasta recibir confirmación. El despliegue público de la rúbrica queda para autorización final.

## Contraste con clase y fuentes oficiales

Clase: AuthN antes de AuthO, RBAC, middleware, contraseñas con hash/salt, HTTPS, cookies y JWT. Se adapta el ejemplo de HttpOnly a la arquitectura SSR/cliente documentada por Supabase. JWT está firmado, no cifrado; no se agregan secretos a claims. No se implementa consulta pública de emails duplicados ni un rol Editor innecesario.

- [Supabase SSR y cookies](https://supabase.com/docs/guides/auth/server-side/advanced-guide): motivo de cookies legibles y sincronización.
- [Sesiones y revocación](https://supabase.com/docs/guides/auth/sessions): expiración del access token y alcance de logout.
- [Límites de Auth](https://supabase.com/docs/guides/auth/rate-limits): límites del proveedor, independientes de la validación visual.
- [Next.js Auth](https://nextjs.org/docs/app/guides/authentication): permisos en servidor y handlers, no solo Proxy/UI. Contrastado con código instalado Next 16.3.6.
