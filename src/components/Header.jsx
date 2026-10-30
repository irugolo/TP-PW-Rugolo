'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
const links = [['Inicio','/'],['Experiencias','/#experiencias'],['Cómo funciona','/#como-funciona'],['Preguntas frecuentes','/#preguntas-frecuentes'],['Mi cuenta','/mi-cuenta'],['Mis pedidos','/pedidos']];
export default function Header() {
 const [open,setOpen] = useState(false); const toggle = useRef(null);
 return <header className="header" onKeyDown={e => { if(e.key==='Escape' && open){setOpen(false);toggle.current?.focus();} }}>
  <Link className="marca" href="/" aria-label="Fuera de Plan, inicio">fuera de plan<span aria-hidden="true">.</span></Link>
  <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="navegacion-principal" onClick={()=>setOpen(!open)}>{open?'Cerrar menú':'Menú'}</button>
  <nav id="navegacion-principal" className={open?'nav-abierta':''} aria-label="Navegación principal">{links.map(([label,href])=><Link key={label} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</nav>
 </header>;
}
