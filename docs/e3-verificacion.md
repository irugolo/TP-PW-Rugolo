# Verificación E3 · 7 de octubre de 2026

## Automatización por terminal

- `npm test`: 22 pruebas. Validación compartida, restricciones SQL/RLS en PostgreSQL aislado, Route Handlers con identidad simulada y componentes React en jsdom. Ningún navegador abierto ni controlado.
- Los handlers reales de perfil y creación/edición de experiencias rechazan vacíos, formatos incorrectos y valores fuera de rango con 422 sin consultar la base. La identidad está simulada en esta prueba; los permisos remotos se verificaron por separado.
- DOM: errores asociados a campos, foco al primer error, campos obligatorios/email y límites HTML de contraseña; desconexión, timeout simulado, respuesta no JSON y 500 conservan el perfil escrito, liberan carga y permiten reintento. Registro/login/recuperación conservan credenciales en los controles ante desconexión simulada y permiten reintentar sin enviarlas a ningún servicio.
- Eliminación fallida conserva la experiencia y permite reintentar/cancelar. Foco al encabezado de confirmación, retorno al disparador al cancelar y foco al botón Agregar después de eliminar. Acciones bloqueadas durante la eliminación.
- Cinco pruebas Python para salida JSON de CLI y errores sin exposición de secretos. Lint y compilación Next.js verificados.
- Cambios de accesibilidad: estado inválido del grupo de compañía, nombres específicos por experiencia para acciones repetidas, foco de confirmación/cancelación y foco visible en campos. Se conserva la estructura visual y funcional del sitio.

## Evidencia previa comunicada por la autora

Registro cliente y confirmación de email, recuperación y acceso con nueva contraseña, panel admin bloqueado para cliente, CRUD admin y apariencia general satisfactorios. SMTP Gmail de pruebas configurado únicamente en Preview.

La autora ejecutó `scripts/verify-interactive.py` con dos cuentas propias y compartió ambas líneas de éxito. Verificó sesiones normales, handlers en localhost, persistencia y RLS en Supabase Preview, incluida restauración/limpieza. No equivale a ejecutar la suite autenticada contra Vercel.

## Checklist manual pendiente

Usar la URL exacta de la nueva preview indicada en el PR. Ingresar en Vercel con la sesión habitual si solicita acceso. Estos controles NO están aprobados hasta recibir confirmación:

1. `/auth`: usar solamente Tab, Shift+Tab, Enter y Espacio. Recorrer opciones y campos; cada control debe mostrar foco visible, tener etiqueta y ser operable sin quedar atrapado. En Registrarme, enviar vacío, luego email `incorrecto` y una contraseña corta: no debe registrar y debe indicar el problema.
2. `/mi-cuenta` con cliente: vaciar Nombre, escribir `abc@` en Teléfono y guardar. Debe explicar errores en español y llevar el foco al primer campo incorrecto. Corregir y guardar: mensaje de éxito. No usar datos sensibles para la prueba.
3. `/admin` con admin: Agregar experiencia, guardar vacío; luego probar precio -1 y 10000001. Deben aparecer errores, sin crear el plan. En una fila, Eliminar debe enfocar la confirmación; Cancelar debe devolver el foco al botón de esa fila, sin borrar nada.
4. `/mi-cuenta`: escribir un nombre temporal sin guardar, activar Offline en las herramientas de red del navegador y guardar. Debe terminar Guardando, mostrar error y conservar el texto. Volver a Online, reintentar y restaurar el nombre original. No basta apagar Wi-Fi si otra conexión sigue activa.
5. `/auth`, `/mi-cuenta` y `/admin`: revisar a 360/768/1440 px y zoom 200 %. No debe haber campos/botones cortados, superpuestos ni desplazamiento horizontal que impida operar.
6. Con VoiceOver: recorrer un formulario, provocar un error y guardar correctamente. Debe anunciar etiquetas, error asociado y mensaje de estado. Las pruebas DOM no prueban anuncios reales ni contraste visual.

Producción no se modifica. PR apilado sobre E2, sin fusionar. Las mejoras de imágenes permanecen pospuestas.
