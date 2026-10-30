'use client';
import { useSearchParams } from 'next/navigation';
import TarjetaExperiencia from './TarjetaExperiencia';
import { filterGroups, readFilters, matchesFilters, filterQuery } from '../lib/catalog-filters';
export default function Catalogo({ experiencias, home=false }) {
 const params=useSearchParams(), selected=readFilters(params);
 const visibles=experiencias.filter(item=>matchesFilters(item,selected));
 const Heading=home?'h2':'h1';
 function update(filters){const query=filterQuery(filters);window.history.replaceState(null,'',`${home?'/':'/experiencias'}${query?'?'+query:''}#experiencias`);}
 const query=filterQuery(selected);
 return <section id="experiencias" className="catalogo seccion" aria-labelledby="titulo-catalogo">
  <div className="seccion-cabecera"><div><p className="eyebrow">Para compartir a tu manera</p><Heading id="titulo-catalogo">¿Qué plan te pinta?</Heading></div><p>Un poco de curiosidad.<br />Un plan fuera de lo habitual.</p></div>
  <div className="filtros-grupos">{filterGroups.map(group=><fieldset key={group.key}><legend>{group.label}</legend><div>{group.options.map(option=><label key={option} className={selected[group.key].includes(option)?'seleccionado':''}><input type="checkbox" checked={selected[group.key].includes(option)} onChange={e=>update({...selected,[group.key]:e.target.checked?[...selected[group.key],option]:selected[group.key].filter(v=>v!==option)})}/>{option}</label>)}</div></fieldset>)}<button className="limpiar-filtros" disabled={!query} onClick={()=>update({})}>Limpiar filtros</button></div>
  <div className="catalogo-notas"><p>Experiencias ficticias · Precios ilustrativos en ARS por persona.</p><p role="status">{visibles.length} planes para explorar</p></div>
  {visibles.length===0 && <div className="catalogo-vacio"><h3>No encontramos planes con esa combinación.</h3><p>Probá quitar una opción o limpiar los filtros.</p></div>}
  <div className="grilla">{visibles.map(item=><TarjetaExperiencia key={item.id} experiencia={item} query={`${query}${query?'&':''}origen=${home?'inicio':'catalogo'}`} />)}</div>
 </section>;
}
