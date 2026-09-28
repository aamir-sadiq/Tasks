-- AMIR TASK MANAGER - PRIVATE SYNC TABLE
create table if not exists public.amir_task_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.amir_task_sync enable row level security;

drop policy if exists "Users can view own task state" on public.amir_task_sync;
drop policy if exists "Users can insert own task state" on public.amir_task_sync;
drop policy if exists "Users can update own task state" on public.amir_task_sync;

create policy "Users can view own task state"
on public.amir_task_sync for select
using (auth.uid() = user_id);

create policy "Users can insert own task state"
on public.amir_task_sync for insert
with check (auth.uid() = user_id);

create policy "Users can update own task state"
on public.amir_task_sync for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
