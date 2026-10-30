import { readFilters, matchesFilters } from '../../../lib/catalog-filters';
import { catalog } from '../../../lib/catalog';
import { catalogParams, publicExperience } from '../../../lib/catalog-api';
import { identity } from '../../../lib/access';
import { experienceSchema } from '../../../lib/validation';
import { checkOrigin, payload, failure, databaseError } from '../../../lib/http';
export async function POST(request) {
 try {
  checkOrigin(request); const { db } = await identity(true); const values = await payload(request, experienceSchema);
  const { data, error } = await db.from('experiencias').insert(values).select().single(); databaseError(error);
  return Response.json({ data }, { status: 201 });
 } catch (error) { return failure(error); }
}

export async function GET(request) {
 try {
  const params = new URL(request.url).searchParams;
  const parsed = catalogParams.safeParse(Object.fromEntries(params));
  if (!parsed.success || [...params.keys()].some(key => params.getAll(key).length > 1)) return Response.json({error:'Parámetros de catálogo inválidos.'},{status:400});
  const items = await catalog();
  const data = items.filter(item => item.estado === 'publicado' && matchesFilters(item, readFilters(params)) && (!parsed.data.filtro || item.filtros.includes(parsed.data.filtro))).map(publicExperience);
  return Response.json({data},{headers:{'Cache-Control':'no-store'}});
 } catch (error) { return failure(error); }
}
