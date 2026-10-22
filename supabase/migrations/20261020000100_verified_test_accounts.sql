-- Preview only. Preserve the provider flag; only the verified demo pair can use live_mode=true.
alter table public.pagos_demo add column comprador text;
alter table public.pagos_demo add column cuentas_test_verificadas boolean not null default false;
alter table public.pagos_demo drop constraint pagos_demo_live_mode_check;
alter table public.pagos_demo add constraint pagos_demo_test_environment_check check (
 live_mode=false or (cuentas_test_verificadas and vendedor='3762598376' and comprador is not distinct from '3762598386')
);
drop function public.conciliar_pago_demo(uuid,text,text,timestamptz,numeric,text,text,boolean);
create function public.conciliar_pago_demo(p_pedido uuid,p_id text,p_estado text,p_actualizado timestamptz,p_importe numeric,p_moneda text,p_vendedor text,p_live boolean,p_comprador text default null,p_cuentas_test boolean default false)
returns text language plpgsql security definer set search_path='' as $$
declare o public.pedidos_demo; c public.cupos_demo; old public.pagos_demo; approved boolean; refunded boolean;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id,1));
 select * into o from public.pedidos_demo where id=p_pedido for update;
 if not found then raise check_violation; end if;
 if p_live is null or (p_live and not (p_cuentas_test is true and p_vendedor='3762598376' and p_comprador is not distinct from '3762598386')) or p_moneda is distinct from 'ARS' or p_importe is distinct from o.total or p_actualizado is null then raise check_violation; end if;
 select * into old from public.pagos_demo where id=p_id;
 if found then
  if old.pedido_id<>p_pedido then raise check_violation; end if;
  if old.actualizado>=p_actualizado or old.estado='refunded' or (old.estado='approved' and p_estado<>'refunded') then return o.estado; end if;
 end if;
 insert into public.pagos_demo(id,pedido_id,estado,actualizado,importe,moneda,vendedor,live_mode,comprador,cuentas_test_verificadas)
 values(p_id,p_pedido,p_estado,p_actualizado,p_importe,p_moneda,p_vendedor,p_live,p_comprador,p_cuentas_test)
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

revoke all on function public.conciliar_pago_demo(uuid,text,text,timestamptz,numeric,text,text,boolean,text,boolean) from public,anon,authenticated;
grant execute on function public.conciliar_pago_demo(uuid,text,text,timestamptz,numeric,text,text,boolean,text,boolean) to service_role;
