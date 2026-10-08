import { identity } from '../../../lib/access';
import { profileSchema } from '../../../lib/validation';
import { checkOrigin, payload, failure, databaseError } from '../../../lib/http';
export async function PATCH(request) {
 try {
  checkOrigin(request); const { db, user } = await identity(); const values = await payload(request, profileSchema);
  const { data, error } = await db.from('perfiles').update(values).eq('id', user.id).select().single(); databaseError(error);
  return Response.json({ data });
 } catch (error) { return failure(error); }
}
