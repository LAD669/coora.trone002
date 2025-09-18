-- Soft Delete Implementation for Events, Posts, and Notifications
-- This migration adds deleted_at columns and updates RLS policies

-- 1. Add deleted_at columns to tables
alter table public.events add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.notifications add column if not exists deleted_at timestamptz;

-- 2. Add indexes for soft delete queries
create index if not exists idx_events_deleted_at on public.events (deleted_at) where deleted_at is null;
create index if not exists idx_posts_deleted_at on public.posts (deleted_at) where deleted_at is null;
create index if not exists idx_notifications_deleted_at on public.notifications (deleted_at) where deleted_at is null;

-- 3. Update RLS policies to exclude soft-deleted records

-- Events policies
drop policy if exists "Users can view events" on public.events;
create policy "Users can view events" on public.events
for select using (
  deleted_at is null and (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.club_id = events.club_id
    )
  )
);

drop policy if exists "Users can insert events" on public.events;
create policy "Users can insert events" on public.events
for insert with check (
  deleted_at is null and
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.club_id = events.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

drop policy if exists "Users can update events" on public.events;
create policy "Users can update events" on public.events
for update using (
  deleted_at is null and
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.club_id = events.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

-- Posts policies
drop policy if exists "Users can view posts" on public.posts;
create policy "Users can view posts" on public.posts
for select using (
  deleted_at is null and (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.club_id = posts.club_id
    )
  )
);

drop policy if exists "Users can insert posts" on public.posts;
create policy "Users can insert posts" on public.posts
for insert with check (
  deleted_at is null and
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.club_id = posts.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

drop policy if exists "Users can update posts" on public.posts;
create policy "Users can update posts" on public.posts
for update using (
  deleted_at is null and
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.club_id = posts.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

-- Notifications policies
drop policy if exists "Users can view notifications" on public.notifications;
create policy "Users can view notifications" on public.notifications
for select using (
  deleted_at is null and (
    exists (
      select 1 from public.users u
      join public.teams t on t.id = notifications.team_id
      where u.id = auth.uid()
        and u.club_id = t.club_id
    )
  )
);

drop policy if exists "Users can insert notifications" on public.notifications;
create policy "Users can insert notifications" on public.notifications
for insert with check (
  deleted_at is null and
  exists (
    select 1 from public.users u
    join public.teams t on t.id = notifications.team_id
    where u.id = auth.uid()
      and u.club_id = t.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

drop policy if exists "Users can update notifications" on public.notifications;
create policy "Users can update notifications" on public.notifications
for update using (
  deleted_at is null and
  exists (
    select 1 from public.users u
    join public.teams t on t.id = notifications.team_id
    where u.id = auth.uid()
      and u.club_id = t.club_id
      and u.role in ('admin', 'trainer', 'manager')
  )
);

-- 4. Create RPC functions for soft delete operations

-- Soft delete function
create or replace function public.soft_delete_record(
  p_table_name text,
  p_record_id uuid
)
returns boolean
language plpgsql
security invoker
as $fn$
declare
  v_club_id uuid;
  v_user_role text;
begin
  -- Get user role and club_id
  select u.role, u.club_id into v_user_role, v_club_id
  from public.users u
  where u.id = auth.uid();

  -- Check if user has permission
  if v_user_role not in ('admin', 'trainer', 'manager') then
    raise exception 'Insufficient permissions';
  end if;

  -- Perform soft delete based on table
  if p_table_name = 'events' then
    update public.events 
    set deleted_at = now()
    where id = p_record_id 
      and club_id = v_club_id
      and deleted_at is null;
    
    return found;
    
  elsif p_table_name = 'posts' then
    update public.posts 
    set deleted_at = now()
    where id = p_record_id 
      and club_id = v_club_id
      and deleted_at is null;
    
    return found;
    
  elsif p_table_name = 'notifications' then
    update public.notifications 
    set deleted_at = now()
    where id = p_record_id 
      and team_id in (
        select t.id from public.teams t
        where t.club_id = v_club_id
      )
      and deleted_at is null;
    
    return found;
    
  else
    raise exception 'Invalid table name: %', p_table_name;
  end if;
end
$fn$;

-- Restore function
create or replace function public.restore_record(
  p_table_name text,
  p_record_id uuid
)
returns boolean
language plpgsql
security invoker
as $fn$
declare
  v_club_id uuid;
  v_user_role text;
begin
  -- Get user role and club_id
  select u.role, u.club_id into v_user_role, v_club_id
  from public.users u
  where u.id = auth.uid();

  -- Check if user has permission
  if v_user_role not in ('admin', 'trainer', 'manager') then
    raise exception 'Insufficient permissions';
  end if;

  -- Perform restore based on table
  if p_table_name = 'events' then
    update public.events 
    set deleted_at = null
    where id = p_record_id 
      and club_id = v_club_id
      and deleted_at is not null;
    
    return found;
    
  elsif p_table_name = 'posts' then
    update public.posts 
    set deleted_at = null
    where id = p_record_id 
      and club_id = v_club_id
      and deleted_at is not null;
    
    return found;
    
  elsif p_table_name = 'notifications' then
    update public.notifications 
    set deleted_at = null
    where id = p_record_id 
      and team_id in (
        select t.id from public.teams t
        where t.club_id = v_club_id
      )
      and deleted_at is not null;
    
    return found;
    
  else
    raise exception 'Invalid table name: %', p_table_name;
  end if;
end
$fn$;

-- Grant permissions
grant execute on function public.soft_delete_record(text, uuid) to authenticated;
grant execute on function public.restore_record(text, uuid) to authenticated;
