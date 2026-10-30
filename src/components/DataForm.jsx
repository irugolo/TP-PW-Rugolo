 'use client';
import { imageKeys } from '../lib/catalog-images';
import { filterGroups } from '../lib/catalog-filters';
import { useRef, useState } from 'react';
import { experienceSchema, profileSchema, fieldErrors } from '../lib/validation';
const labels = { id: 'Identificador URL', nombre: 'Nombre', telefono: 'Teléfono (opcional)', categoria: 'Bajada de categoría', descripcion: 'Descripción breve', detalle: 'Detalle', zona: 'Zona', duracion: 'Duración', precio: 'Precio en ARS', filtros: 'Categorías', imagen: 'Imagen', alt: 'Descripción de la imagen', incluye: 'Qué incluye (un elemento por línea)', itinerario:'Itinerario (un momento por línea)', no_incluye:'Qué no incluye (un elemento por línea)', recomendaciones:'Recomendaciones', condiciones:'Condiciones de participación', cantidad_fija:'Cantidad fija (0 permite de 1 a 10)', estado: 'Estado' };
const limits = { id:60, nombre:120, telefono:30, categoria:100, descripcion:400, detalle:4000, zona:120, duracion:80, alt:240, incluye:2411, itinerario:803, no_incluye:2411, recomendaciones:1000, condiciones:1000 };
const options = { imagen: imageKeys, estado:['borrador','publicado'] };
export const emptyExperience = { id:'',nombre:'',categoria:'',descripcion:'',detalle:'',zona:'',duracion:'',precio:0,filtros:[],imagen:'juegos',alt:'',incluye:[],itinerario:[],no_incluye:[],recomendaciones:'',condiciones:'',cantidad_fija:0,estado:'borrador' };
export default function DataForm({ initial, profile = false, onSaved }) {
 const keys = profile ? ['nombre','telefono'] : Object.keys(emptyExperience);
 const [values, setValues] = useState(() => Object.fromEntries(keys.map(k => [k, ['incluye','itinerario','no_incluye'].includes(k) ? (initial[k] || []).join('\n') : initial[k] ?? emptyExperience[k]])));
 const [errors, setErrors] = useState({}); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 const lock = useRef(false); const form = useRef(null);
 function fail(fields, text) { setErrors(fields); setMessage(text); requestAnimationFrame(() => { const first = Object.keys(fields)[0]; const control = form.current?.elements.namedItem(first); (control?.focus ? control : control?.[0] || form.current?.querySelector('[role="status"]'))?.focus(); }); }
 async function submit(event) {
  event.preventDefault(); if (lock.current) return;
  const input = profile ? values : { ...values, precio: values.precio === '' ? null : Number(values.precio), cantidad_fija:Number(values.cantidad_fija), ...Object.fromEntries(['incluye','itinerario','no_incluye'].map(k=>[k,values[k].split('\n').map(s=>s.trim()).filter(Boolean)])) };
  const parsed = (profile ? profileSchema : experienceSchema).safeParse(input);
  if (!parsed.success) { fail(fieldErrors(parsed.error), 'Revisá los campos indicados.'); return; }
  lock.current = true; setBusy(true); setMessage('Guardando…'); setErrors({});
  try {
   const response = await fetch(profile ? '/api/perfil' : `/api/experiencias${initial.id ? '/' + encodeURIComponent(initial.id) : ''}`, { method: profile || initial.id ? 'PATCH' : 'POST', headers: { 'Content-Type':'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify(parsed.data) });
   const result = await response.json();
   if (!response.ok) { fail(result.fields || {}, result.error || 'No se pudo guardar.'); return; }
   setValues(Object.fromEntries(keys.map(k => [k, ['incluye','itinerario','no_incluye'].includes(k) ? (result.data[k] || []).join('\n') : result.data[k] ?? emptyExperience[k]])));
   setMessage('Cambios guardados.'); onSaved?.(result.data);
  } catch { fail({}, 'Error de red. Conservamos tus datos; intentá nuevamente.'); }
  finally { lock.current = false; setBusy(false); }
 }
 return <form ref={form} onSubmit={submit} noValidate className="data-form" aria-busy={busy}>
  {keys.map(key => <div key={key} className="form-field">
   {key === 'filtros' ? <fieldset aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`}><legend>{labels[key]}</legend>{filterGroups.map(group=><div key={group.key}><p>{group.label}</p>{group.options.map(option => <label key={option}><input type="checkbox" name={key} checked={values.filtros.includes(option)} onChange={e => setValues({...values, filtros:e.target.checked ? [...values.filtros, option] : values.filtros.filter(v => v !== option)})} /> {option}</label>)}</div>)}{values.filtros.includes('Conocer gente') && <label><input type="checkbox" name={key} checked onChange={()=>setValues({...values,filtros:values.filtros.filter(v=>v!=='Conocer gente')})}/> Conocer gente (categoría histórica)</label>}</fieldset> : <>
   <label htmlFor={key}>{labels[key]}</label>
   {options[key] ? <select id={key} name={key} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`} value={values[key]} onChange={e => setValues({...values,[key]:e.target.value})}>{options[key].map(v => <option key={v}>{v}</option>)}</select> : ['detalle','descripcion','incluye','itinerario','no_incluye','recomendaciones','condiciones'].includes(key) ? <textarea id={key} name={key} required maxLength={limits[key]} value={values[key]} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`} onChange={e => setValues({...values,[key]:e.target.value})} /> : <input id={key} name={key} type={['precio','cantidad_fija'].includes(key) ? 'number' : key === 'telefono' ? 'tel' : 'text'} min={['precio','cantidad_fija'].includes(key) ? 0 : undefined} max={key === 'precio' ? 10000000 : key==='cantidad_fija'?10:undefined} step={key === 'precio' ? '.01' : undefined} maxLength={profile && key === 'nombre' ? 80 : limits[key]} required={key !== 'telefono'} readOnly={key === 'id' && Boolean(initial.id)} value={values[key]} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`} onChange={e => setValues({...values,[key]:e.target.value})} />}
   </>}
   <span id={`${key}-error`} className="field-error">{errors[key]}</span>
  </div>)}
  <p role="status" tabIndex={-1}>{message}</p><button disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
 </form>;
}
