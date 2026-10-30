import SectionAnchor from '../components/SectionAnchor';
import Link from 'next/link';
import Hero from '../components/Hero';
import ComoFunciona from '../components/ComoFunciona';
import PreguntasFrecuentes from '../components/PreguntasFrecuentes';
import Catalogo from '../components/Catalogo';
import { catalog } from '../lib/catalog';
export const dynamic = 'force-dynamic';
export default async function Inicio() {
 let items; try { items = await catalog(); } catch { items = null; }
 return <><Hero />{items ? <Catalogo experiencias={items} home /> : <section id="experiencias" className="seccion"><h2>Experiencias</h2><p role="alert">El catálogo no está disponible. Intentá nuevamente más tarde.</p><Link href="/experiencias">Reintentar</Link></section>}<ComoFunciona /><PreguntasFrecuentes /><SectionAnchor /></>;
}
