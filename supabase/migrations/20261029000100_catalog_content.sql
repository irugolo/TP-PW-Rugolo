-- Add one curated local image without removing existing choices or history.
alter table public.experiencias drop constraint experiencias_imagen_check;
alter table public.experiencias add constraint experiencias_imagen_check
 check (imagen in ('juegos','cocina','pintura','picnic','trivia','sabores','ceramica'));

-- Correct only the exact provisional content observed in the demo catalogue.
-- No overwrite if the author edited it meanwhile; no price/order/capacity change.
update public.experiencias
set detalle='Una propuesta de demostración para explorar el modelado en cerámica y compartir una degustación de vinos. Un encuentro creativo para disfrutar del proceso y de la compañía; no representa un taller ni una fecha reales.',
    imagen='ceramica',
    alt='Manos trabajando una pieza de cerámica sobre un torno.'
where id='ceramica-y-vino' and detalle='detalle' and imagen='pintura' and alt='pinturas';
