import { useEffect, useRef } from 'react';
import { formatearPrecio } from '../data/experiencias';

export default function DetalleExperiencia({ experiencia, onCerrar }) {
  const dialogo = useRef(null);

  // El diálogo nativo mantiene el foco dentro del modal y permite usar Escape.
  useEffect(() => {
    const origen = document.activeElement;
    const elemento = dialogo.current;
    elemento.showModal();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      elemento.close();
      document.body.style.overflow = overflowAnterior;
      origen?.focus();
    };
  }, []);

  return (
    <dialog ref={dialogo} className="detalle" aria-labelledby="titulo-detalle" onCancel={onCerrar}>
      <button className="cerrar" onClick={onCerrar} autoFocus aria-label="Cerrar detalle">Cerrar <span aria-hidden="true">×</span></button>
      <img className="detalle-foto" src={`/images/${experiencia.imagen}.jpg`} alt={experiencia.alt} />
      <div className="detalle-contenido">
        <p className="eyebrow">Experiencia de demostración</p>
        <h2 id="titulo-detalle">{experiencia.nombre}</h2>
        <p>{experiencia.detalle}</p>
        <dl><div><dt>Zona aproximada</dt><dd>{experiencia.zona}</dd></div><div><dt>Duración</dt><dd>{experiencia.duracion}</dd></div></dl>
        <h3>Qué incluye</h3>
        <ul>{experiencia.incluye.map(item => <li key={item}>{item}</li>)}</ul>
        <p><strong>{formatearPrecio(experiencia.precio)} ARS por persona</strong><br /><small>Precio ilustrativo, sin validez comercial.</small></p>
        <p className="aviso">Las reservas todavía no están disponibles en esta demostración. Este plan no corresponde a un evento real.</p>
      </div>
    </dialog>
  );
}
