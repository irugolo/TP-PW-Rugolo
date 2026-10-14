import TestCheckout from '../../../components/TestCheckout';
import { notFound } from 'next/navigation';
import DetalleExperiencia from '../../../components/DetalleExperiencia';
import { catalog } from '../../../lib/catalog';
export const dynamic = 'force-dynamic';
export default async function ExperienciaPage({ params }) {
 const { slug } = await params;
 let items;
 try { items = await catalog(slug); } catch { return <section className="seccion"><h1>Experiencia</h1><p role="alert">No se pudo cargar la experiencia. Intentá más tarde.</p></section>; }
 if (!items[0]) notFound();
 return <><DetalleExperiencia experiencia={items[0]} />{process.env.MP_TEST_MODE === 'true' && <section className="seccion"><TestCheckout experience={{id:items[0].id,precio:items[0].precio}} /></section>}</>;
}
