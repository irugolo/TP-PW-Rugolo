import { readFilters, filterQuery } from '../../../lib/catalog-filters';
import {testCheckoutReady} from '../../../lib/mp-server';
import TestCheckout from '../../../components/TestCheckout';
import { notFound } from 'next/navigation';
import DetalleExperiencia from '../../../components/DetalleExperiencia';
import { catalog } from '../../../lib/catalog';
export const dynamic = 'force-dynamic';
export default async function ExperienciaPage({ params, searchParams }) {
 const search = await searchParams; const query = filterQuery(readFilters(new URLSearchParams(search)));
 const backHref = `${search.origen === 'inicio' ? '/' : '/experiencias'}${query ? '?' + query : ''}#experiencias`;
 const { slug } = await params;
 let items;
 try { items = await catalog(slug); } catch { return <section className="seccion"><h1>Experiencia</h1><p role="alert">No se pudo cargar la experiencia. Intentá más tarde.</p></section>; }
 if (!items[0]) notFound();
 const demo=process.env.MP_TEST_MODE === 'true';
 const ready=demo && await testCheckoutReady();
 return <DetalleExperiencia experiencia={items[0]} backHref={backHref}>{demo && <TestCheckout ready={ready} experience={{id:items[0].id,precio:items[0].precio,cantidad_fija:items[0].cantidad_fija}} />}</DetalleExperiencia>;
}
