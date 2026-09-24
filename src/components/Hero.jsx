import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="titulo-inicio">
      <div className="hero-texto">
        <p className="eyebrow">Menos rutina. Más encuentros.</p>
        <h1 id="titulo-inicio">Los mejores momentos empiezan con un <span>plan distinto.</span></h1>
        <p className="hero-apoyo">Descubrí experiencias para compartir, reírte y salir de la rutina.</p>
        <Link className="boton principal" href="/experiencias">Explorar planes <span aria-hidden="true">↗</span></Link>
      </div>
      <figure className="hero-foto">
        <Image src="/images/juegos.jpg" alt="Amigos compartiendo risas y juegos alrededor de una mesa." width="1800" height="1200" preload sizes="(max-width: 600px) 100vw, 90vw" />
        <figcaption>Un buen plan empieza con buena compañía.</figcaption>
      </figure>
    </section>
  );
}
