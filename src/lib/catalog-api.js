import { z } from 'zod';
export const catalogParams = z.object({
 filtro: z.enum(['Con amigos','En pareja','Conocer gente']).optional(),
}).strict();
export const catalogId = z.string().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const publicExperience = item => Object.fromEntries(['id','nombre','categoria','descripcion','detalle','zona','duracion','precio','filtros','imagen','alt','incluye'].map(key => [key,item[key]]));
