-- Soft Delete Triggers: Convert Physical Deletes to Soft Deletes
-- This migration creates triggers that prevent physical deletes and convert them to soft deletes

-- 1. Create trigger function to prevent physical deletes
create or replace function public.prevent_physical_delete()
returns trigger
language plpgsql
as $fn$
begin
  -- Instead of allowing physical delete, perform soft delete
  if TG_OP = 'DELETE' then
    -- Set deleted_at timestamp
    if TG_TABLE_NAME = 'events' then
      update public.events 
      set deleted_at = now()
      where id = OLD.id;
    elsif TG_TABLE_NAME = 'posts' then
      update public.posts 
      set deleted_at = now()
      where id = OLD.id;
    elsif TG_TABLE_NAME = 'notifications' then
      update public.notifications 
      set deleted_at = now()
      where id = OLD.id;
    end if;
    
    -- Return null to prevent actual deletion
    return null;
  end if;
  
  return OLD;
end
$fn$;

-- 2. Create triggers on all three tables
drop trigger if exists trg_prevent_delete_events on public.events;
create trigger trg_prevent_delete_events
before delete on public.events
for each row execute function public.prevent_physical_delete();

drop trigger if exists trg_prevent_delete_posts on public.posts;
create trigger trg_prevent_delete_posts
before delete on public.posts
for each row execute function public.prevent_physical_delete();

drop trigger if exists trg_prevent_delete_notifications on public.notifications;
create trigger trg_prevent_delete_notifications
before delete on public.notifications
for each row execute function public.prevent_physical_delete();

-- 3. Create function to handle cascade soft deletes
-- This ensures that when a parent record is soft-deleted, related records are also soft-deleted
create or replace function public.cascade_soft_delete()
returns trigger
language plpgsql
as $fn$
begin
  -- When an event is soft-deleted, soft-delete related notifications
  if TG_TABLE_NAME = 'events' and NEW.deleted_at is not null and OLD.deleted_at is null then
    update public.notifications 
    set deleted_at = now()
    where event_id = NEW.id 
      and deleted_at is null;
  end if;
  
  -- When a team is soft-deleted, soft-delete related events and notifications
  if TG_TABLE_NAME = 'teams' and NEW.deleted_at is not null and OLD.deleted_at is null then
    update public.events 
    set deleted_at = now()
    where team_id = NEW.id 
      and deleted_at is null;
      
    update public.notifications 
    set deleted_at = now()
    where team_id = NEW.id 
      and deleted_at is null;
  end if;
  
  return NEW;
end
$fn$;

-- 4. Create cascade triggers (if teams table has deleted_at column)
-- Note: This assumes teams table might also have soft delete functionality
-- If teams table doesn't have deleted_at, these triggers will be ignored

-- Add deleted_at to teams table if it doesn't exist
alter table public.teams add column if not exists deleted_at timestamptz;

-- Create cascade trigger for teams
drop trigger if exists trg_cascade_soft_delete_teams on public.teams;
create trigger trg_cascade_soft_delete_teams
after update on public.teams
for each row execute function public.cascade_soft_delete();

-- Create cascade trigger for events
drop trigger if exists trg_cascade_soft_delete_events on public.events;
create trigger trg_cascade_soft_delete_events
after update on public.events
for each row execute function public.cascade_soft_delete();

-- 5. Create function to clean up old soft-deleted records (optional)
-- This function can be called periodically to permanently delete old soft-deleted records
create or replace function public.cleanup_old_soft_deletes(
  p_days_old int default 90
)
returns table (
  table_name text,
  deleted_count bigint
)
language plpgsql
security definer
as $fn$
declare
  v_cutoff_date timestamptz := now() - (p_days_old || ' days')::interval;
begin
  -- Clean up old events
  delete from public.events 
  where deleted_at is not null 
    and deleted_at < v_cutoff_date;
  
  return query select 'events'::text, row_count();
  
  -- Clean up old posts
  delete from public.posts 
  where deleted_at is not null 
    and deleted_at < v_cutoff_date;
  
  return query select 'posts'::text, row_count();
  
  -- Clean up old notifications
  delete from public.notifications 
  where deleted_at is not null 
    and deleted_at < v_cutoff_date;
  
  return query select 'notifications'::text, row_count();
end
$fn$;

-- Grant cleanup function to authenticated users (only admins should call this)
grant execute on function public.cleanup_old_soft_deletes(int) to authenticated;
