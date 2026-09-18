import { formatearPrecio } from '../data/experiencias';

export default function TarjetaExperiencia({ experiencia, onSeleccionar }) {
  return (
    <article className="tarjeta">
      <div className="tarjeta-foto"><img src={`/images/${experiencia.imagen}.jpg`} alt={experiencia.alt} width="1000" height="700" loading="lazy" /></div>
      <div className="tarjeta-contenido">
        <p className="eyebrow">{experiencia.categoria}</p>
        <h3>{experiencia.nombre}</h3>
        <p className="descripcion">{experiencia.descripcion}</p>
        <p className="datos">{experiencia.zona}<span aria-hidden="true"> · </span>{experiencia.duracion}</p>
        <div className="tarjeta-pie">
          <p><strong>{formatearPrecio(experiencia.precio)}</strong><span className="precio-nota"> ARS / persona</span></p>
          <button className="enlace-boton" onClick={() => onSeleccionar(experiencia)} aria-label={`Ver experiencia: ${experiencia.nombre}`}>Ver experiencia <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </article>
  );
}
