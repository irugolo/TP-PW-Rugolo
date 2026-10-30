const pasos = [
  { titulo: 'Descubrí un plan.', texto: 'Algo creativo, algo rico o algo que nunca probaste. Encontrá lo que te dé curiosidad.' },
  { titulo: 'Seleccioná las personas.', texto: 'Revisá el precio por persona y los cupos. Cine para dos se reserva para dos personas.' },
  { titulo: 'Reservá tu plan.', texto: 'Creá el pedido y continuá al checkout de prueba. Consultá la confirmación en Mis pedidos.' },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="como-funciona" aria-labelledby="titulo-como">
      <div className="seccion"><p className="eyebrow">Así de simple</p><h2 id="titulo-como">Salir de la rutina<br />empieza por elegir.</h2>
        <ol className="pasos">{pasos.map((paso, indice) => <li key={paso.titulo}><span className="numero" aria-hidden="true">0{indice + 1}</span><h3>{paso.titulo}</h3><p>{paso.texto}</p></li>)}</ol>
        <p className="proxima-etapa">Demostración académica: utilizá únicamente la cuenta compradora y los medios de pago de prueba preparados para este proyecto.</p>
      </div>
    </section>
  );
}
