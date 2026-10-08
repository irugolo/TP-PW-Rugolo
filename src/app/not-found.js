import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <section className="seccion no-encontrado" aria-labelledby="titulo-404">
      <p className="eyebrow">Error 404</p>
      <h1 id="titulo-404">Este plan no está por acá.</h1>
      <p>La página o experiencia que buscás no existe. Podés volver al catálogo y descubrir otro plan.</p>
      <Link href="/experiencias" className="boton principal">Explorar experiencias <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
