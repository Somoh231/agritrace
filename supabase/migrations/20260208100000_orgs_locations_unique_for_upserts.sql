-- Seed scripts and admin flows upsert organizations by name and locations by (organization_id, name).
-- PostgreSQL ON CONFLICT requires a matching UNIQUE constraint or unique index.

create unique index if not exists organizations_name_unique on public.organizations (name);

create unique index if not exists locations_organization_id_name_unique on public.locations (organization_id, name);
