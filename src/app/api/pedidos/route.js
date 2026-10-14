import {z} from 'zod';
import {identity} from '../../../lib/access';
import {checkOrigin,payload,failure} from '../../../lib/http';
import {paymentConfig} from '../../../lib/mp-server';
const schema=z.object({experiencia:z.string().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),cantidad:z.number().int().min(1).max(10),clave:z.uuid()}).strict();
export async function POST(request) {
 try{
  checkOrigin(request);paymentConfig();const {db}=await identity();const input=await payload(request,schema);
  const {data,error}=await db.rpc('crear_pedido_demo',{p_experiencia:input.experiencia,p_cantidad:input.cantidad,p_clave:input.clave});
  if(error)return Response.json({error:'No se pudo crear el pedido. Revisá la cantidad y los cupos.'},{status:409});
  return Response.json({data},{status:201});
 }catch(error){return failure(error);}
}
export async function GET(){try{const {db}=await identity();const {data,error}=await db.from('pedidos_demo').select('*').order('created_at',{ascending:false}).limit(50);if(error)throw error;return Response.json({data},{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
