# Portada y catálogo renovados — 30/10/2026

Alcance: Preview exclusivamente. Sin fusión ni cambios en producción. Se reutilizan la fuente del sistema y la paleta real de `styles.css`; no se encontró un manual de marca ni una tipografía adicional.

## Datos y reservas

Supabase sigue siendo la fuente de la aplicación. `src/data/catalogo-renovado.json` es el manifiesto editorial de la migración y de las fixtures de prueba, no un catálogo alternativo en producción. Contiene 23 IDs nuevos `plan-*`, descripciones de 100–150 palabras y campos editables de itinerario, exclusiones, recomendaciones y condiciones. Las imágenes antiguas permanecen para referencias históricas.

Migración `20261030000100_catalog_renewal.sql`: archiva las experiencias anteriores sin borrar relaciones. Inserta experiencias y cupos solo si faltan; un marcador privado de versión evita sobrescribir ediciones admin al repetirla. La prueba repite la migración después de cambiar contenido y consumir cupos. No se reinician ocupados ni se alteran importes de pedidos previos.

Preview verificada antes/después: 23 publicadas, 7 anteriores archivadas; 6 pedidos, 3 pagos, 2 perfiles y 7 filas previas de cupos conservados sin cambios. No hay calendario/turnos: el cupo es agregado por experiencia. Cine para dos exige exactamente dos personas tanto en UI como en RPC SQL; total inicial ARS 96.000. Checkout rechaza experiencias archivadas y cantidades incompatibles antes de llamar a Mercado Pago. No se modificó la conciliación ni se hicieron cobros.

Filtros: OR dentro de compañía/ambiente/momento; AND entre grupos. Sin selección no restringe. La URL conserva selecciones al abrir detalle y volver. La API acepta los mismos tres grupos; mantiene `filtro` anterior por compatibilidad. `Conocer gente` solo permanece como dato histórico editable, no como opción pública nueva.

## Recursos y procedencia

Únicamente los 23 JPEG y tres MP4 suministrados por la usuaria en Downloads. Originales intactos. El mapeo y pesos exactos de fotos están en `recursos-portada.json`; no se atribuyen autorías ni licencias desconocidas. El nombre de trekking se localizó comparando normalización Unicode NFC: el original utiliza ñ descompuesta. Destinos ASCII con prefijo `plan-`.

Fotos JPEG optimizadas con Sharp/mozjpeg calidad 78 sin ampliar originales; tarjetas 4:3 con posición por imagen y detalle que conserva el retrato completo. Alt descriptivos, dimensiones reservadas y lazy loading predeterminado de Next Image fuera de portada.

Videos originales: 720×1280, duración 10,29 / 15,07 / 13,82 segundos; pesos 1.902.003 / 4.321.333 / 2.135.133 bytes. Se inspeccionaron fotogramas: nado bajo el agua en blanco y negro, dos personas sobre una carretera costera, personas corriendo por un campo. El segundo venía rotado dentro de sus píxeles y se corrigió a horizontal en la copia. Copias H.264, 24 fps, 10 segundos, sin pista de audio, CRF 29 y faststart. No se cargan los tres clips al entrar: la siguiente fuente se incorpora al terminar el activo. Crossfade de dos capas mantiene el último fotograma mientras carga el siguiente.

Poster estático ante movimiento reducido, error o rechazo de autoplay; botón visible pausa reproducción y alternancia. IntersectionObserver y visibilitychange detienen los videos fuera de pantalla o con pestaña oculta. Las anclas solicitadas se restauran al terminar el render del catálogo; no hay scroll automático sin ancla explícita.

## Verificación

- 52 pruebas JS iniciales pasaron, incluidas migración repetida, historial, 23 planes reservables, cantidad fija, API, validaciones, RLS, firma e idempotencia y UI.
- 10 pruebas Playwright locales pasaron: filtros/retorno, acceso anónimo, Auth, Axe a 375/768/1440 px, ausencia de desborde, CLS con latencia ≤0,1, menú Escape, navegación desde detalle, movimiento reducido sin MP4, carga progresiva de los tres clips, pausa, salida de pantalla y fallback con red abortada.
- Lint y compilación Next pasaron. Verificaciones remotas/CI se completan antes de la entrega; no se infieren del resultado local.

Pendiente manual de esta versión: revisar encuadres en un teléfono real/Safari, pausar/reanudar y recorrer con VoiceOver; comprobar el aspecto editorial de las 23 propuestas. No se trasladan aprobaciones visuales anteriores a esta portada nueva. Las compras previas verificadas siguen siendo evidencia del webhook; esta renovación no implica una nueva transacción.

Pesos finales: 23 fotos = 2.391.742 bytes (~2,28 MiB); videos y poster:

```text
portada-1.mp4: 1.392.964 bytes
portada-2.mp4: 990.319 bytes
portada-3.mp4: 1.295.465 bytes
portada-poster.jpg: 46.015 bytes
```

Validación adicional ejecutada: CRUD con dos cuentas QA de Preview, rol admin temporal, edición de condiciones desde el formulario, lectura en otra sesión, borradores ocultos, revocación de rol y sesión. Cuentas y registro QA eliminados al finalizar. Axe también aplicado al formulario ampliado del admin a 375/768/1440 px. Capturas locales de portada y catálogo inspeccionadas; se ajustó el encuadre de auroras para conservar a las personas.

También se comprobó en Chromium aislado el rechazo de autoplay (poster y acciones disponibles) y el evento de pestaña oculta (todos los videos pausados). Pruebas Python: 10 aprobadas.
