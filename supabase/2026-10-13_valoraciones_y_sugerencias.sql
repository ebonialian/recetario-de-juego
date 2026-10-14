-- ============================================================
-- Compinches · Valoraciones con estrellas + sugerencias de usuarios
-- Correr en Supabase > SQL Editor, todo junto, ANTES de publicar el código.
-- (Sin esto, "Lo hicimos" deja de guardar: el código nuevo manda activity_id.)
-- Se puede correr más de una vez sin romper nada.
-- ============================================================


-- ---------- 1. VALORACIONES (en user_activity_log) ----------
-- activity_id: mismo tipo que activities.id (lo detecta solo)
do $$
declare
  id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'public.activities'::regclass and a.attname = 'id';

  execute format('alter table public.user_activity_log add column if not exists activity_id %s', id_type);
end $$;

alter table public.user_activity_log
  add column if not exists stars   smallint check (stars between 1 and 5),
  add column if not exists comment text     check (char_length(comment) <= 280);

create index if not exists user_activity_log_activity_idx on public.user_activity_log (activity_id);

-- Cada persona puede completar (estrellas + comentario) solo sus propias filas
drop policy if exists "log: editar las propias" on public.user_activity_log;
create policy "log: editar las propias"
  on public.user_activity_log for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leer las propias (la app pide el id de la fila recién guardada)
drop policy if exists "log: leer las propias" on public.user_activity_log;
create policy "log: leer las propias"
  on public.user_activity_log for select to authenticated
  using (auth.uid() = user_id);

-- Promedio por actividad (para ordenar la base y detectar las flojas)
create or replace view public.activity_rating_stats as
  select activity_id,
         round(avg(stars)::numeric, 1)                  as avg_stars,
         count(stars)::int                               as ratings_count,
         count(*) filter (where rating = 'up')::int      as hicimos,
         count(*) filter (where rating = 'down')::int    as no_engancho
  from public.user_activity_log
  where activity_id is not null
  group by activity_id;


-- ---------- 2. SUGERENCIAS (en activities, como 'pending') ----------
alter table public.activities
  add column if not exists suggested_by uuid references auth.users(id) on delete set null;


-- ---------- 3. HISTORIAL ----------
-- Dos funciones que usa /historial. Cada persona ve SOLO lo suyo (auth.uid()),
-- y las valoraciones que reciben sus sugerencias llegan sin datos de quién las dejó.

-- Lo que hizo: cada fila del log + la actividad completa (pasos, materiales…)
create or replace function public.my_history()
returns setof jsonb
language sql stable security definer
set search_path = public
as $$
  select to_jsonb(l) || jsonb_build_object('activity', to_jsonb(a))
  from public.user_activity_log l
  left join lateral (
    select x.*
    from public.activities x
    where x.id = l.activity_id
       or (l.activity_id is null and x.title = l.activity_title)  -- filas viejas, sin activity_id
    order by (x.id = l.activity_id) desc nulls last
    limit 1
  ) a on true
  where l.user_id = auth.uid()
$$;

-- Lo que sugirió: cada sugerencia + valoraciones recibidas + comentarios (anónimos)
create or replace function public.my_suggestions()
returns setof jsonb
language sql stable security definer
set search_path = public
as $$
  select to_jsonb(a) || jsonb_build_object(
    'stats', (
      select jsonb_build_object(
        'avg_stars',     round(avg(l.stars)::numeric, 1),
        'ratings_count', count(l.stars),
        'hicimos',       count(*) filter (where l.rating = 'up'),
        'no_engancho',   count(*) filter (where l.rating = 'down')
      )
      from public.user_activity_log l
      where l.activity_id = a.id
    ),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object('stars', l.stars, 'rating', l.rating, 'comment', l.comment))
      from public.user_activity_log l
      where l.activity_id = a.id and l.comment is not null
    ), '[]'::jsonb)
  )
  from public.activities a
  where a.suggested_by = auth.uid()
$$;

revoke all on function public.my_history()     from public, anon;
revoke all on function public.my_suggestions() from public, anon;
grant execute on function public.my_history()     to authenticated;
grant execute on function public.my_suggestions() to authenticated;


-- ============================================================
-- CONSULTAS PARA MODERAR (guardalas en Snippets, no correr ahora)
-- ============================================================

-- Sugerencias de usuarios pendientes:
-- select id, title, for_what, steps, materials_list, created_at
-- from public.activities
-- where source = 'user_suggested' and status = 'pending';

-- Aprobar una (pasa a mostrarse en la app):
-- update public.activities set status = 'approved' where id = '...';

-- Rechazar una:
-- update public.activities set status = 'rejected' where id = '...';

-- Peor valoradas (mínimo 3 valoraciones):
-- select a.title, s.*
-- from public.activity_rating_stats s join public.activities a on a.id = s.activity_id
-- where s.ratings_count >= 3 order by s.avg_stars asc limit 20;

-- Comentarios recientes:
-- select activity_title, rating, stars, comment, created_at
-- from public.user_activity_log where comment is not null
-- order by created_at desc limit 50;
