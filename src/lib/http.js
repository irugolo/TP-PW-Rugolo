import { fieldErrors } from './validation.js';
export function checkOrigin(request) {
 const expected = process.env.APP_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
 if (request.headers.get('origin') !== expected) throw Object.assign(new Error('Origen no autorizado.'), { status: 403 });
 if (!request.headers.get('content-type')?.split(';')[0].trim().toLowerCase().match(/^application\/json$/)) throw Object.assign(new Error('Se requiere JSON.'), { status: 415 });
}
export async function payload(request, schema) {
 const reader = request.body?.getReader(); const chunks = []; let size = 0;
 if (reader) try {
  while (true) {
   const {done, value} = await reader.read(); if (done) break;
   size += value.byteLength;
   if (size > 20000) { await reader.cancel(); throw Object.assign(new Error('Formulario demasiado grande.'), {status:413}); }
   chunks.push(value);
  }
 } finally { reader.releaseLock(); }
 const bytes = new Uint8Array(size); let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
 const raw = new TextDecoder().decode(bytes);
 let value; try { value = JSON.parse(raw); } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
 const parsed = schema.safeParse(value);
 if (!parsed.success) throw Object.assign(new Error('Revisá los campos indicados.'), { status: 422, fields: fieldErrors(parsed.error) });
 return parsed.data;
}
export function failure(error) {
 const correlation=crypto.randomUUID(), status=error.status || 500;
 // No error.message, stack, request body or identity in operational logs.
 console.info(JSON.stringify({component:'api',correlation,status}));
 return Response.json({error:error.status ? error.message : 'No se pudo completar la operación. Intentá nuevamente.',fields:error.fields},{status,headers:{'Cache-Control':'private, no-store','x-correlation-id':correlation}});
}
export function databaseError(error) {
 if (!error) return;
 const messages = { '23505': 'Ya existe una experiencia con ese identificador.', '23503': 'Hay datos relacionados. No se puede eliminar.', '42501': 'No tenés permiso para esta operación.' };
 throw Object.assign(new Error(messages[error.code] || 'No se pudo guardar.'), { status: error.code === '42501' ? 403 : messages[error.code] ? 409 : 500 });
}
