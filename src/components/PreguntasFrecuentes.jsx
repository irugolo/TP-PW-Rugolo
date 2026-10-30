const preguntas = [
 ['¿Son experiencias reales?', 'Son propuestas ficticias de un trabajo académico. Las zonas, precios y cupos son ilustrativos; no corresponden a eventos, fechas ni proveedores reales.'],
 ['¿Cómo reservo un plan?', 'Elegí una experiencia y la cantidad de personas. Reservar plan crea un pedido pendiente; después podés continuar al checkout de prueba. La confirmación depende de la verificación del servidor.'],
 ['¿Qué cuenta uso para pagar?', 'Usá exclusivamente la cuenta compradora y los medios de pago de prueba de Mercado Pago preparados para esta demo. No ingreses una tarjeta personal.'],
 ['¿Dónde veo mi reserva?', 'En Mis pedidos, con la misma cuenta de Fuera de Plan que usaste para reservar. Allí podés consultar el estado, la cantidad y el importe.'],
 ['¿Puedo elegir una fecha?', 'Esta demostración administra cupos por experiencia, sin calendario ni turnos. No se reserva una fecha real. Cine para dos se reserva únicamente para dos personas.'],
 ['¿Qué pasa con el clima o las comidas?', 'Cada detalle explica las condiciones de la propuesta, la posible reprogramación y las consideraciones alimentarias. No se garantizan condiciones de accesibilidad ni ausencia de alérgenos.'],
];
export default function PreguntasFrecuentes(){return <section id="preguntas-frecuentes" className="seccion preguntas" aria-labelledby="titulo-preguntas"><p className="eyebrow">Antes de elegir</p><h2 id="titulo-preguntas">Unas preguntas,<br />muchos planes.</h2><div>{preguntas.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;}
