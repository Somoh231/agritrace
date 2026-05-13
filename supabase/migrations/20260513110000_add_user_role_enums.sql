-- user_role enum additions for operational hierarchy (MoA Liberia).
-- MUST run in a separate migration before any functions/policies cast to these labels
-- (PostgreSQL: new enum values are unsafe to use in the same transaction they are created).

do $$ begin
  alter type user_role add value 'clan_technician';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'dao_officer';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'county_agriculture_coordinator';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'ministry_admin';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'donor_observer';
exception when duplicate_object then null; end $$;
