export default function Hero() {
  return (
    <section className="hero" aria-labelledby="titulo-inicio">
      <div className="hero-texto">
        <p className="eyebrow">Menos rutina. Más encuentros.</p>
        <h1 id="titulo-inicio">Los mejores momentos empiezan con un <span>plan distinto.</span></h1>
        <p className="hero-apoyo">Descubrí experiencias para compartir, reírte y salir de la rutina.</p>
        <a className="boton principal" href="#experiencias">Explorar planes <span aria-hidden="true">↗</span></a>
      </div>
      <figure className="hero-foto">
        <img src="/images/juegos.jpg" alt="Amigos compartiendo risas y juegos alrededor de una mesa." width="1800" height="1200" fetchPriority="high" />
        <figcaption>Un buen plan empieza con buena compañía.</figcaption>
      </figure>
    </section>
  );
}
