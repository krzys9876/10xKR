-- -----------------------------------------------------------------------------
-- Migration: 20240410000001_initial_schema.sql
-- Purpose: Create initial database schema for the Goal Assessment System
-- This migration sets up tables for users, assessment processes, goals, 
-- assessments and their relationships
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------

-- Process statuses enum
create type assessment_process_status as enum (
  'in_definition',
  'awaiting_self_assessment',
  'in_self_assessment',
  'awaiting_manager_assessment',
  'completed'
);

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

-- Users table - stores employee and manager information
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text null,
  last_name text null,
  manager_id uuid references public.users(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  -- Each employee can have only one manager (self-referential relationship)
  constraint valid_manager_relationship check (manager_id != id) -- Cannot be own manager
);

-- Enable RLS for the users table
alter table public.users enable row level security;

-- Assessment processes - representing evaluation cycles
create table public.assessment_processes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status assessment_process_status not null default 'in_definition',
  is_active boolean not null default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint valid_date_range check (end_date >= start_date)
);

-- Enable RLS for assessment processes
alter table public.assessment_processes enable row level security;

-- Goal categories - implemented as a table rather than simple strings
create table public.goal_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS for goal categories
alter table public.goal_categories enable row level security;

-- Goals - individual objectives assigned to employees
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  assessment_process_id uuid not null references public.assessment_processes(id) on delete cascade,
  category_id uuid references public.goal_categories(id),
  title text not null,
  description text,
  weight integer not null, -- Percentage weight (1-100), validation at app level
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint valid_weight check (weight > 0 and weight <= 100),
  constraint unique_goal_per_process_user unique (user_id, assessment_process_id, title)
);

-- Enable RLS for goals
alter table public.goals enable row level security;

-- Self-assessments - employee evaluations of their goals
create table public.self_assessments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  rating integer not null, -- Rating scale (1-5)
  comments text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint valid_rating check (rating >= 1 and rating <= 5),
  constraint unique_self_assessment_per_goal unique (goal_id)
);

-- Enable RLS for self-assessments
alter table public.self_assessments enable row level security;

-- Manager assessments - final evaluations by managers
create table public.manager_assessments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  rating integer not null, -- Rating scale (1-5)
  comments text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint valid_rating check (rating >= 1 and rating <= 5),
  constraint unique_manager_assessment_per_goal unique (goal_id)
);

-- Enable RLS for manager assessments
alter table public.manager_assessments enable row level security;

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

-- Indexes for improved query performance
create index idx_users_manager_id on public.users(manager_id);
create index idx_goals_user_id on public.goals(user_id);
create index idx_goals_assessment_process_id on public.goals(assessment_process_id);
create index idx_goals_category_id on public.goals(category_id);
create index idx_self_assessments_goal_id on public.self_assessments(goal_id);
create index idx_manager_assessments_goal_id on public.manager_assessments(goal_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- Users table policies
-- Select: Employees can view their own profile and their manager's profile
create policy "Users can view own profile" 
on public.users for select 
to authenticated 
using (id = auth.uid() or id in (select manager_id from public.users where id = auth.uid()));

-- Select: Managers can view their subordinates' profiles
create policy "Managers can view subordinates' profiles" 
on public.users for select 
to authenticated 
using (id in (select id from public.users where manager_id = auth.uid()));

-- Insert: Only authenticated users can create profiles
create policy "Authenticated users can create profiles" 
on public.users for insert 
to authenticated 
with check (true);

-- Update: Users can update their own profile
create policy "Users can update own profile" 
on public.users for update 
to authenticated 
using (id = auth.uid()) 
with check (id = auth.uid());

-- Delete: Disable deletion of user profiles
create policy "Disable user profile deletion" 
on public.users for delete 
to authenticated 
using (false);

-- Assessment processes policies
-- Select: All authenticated users can view assessment processes
create policy "Authenticated users can view assessment processes" 
on public.assessment_processes for select 
to authenticated 
using (true);

-- Insert: Only authenticated users can create assessment processes
create policy "Authenticated users can create assessment processes" 
on public.assessment_processes for insert 
to authenticated 
with check (true);

-- Update: Only authenticated users can update assessment processes
create policy "Authenticated users can update assessment processes" 
on public.assessment_processes for update 
to authenticated 
using (true) 
with check (true);

-- Delete: Only authenticated users can delete assessment processes
create policy "Authenticated users can delete assessment processes" 
on public.assessment_processes for delete 
to authenticated 
using (true);

-- Goal categories policies
-- Select: All authenticated users can view goal categories
create policy "Authenticated users can view goal categories" 
on public.goal_categories for select 
to authenticated 
using (true);

-- Insert: Only authenticated users can create goal categories
create policy "Authenticated users can create goal categories" 
on public.goal_categories for insert 
to authenticated 
with check (true);

-- Update: Only authenticated users can update goal categories
create policy "Authenticated users can update goal categories" 
on public.goal_categories for update 
to authenticated 
using (true) 
with check (true);

-- Delete: Only authenticated users can delete goal categories
create policy "Authenticated users can delete goal categories" 
on public.goal_categories for delete 
to authenticated 
using (true);

-- Goals policies
-- Select: Employees can view their own goals
create policy "Employees can view own goals" 
on public.goals for select 
to authenticated 
using (user_id = auth.uid());

-- Select: Managers can view their subordinates' goals
create policy "Managers can view subordinates' goals" 
on public.goals for select 
to authenticated 
using (user_id in (select id from public.users where manager_id = auth.uid()));

-- Insert: Managers can create goals for their subordinates
create policy "Managers can create goals for subordinates" 
on public.goals for insert 
to authenticated 
with check (user_id in (select id from public.users where manager_id = auth.uid()));

-- Update: Managers can update goals for their subordinates
create policy "Managers can update goals for subordinates" 
on public.goals for update 
to authenticated 
using (user_id in (select id from public.users where manager_id = auth.uid())) 
with check (user_id in (select id from public.users where manager_id = auth.uid()));

-- Delete: Managers can delete goals for their subordinates
create policy "Managers can delete goals for subordinates" 
on public.goals for delete 
to authenticated 
using (user_id in (select id from public.users where manager_id = auth.uid()));

-- Self-assessments policies
-- Select: Employees can view their own self-assessments
create policy "Employees can view own self-assessments" 
on public.self_assessments for select 
to authenticated 
using (goal_id in (select id from public.goals where user_id = auth.uid()));

-- Select: Managers can view their subordinates' self-assessments
create policy "Managers can view subordinates' self-assessments" 
on public.self_assessments for select 
to authenticated 
using (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid())));

