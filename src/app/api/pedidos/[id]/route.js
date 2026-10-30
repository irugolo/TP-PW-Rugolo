import {z} from 'zod';
import {identity} from '../../../../lib/access';
import {failure} from '../../../../lib/http';
export async function GET(request,{params}){
 try{const {id}=await params;if(!z.uuid().safeParse(id).success)return Response.json({error:'Pedido inválido.'},{status:400});
 const {db}=await identity();const {data,error}=await db.from('pedidos_demo').select('*').eq('id',id).maybeSingle();if(error)throw error;if(!data)return Response.json({error:'Pedido no encontrado.'},{status:404});return Response.json({data},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error);}
}
