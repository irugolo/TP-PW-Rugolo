import { z } from 'zod';
const text = (max) => z.string().trim().min(1, 'Este campo es obligatorio.').max(max, `Máximo ${max} caracteres.`);
export const profileSchema = z.object({ nombre: text(80), telefono: z.string().trim().max(30, 'Máximo 30 caracteres.').regex(/^[+()\d\s-]*$/, 'Ingresá un teléfono válido.') }).strict();
export const experienceSchema = z.object({
 id: text(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usá minúsculas, números y guiones.'),
 nombre: text(120), categoria: text(100), descripcion: text(400), detalle: text(4000), zona: text(120), duracion: text(80),
 precio: z.number({error: 'Ingresá un precio numérico.'}).finite('Ingresá un precio finito.').min(0, 'El precio no puede ser negativo.').max(10000000, 'El precio máximo es 10000000 ARS.').multipleOf(0.01, 'Usá como máximo dos decimales.'),
 filtros: z.array(z.enum(['Con amigos', 'En pareja', 'Conocer gente'])).min(1, 'Elegí al menos una opción.').max(3, 'Elegí hasta tres opciones.').refine(v => new Set(v).size === v.length, 'No repitas opciones.'),
 imagen: z.enum(['juegos','cocina','pintura','picnic','trivia','sabores']), alt: text(240),
 incluye: z.array(text(200)).min(1, 'Ingresá al menos un elemento.').max(12, 'Ingresá hasta 12 elementos.'), estado: z.enum(['publicado','borrador'])
}).strict();
export function fieldErrors(error) { return Object.fromEntries(error.issues.map(i => [i.path[0] || '_form', i.message])); }
