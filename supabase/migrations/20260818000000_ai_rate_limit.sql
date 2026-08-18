create table if not exists public.ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.ai_rate_limits enable row level security;
alter table public.ai_rate_limits force row level security;

drop policy if exists "ai_rate_limits_select_own" on public.ai_rate_limits;
create policy "ai_rate_limits_select_own" on public.ai_rate_limits for select using (auth.uid() = user_id);

-- No insert/update/delete policies for regular users: rows are only mutated
-- through the security-definer function below, which runs as the table owner.

create or replace function public.check_ai_rate_limit(
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_request_count integer;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.ai_rate_limits (user_id, window_start, request_count)
  values (v_user_id, v_now, 1)
  on conflict (user_id) do update
    set request_count = case
          when public.ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
            then 1
          else public.ai_rate_limits.request_count + 1
        end,
        window_start = case
          when public.ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
            then v_now
          else public.ai_rate_limits.window_start
        end
  returning public.ai_rate_limits.window_start, public.ai_rate_limits.request_count
  into v_window_start, v_request_count;

  if v_request_count > p_max_requests then
    return query select
      false,
      greatest(0, p_window_seconds - extract(epoch from (v_now - v_window_start))::integer);
  else
    return query select true, 0;
  end if;
end;
$$;

grant execute on function public.check_ai_rate_limit(integer, integer) to authenticated;
