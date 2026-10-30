import Link from 'next/link';
import Image from 'next/image';
import { formatearPrecio } from '../data/experiencias';

export default function DetalleExperiencia({ experiencia, children, backHref = '/experiencias' }) {
  return (
    <article className="seccion detalle-pagina" aria-labelledby="titulo-detalle">
      <Link href={backHref} className="volver">← Volver a experiencias</Link>
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
          {children}
          {experiencia.itinerario?.length > 0 && <><h2>Así transcurre el plan</h2><ol className="itinerario">{experiencia.itinerario.map(item=><li key={item}>{item}</li>)}</ol></>}
          <h2>Qué incluye</h2>
          <ul>{experiencia.incluye.map(item => <li key={item}>{item}</li>)}</ul>
          {!children && <p><strong>{formatearPrecio(experiencia.precio)} ARS por persona</strong><br /><small>Precio ilustrativo, sin validez comercial.</small></p>}
          {experiencia.no_incluye?.length > 0 && <><h2>Qué no incluye</h2><ul>{experiencia.no_incluye.map(item=><li key={item}>{item}</li>)}</ul></>}
          {experiencia.recomendaciones && <><h2>Antes de venir</h2><p>{experiencia.recomendaciones}</p></>}
          {experiencia.condiciones && <><h2>Tené en cuenta</h2><p>{experiencia.condiciones}</p></>}
          <p className="aviso">Experiencia de demostración. Este plan no corresponde a un evento real.</p>
        </div>
      </div>
    </article>
  );
}
