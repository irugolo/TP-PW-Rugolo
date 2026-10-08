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
