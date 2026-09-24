'use client';

import { useState } from 'react';
import TarjetaExperiencia from './TarjetaExperiencia';

const filtros = ['Todos', 'Con amigos', 'En pareja', 'Conocer gente'];

export default function Catalogo({ experiencias }) {
  const [filtro, setFiltro] = useState('Todos');
  const visibles = experiencias.filter(experiencia => filtro === 'Todos' || experiencia.filtros.includes(filtro));

  return (
    <section id="experiencias" className="catalogo seccion" aria-labelledby="titulo-catalogo">
      <div className="seccion-cabecera">
        <div><p className="eyebrow">Un plan para cada compañía</p><h1 id="titulo-catalogo">¿Qué plan te pinta?</h1></div>
        <p>Elegí cómo compartir tu próximo<br className="solo-escritorio" /> momento fuera de la rutina.</p>
      </div>
      <div className="filtros" role="group" aria-label="Filtrar experiencias por compañía">
        {filtros.map(opcion => <button key={opcion} aria-pressed={filtro === opcion} onClick={() => setFiltro(opcion)}>{filtro === opcion && <span aria-hidden="true">✓ </span>}{opcion}</button>)}
      </div>
      <div className="catalogo-notas"><p>Experiencias ficticias · Precios ilustrativos en pesos argentinos.</p><p role="status">{visibles.length} planes para explorar</p></div>
      <div className="grilla">{visibles.map(experiencia => <TarjetaExperiencia key={experiencia.id} experiencia={experiencia} />)}</div>
    </section>
  );
}
