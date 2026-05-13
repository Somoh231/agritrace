-- Phase 1 operational farm boundary (approximate traceability, not cadastral survey)
alter table farmer_visits add column if not exists boundary_geometry jsonb;
alter table farmer_visits add column if not exists boundary_points jsonb;
alter table farmer_visits add column if not exists boundary_area_ha numeric(14, 6);
alter table farmer_visits add column if not exists boundary_captured_at timestamptz;

comment on column farmer_visits.boundary_geometry is 'GeoJSON Polygon geometry (operational / approximate, not legal survey).';
comment on column farmer_visits.boundary_points is 'Captured corner points with timestamps and optional GPS accuracy (m).';
comment on column farmer_visits.boundary_area_ha is 'Estimated hectares from operational polygon (Turf area).';
comment on column farmer_visits.boundary_captured_at is 'When the boundary was finalized on device.';
