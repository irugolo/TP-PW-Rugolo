const pasos = [
  { titulo: 'Descubrí un plan.', texto: 'Algo creativo, algo rico o algo que nunca probaste. Encontrá lo que te dé curiosidad.' },
  { titulo: 'Elegí con quién compartirlo.', texto: 'Con tus amigos, en pareja o con gente por conocer. La compañía también es parte del plan.' },
  { titulo: 'Viví la experiencia.', texto: 'Hacé lugar para una pausa, una charla y una nueva anécdota para contar.' },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="como-funciona" aria-labelledby="titulo-como">
      <div className="seccion"><p className="eyebrow">Así de simple</p><h2 id="titulo-como">Salir de la rutina<br />empieza por elegir.</h2>
        <ol className="pasos">{pasos.map((paso, indice) => <li key={paso.titulo}><span className="numero" aria-hidden="true">0{indice + 1}</span><h3>{paso.titulo}</h3><p>{paso.texto}</p></li>)}</ol>
        <p className="proxima-etapa">Por ahora, explorá e inspirate. El proceso de reserva se incorporará en una próxima etapa.</p>
      </div>
    </section>
  );
}
