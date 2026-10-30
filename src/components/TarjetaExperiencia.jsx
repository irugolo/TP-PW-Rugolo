import { imagePositions } from '../lib/catalog-images';
import Link from 'next/link';
import Image from 'next/image';
import { formatearPrecio } from '../data/experiencias';

export default function TarjetaExperiencia({ experiencia, query = '' }) {
  return (
    <article className="tarjeta">
      <div className="tarjeta-foto"><Image style={{objectPosition:imagePositions[experiencia.imagen]}} src={`/images/${experiencia.imagen}.jpg`} alt={experiencia.alt} width="1000" height="700" sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw" /></div>
      <div className="tarjeta-contenido">
        <p className="eyebrow">{experiencia.categoria}</p>
        <h3>{experiencia.nombre}</h3>
        <p className="descripcion">{experiencia.descripcion}</p>
        <p className="datos">{experiencia.zona}<span aria-hidden="true"> · </span>{experiencia.duracion}</p>
        <div className="tarjeta-pie">
          <p><strong>{formatearPrecio(experiencia.precio)}</strong><span className="precio-nota"> ARS / persona</span></p>
          <Link className="enlace-boton" href={`/experiencias/${experiencia.id}${query ? '?'+query : ''}`} aria-label={`Ver experiencia: ${experiencia.nombre}`}>Ver experiencia <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}
