 'use client';
import { useRef, useState } from 'react';
import DataForm, { emptyExperience } from './DataForm';
import DetalleExperiencia from './DetalleExperiencia';
export default function AdminPanel({initial,metrics}) {
 const [items,setItems] = useState(initial); const [selected,setSelected] = useState(null); const [detail,setDetail] = useState(null); const [confirm,setConfirm] = useState(null); const [busy,setBusy] = useState(false); const [message,setMessage] = useState(''); const heading = useRef(null); const lock = useRef(false); const confirmation = useRef(null); const trigger = useRef(null); const addButton = useRef(null);
 function edit(item) {setSelected(item);setDetail(null);setConfirm(null);requestAnimationFrame(() => heading.current?.focus());}
 async function remove() {
  if (lock.current) return;lock.current=true;setBusy(true);setMessage('Eliminando…');
  try {const response = await fetch(`/api/experiencias/${encodeURIComponent(confirm.id)}`,{method:'DELETE',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'}});const result = await response.json();if(!response.ok) {setMessage(result.error);return;}setItems(items.filter(i => i.id !== confirm.id));setConfirm(null);setMessage('Experiencia eliminada.');requestAnimationFrame(() => addButton.current?.focus());}
  catch {setMessage('Error de red. No pudimos confirmar la eliminación.');}finally {lock.current=false;setBusy(false);}
 }
 return <section className="seccion admin"><h1>Administración</h1><dl className="metricas">{Object.entries({Total:items.length,Publicadas:items.filter(i => i.estado === 'publicado').length,Borradores:items.filter(i => i.estado === 'borrador').length,Clientes:metrics.clientes}).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
 <button ref={addButton} disabled={busy} onClick={() => edit(emptyExperience)}>Agregar experiencia</button><p role="status">{message}</p>
 {items.length === 0 && <p>Todavía no hay experiencias.</p>}
 <ul className="admin-list">{items.map(item => <li key={item.id}><div><strong>{item.nombre}</strong><p>{item.estado === 'publicado' ? 'Publicada' : 'Borrador'}</p></div><div className="acciones"><button disabled={busy} aria-label={`Ver detalle de ${item.nombre}`} onClick={() => {setDetail(item);setSelected(null);}}>Ver detalle</button><button disabled={busy} aria-label={`Editar / publicar ${item.nombre}`} onClick={() => edit(item)}>Editar / publicar</button><button disabled={busy} aria-label={`Eliminar ${item.nombre}`} onClick={event => {trigger.current=event.currentTarget;setConfirm(item);setSelected(null);requestAnimationFrame(() => confirmation.current?.focus());}}>Eliminar</button></div></li>)}</ul>
 {confirm && <section className="aviso" aria-label="Confirmar eliminación"><h2 ref={confirmation} tabIndex={-1}>¿Eliminar {confirm.nombre}?</h2><p>Esta acción es permanente. Si existen relaciones que lo impiden, se conservará la experiencia.</p><button disabled={busy} onClick={remove}>Confirmar eliminación</button> <button disabled={busy} onClick={() => {setConfirm(null);requestAnimationFrame(() => trigger.current?.focus());}}>Cancelar</button></section>}
 {detail && <DetalleExperiencia experiencia={detail} />}
 {selected && <section><h2 ref={heading} tabIndex={-1}>{selected.id ? 'Editar experiencia' : 'Nueva experiencia'}</h2><p>Elegí Publicado o Borrador en el campo Estado y guardá para cambiar su visibilidad.</p><DataForm key={selected.id || 'new'} initial={selected} onSaved={saved => {setItems(current => current.some(i => i.id === saved.id) ? current.map(i => i.id === saved.id ? saved : i) : [...current,saved]);setSelected(saved);setMessage('Experiencia guardada. Catálogo actualizado.');}} /></section>}
 </section>;
}
