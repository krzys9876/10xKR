-- 20250410000000_create_auth_user_trigger.sql
--
-- purpose: automatically insert a new record into public.users when a user is created in auth.users
-- affected tables: auth.users, public.users
-- description: this migration creates a trigger function that listens for new signup events on the auth.users table.
-- it then inserts a corresponding record into public.users using the same UUID as the primary key.
-- ensure that the public.users table has columns: id (uuid primary key), email, created_at, updated_at.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- insert a new row into the custom users table with the user's id and email from auth.users,
  -- and set the created_at and updated_at timestamps to the current time.
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;  -- if the user already exists, do nothing
  return new;
end;
$$ language plpgsql security definer;

-- create a trigger on the auth.users table that fires after a new user is inserted
create trigger trigger_insert_user
after insert on auth.users
for each row execute procedure public.handle_new_user();