import { identity } from '../../../../lib/access';
import { experienceSchema } from '../../../../lib/validation';
import { checkOrigin, payload, failure, databaseError } from '../../../../lib/http';
export async function PATCH(request, { params }) {
 try {
  checkOrigin(request); const { db } = await identity(true); const { id } = await params;
  const values = await payload(request, experienceSchema);
  if (values.id !== id) return Response.json({ error: 'El identificador no puede cambiar.' }, { status: 422 });
  const { id: stableId, ...changes } = values;
  void stableId;
  const { data, error } = await db.from('experiencias').update(changes).eq('id', id).select().maybeSingle(); databaseError(error);
  if (!data) return Response.json({ error: 'Experiencia no encontrada.' }, { status: 404 });
  return Response.json({ data });
 } catch (error) { return failure(error); }
}
export async function DELETE(request, { params }) {
 try {
  checkOrigin(request); const { db } = await identity(true); const { id } = await params;
  const { data, error } = await db.from('experiencias').delete().eq('id', id).select('id'); databaseError(error);
  if (!data.length) return Response.json({ error: 'Experiencia no encontrada.' }, { status: 404 });
  return Response.json({ data: { id } });
 } catch (error) { return failure(error); }
}