-- Insert: Employees can create self-assessments for their own goals
create policy "Employees can create own self-assessments" 
on public.self_assessments for insert 
to authenticated 
with check (goal_id in (select id from public.goals where user_id = auth.uid()));

-- Update: Employees can update their own self-assessments
create policy "Employees can update own self-assessments" 
on public.self_assessments for update 
to authenticated 
using (goal_id in (select id from public.goals where user_id = auth.uid())) 
with check (goal_id in (select id from public.goals where user_id = auth.uid()));

-- Delete: Employees can delete their own self-assessments
create policy "Employees can delete own self-assessments" 
on public.self_assessments for delete 
to authenticated 
using (goal_id in (select id from public.goals where user_id = auth.uid()));

-- Manager assessments policies
-- Select: Employees can view manager assessments for their own goals
create policy "Employees can view manager assessments for own goals" 
on public.manager_assessments for select 
to authenticated 
using (goal_id in (select id from public.goals where user_id = auth.uid()));

-- Select: Managers can view manager assessments they created
create policy "Managers can view manager assessments they created" 
on public.manager_assessments for select 
to authenticated 
using (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid())));

-- Insert: Managers can create assessments for their subordinates' goals
create policy "Managers can create assessments for subordinates' goals" 
on public.manager_assessments for insert 
to authenticated 
with check (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid())));

-- Update: Managers can update assessments for their subordinates' goals
create policy "Managers can update assessments for subordinates' goals" 
on public.manager_assessments for update 
to authenticated 
using (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid()))) 
with check (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid())));

-- Delete: Managers can delete assessments for their subordinates' goals
create policy "Managers can delete assessments for subordinates' goals" 
on public.manager_assessments for delete 
to authenticated 
using (goal_id in (select id from public.goals where user_id in (select id from public.users where manager_id = auth.uid())));

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------

-- Create a function to update the updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for all tables to update the updated_at timestamp
create trigger set_updated_at_users
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_updated_at_assessment_processes
before update on public.assessment_processes
for each row execute function public.set_updated_at();

create trigger set_updated_at_goal_categories
before update on public.goal_categories
for each row execute function public.set_updated_at();

create trigger set_updated_at_goals
before update on public.goals
for each row execute function public.set_updated_at();

create trigger set_updated_at_self_assessments
before update on public.self_assessments
for each row execute function public.set_updated_at();

create trigger set_updated_at_manager_assessments
before update on public.manager_assessments
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- DEFAULT DATA
-- -----------------------------------------------------------------------------

-- Insert default goal categories
insert into public.goal_categories (name, description) values
  ('Performance', 'Goals related to job performance and efficiency'),
  ('Development', 'Goals related to personal and professional growth'),
  ('Innovation', 'Goals related to new ideas and improvements'),
  ('Teamwork', 'Goals related to collaboration and team success'),
  ('Leadership', 'Goals related to leadership skills and mentoring'); 