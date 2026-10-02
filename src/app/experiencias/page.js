import Catalogo from '../../components/Catalogo';
import { catalog } from '../../lib/catalog';
export const metadata = { title: 'Experiencias' };
export const dynamic = 'force-dynamic';
export default async function ExperienciasPage() {
 let items;
 try { items = await catalog(); }
 catch { return <section className="seccion"><h1>Experiencias</h1><p role="alert">El catálogo no está disponible. Intentá nuevamente más tarde.</p></section>; }
 return <Catalogo experiencias={items} />;
}
