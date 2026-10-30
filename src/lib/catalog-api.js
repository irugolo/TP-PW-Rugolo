import { z } from 'zod';
const group = values => z.string().refine(value => value.split(',').every(v => values.includes(v)) && new Set(value.split(',')).size === value.split(',').length).optional();
export const catalogParams = z.object({
 compania: group(['En pareja','Con amigos']), ambiente: group(['Al aire libre','Interior']), momento: group(['Día','Noche']),
 filtro: z.enum(['Con amigos','En pareja','Conocer gente']).optional(),
}).strict();
export const catalogId = z.string().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const publicExperience = item => Object.fromEntries(['id','nombre','categoria','descripcion','detalle','zona','duracion','precio','filtros','imagen','alt','incluye','itinerario','no_incluye','recomendaciones','condiciones','cantidad_fija'].map(key => [key,item[key]]));
