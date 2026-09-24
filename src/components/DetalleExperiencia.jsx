import Link from 'next/link';
import Image from 'next/image';
import { formatearPrecio } from '../data/experiencias';

export default function DetalleExperiencia({ experiencia }) {
  return (
    <article className="seccion detalle-pagina" aria-labelledby="titulo-detalle">
      <Link href="/experiencias" className="volver">← Volver a experiencias</Link>
      <div className="detalle-grilla">
        <Image className="detalle-foto" src={`/images/${experiencia.imagen}.jpg`} alt={experiencia.alt} width={1000} height={1000} sizes="(max-width: 768px) 90vw, 50vw" />
        <div className="detalle-contenido">
          <p className="eyebrow">Experiencia de demostración</p>
          <h1 id="titulo-detalle">{experiencia.nombre}</h1>
          <p>{experiencia.detalle}</p>
          <dl>
            <div><dt>Zona aproximada</dt><dd>{experiencia.zona}</dd></div>
            <div><dt>Duración</dt><dd>{experiencia.duracion}</dd></div>
          </dl>
          <h2>Qué incluye</h2>
          <ul>{experiencia.incluye.map(item => <li key={item}>{item}</li>)}</ul>
          <p><strong>{formatearPrecio(experiencia.precio)} ARS por persona</strong><br /><small>Precio ilustrativo, sin validez comercial.</small></p>
          <p className="aviso">Las reservas todavía no están disponibles en esta demostración. Este plan no corresponde a un evento real.</p>
        </div>
      </div>
    </article>
  );
}
