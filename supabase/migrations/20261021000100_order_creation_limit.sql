-- Persistent per-user limit, including direct authenticated RPC calls.
-- Existing idempotent retries are returned before applying the limit.
create index pedidos_demo_owner_created on public.pedidos_demo(propietario,created_at);
create or replace function public.crear_pedido_demo(p_experiencia text,p_cantidad integer,p_clave uuid)
returns public.pedidos_demo language plpgsql security definer set search_path='' as $$
declare e public.experiencias; c public.cupos_demo; o public.pedidos_demo;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if p_cantidad is null or p_cantidad not between 1 and 10 or p_clave is null then raise check_violation; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into o from public.pedidos_demo where propietario=auth.uid() and clave=p_clave;
 if found then
  if o.experiencia_id<>p_experiencia or o.cantidad<>p_cantidad then raise check_violation; end if;
  return o;
 end if;
 if (select count(*) from public.pedidos_demo where propietario=auth.uid() and created_at > now()-interval '10 minutes') >= 10 then
  raise sqlstate 'PT429' using message='Demasiados pedidos. Esperá unos minutos.';
 end if;
 select * into e from public.experiencias where id=p_experiencia and estado='publicado' for share;
 if not found or e.precio<=0 then raise check_violation; end if;
 select * into c from public.cupos_demo where experiencia_id=e.id for update;
 if not found or c.capacidad-c.ocupados<p_cantidad then raise exception 'Sin cupos' using errcode='P0001'; end if;
 insert into public.pedidos_demo(propietario,experiencia_id,clave,nombre,descripcion,cantidad,precio)
 values(auth.uid(),e.id,p_clave,e.nombre,e.descripcion,p_cantidad,e.precio) returning * into o;
 return o;
end $$;
revoke all on function public.crear_pedido_demo(text,integer,uuid) from public,anon;
grant execute on function public.crear_pedido_demo(text,integer,uuid) to authenticated;

