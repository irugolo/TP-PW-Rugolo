-- Review remote schema before applying. Intentionally fails on conflicting objects.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;

create table public.perfiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nombre text not null default '' check (char_length(nombre) <= 80),
 telefono text not null default '' check (char_length(telefono) <= 30 and telefono ~ '^[+()0-9[:space:]-]*$'),
 rol text not null default 'cliente' check (rol in ('cliente','admin')),
 created_at timestamptz not null default now()
);
alter table public.perfiles enable row level security;

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.perfiles where id = (select auth.uid()) and rol = 'admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.perfiles(id, rol) values(new.id, 'cliente');
 return new;
end;
$$;
revoke all on function private.create_profile() from public;
create trigger create_user_profile after insert on auth.users for each row execute function private.create_profile();
insert into public.perfiles(id) select id from auth.users on conflict(id) do nothing;

revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update(nombre, telefono) on public.perfiles to authenticated;
create policy profile_read on public.perfiles for select to authenticated using (id = (select auth.uid()));
create policy profile_update on public.perfiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create table public.experiencias (
 id text primary key check (char_length(id) between 1 and 60 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
 categoria text not null check (char_length(btrim(categoria)) between 1 and 100),
 descripcion text not null check (char_length(btrim(descripcion)) between 1 and 400),
 detalle text not null check (char_length(btrim(detalle)) between 1 and 4000),
 zona text not null check (char_length(btrim(zona)) between 1 and 120),
 duracion text not null check (char_length(btrim(duracion)) between 1 and 80),
 precio numeric not null check (precio between 0 and 10000000 and precio = round(precio,2)),
 filtros text[] not null check (cardinality(filtros) between 1 and 3 and filtros <@ array['Con amigos','En pareja','Conocer gente']::text[] and array_position(filtros,null) is null),
 imagen text not null check (imagen in ('juegos','cocina','pintura','picnic','trivia','sabores')),
 alt text not null check (char_length(btrim(alt)) between 1 and 240),
 incluye text[] not null check (cardinality(incluye) between 1 and 12 and array_position(incluye,null) is null),
 estado text not null default 'borrador' check (estado in ('publicado','borrador')),
 created_at timestamptz not null default now()
);
create function private.validate_experience() returns trigger language plpgsql set search_path = '' as $$
begin
 if exists(select 1 from unnest(new.incluye) x where char_length(btrim(x)) not between 1 and 200)
 or (select count(distinct x) from unnest(new.filtros) x) <> cardinality(new.filtros) then
  raise check_violation using message = 'Invalid experience arrays';
 end if;
 if TG_OP = 'UPDATE' and new.id <> old.id then raise check_violation using message = 'Immutable experience ID'; end if;
 return new;
end;
$$;
revoke all on function private.validate_experience() from public;
create trigger validate_experience before insert or update on public.experiencias for each row execute function private.validate_experience();
alter table public.experiencias enable row level security;
revoke all on public.experiencias from anon, authenticated;
grant select on public.experiencias to anon, authenticated;
grant insert(id,nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,estado), update(nombre,categoria,descripcion,detalle,zona,duracion,precio,filtros,imagen,alt,incluye,estado), delete on public.experiencias to authenticated;
create policy experience_read on public.experiencias for select to anon, authenticated using (estado = 'publicado' or (select private.is_admin()));
create policy experience_insert on public.experiencias for insert to authenticated with check ((select private.is_admin()));
create policy experience_update on public.experiencias for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy experience_delete on public.experiencias for delete to authenticated using ((select private.is_admin()));

-- Aggregate only: administrators cannot download other people's profiles.
create function public.admin_metrics() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not private.is_admin() then raise insufficient_privilege; end if;
 return jsonb_build_object(
 'total', (select count(*) from public.experiencias),
 'publicadas', (select count(*) from public.experiencias where estado = 'publicado'),
 'borradores', (select count(*) from public.experiencias where estado = 'borrador'),
 'clientes', (select count(*) from public.perfiles where rol = 'cliente'));
end;
$$;
revoke all on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;
