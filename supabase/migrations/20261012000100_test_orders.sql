-- Preview only. All orders/payments in this iteration are demonstrations.
create table public.cupos_demo (
 experiencia_id text primary key references public.experiencias(id) on delete restrict,
 capacidad integer not null default 20 check (capacidad between 0 and 10000),
 ocupados integer not null default 0 check (ocupados between 0 and capacidad)
);
insert into public.cupos_demo(experiencia_id) select id from public.experiencias;
alter table public.cupos_demo enable row level security;
revoke all on public.cupos_demo from anon, authenticated;
grant select on public.cupos_demo to authenticated;
create policy cupos_read on public.cupos_demo for select to authenticated using (exists(select 1 from public.experiencias e where e.id=experiencia_id and e.estado='publicado'));

create table public.pedidos_demo (
 id uuid primary key default gen_random_uuid(),
 propietario uuid not null references auth.users(id),
 experiencia_id text not null references public.experiencias(id) on delete restrict,
 clave uuid not null,
 nombre text not null,
 descripcion text not null,
 cantidad integer not null check(cantidad between 1 and 10),
 precio numeric(14,2) not null check(precio>0),
 total numeric(16,2) generated always as (precio*cantidad) stored,
 moneda text not null default 'ARS' check(moneda='ARS'),
 estado text not null default 'pendiente' check(estado in ('pendiente','pagado','rechazado','reembolsado','revision')),
 cupos_asignados boolean not null default false,
 preferencia_id text unique,
 checkout_url text,
 preferencia_estado text not null default 'nueva' check(preferencia_estado in ('nueva','creando','lista','incierta')),
 created_at timestamptz not null default now(),
 unique(propietario,clave)
);
alter table public.pedidos_demo enable row level security;
revoke all on public.pedidos_demo from anon,authenticated;
grant select on public.pedidos_demo to authenticated;
create policy pedidos_read on public.pedidos_demo for select to authenticated using(propietario=(select auth.uid()) or (select private.is_admin()));

create table public.pagos_demo (
 id text primary key,
 pedido_id uuid not null references public.pedidos_demo(id),
 estado text not null check(estado in ('approved','pending','in_process','rejected','cancelled','refunded')),
 actualizado timestamptz not null,
 importe numeric(16,2) not null,
 moneda text not null check(moneda='ARS'),
 vendedor text not null,
 live_mode boolean not null check(live_mode=false),
 recibido timestamptz not null default now()
);
alter table public.pagos_demo enable row level security;
revoke all on public.pagos_demo from anon,authenticated;
grant select on public.pagos_demo to authenticated;
create policy pagos_read on public.pagos_demo for select to authenticated using(exists(select 1 from public.pedidos_demo p where p.id=pedido_id));

create function public.crear_pedido_demo(p_experiencia text,p_cantidad integer,p_clave uuid)
returns public.pedidos_demo language plpgsql security definer set search_path='' as $$
declare e public.experiencias; c public.cupos_demo; o public.pedidos_demo;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if p_cantidad is null or p_cantidad not between 1 and 10 or p_clave is null then raise check_violation; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_clave::text,0));
 select * into o from public.pedidos_demo where propietario=auth.uid() and clave=p_clave;
 if found then
  if o.experiencia_id<>p_experiencia or o.cantidad<>p_cantidad then raise check_violation; end if;
  return o;
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

-- Called only by server after signature and authoritative Payments API checks.
create function public.conciliar_pago_demo(p_pedido uuid,p_id text,p_estado text,p_actualizado timestamptz,p_importe numeric,p_moneda text,p_vendedor text,p_live boolean)
returns text language plpgsql security definer set search_path='' as $$
declare o public.pedidos_demo; c public.cupos_demo; old public.pagos_demo; approved boolean; refunded boolean;
begin
 select * into o from public.pedidos_demo where id=p_pedido for update;
 if not found then raise check_violation; end if;
 if p_live is distinct from false or p_moneda is distinct from 'ARS' or p_importe is distinct from o.total or p_actualizado is null then raise check_violation; end if;
 select * into old from public.pagos_demo where id=p_id;
 if found then
  if old.pedido_id<>p_pedido then raise check_violation; end if;
  if old.actualizado>=p_actualizado or old.estado='refunded' or (old.estado='approved' and p_estado<>'refunded') then return o.estado; end if;
 end if;
 insert into public.pagos_demo(id,pedido_id,estado,actualizado,importe,moneda,vendedor,live_mode)
 values(p_id,p_pedido,p_estado,p_actualizado,p_importe,p_moneda,p_vendedor,p_live)
 on conflict(id) do update set estado=excluded.estado,actualizado=excluded.actualizado,recibido=now();
 select exists(select 1 from public.pagos_demo where pedido_id=o.id and estado='approved'),exists(select 1 from public.pagos_demo where pedido_id=o.id and estado='refunded') into approved,refunded;
 select * into c from public.cupos_demo where experiencia_id=o.experiencia_id for update;
 if approved then
  if not o.cupos_asignados and c.capacidad-c.ocupados>=o.cantidad then
   update public.cupos_demo set ocupados=ocupados+o.cantidad where experiencia_id=o.experiencia_id;
   o.cupos_asignados=true;
  end if;
  o.estado=case when o.cupos_asignados and (select count(*) from public.pagos_demo where pedido_id=o.id and estado='approved')=1 then 'pagado' else 'revision' end;
 elsif refunded then
  if o.cupos_asignados then update public.cupos_demo set ocupados=ocupados-o.cantidad where experiencia_id=o.experiencia_id; end if;
  o.cupos_asignados=false; o.estado='reembolsado';
 elsif exists(select 1 from public.pagos_demo where pedido_id=o.id and estado in ('pending','in_process')) then o.estado='pendiente';
 else o.estado='rechazado'; end if;
 update public.pedidos_demo set estado=o.estado,cupos_asignados=o.cupos_asignados where id=o.id;
 return o.estado;
end $$;
revoke all on function public.conciliar_pago_demo(uuid,text,text,timestamptz,numeric,text,text,boolean) from public,anon,authenticated;
grant execute on function public.conciliar_pago_demo(uuid,text,text,timestamptz,numeric,text,text,boolean) to service_role;
grant all on public.pedidos_demo,public.pagos_demo,public.cupos_demo to service_role;
