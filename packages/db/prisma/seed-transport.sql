-- Sample transport routes, stops, and a few student assignments.
-- Safe to re-run: skips existing route/stop names; upserts assignments.

INSERT INTO public.transport_routes (school_id, name, code, annual_fee, is_active)
SELECT s.id, v.name, v.code, v.annual_fee, true
FROM public.schools s
CROSS JOIN (
  VALUES
    ('North Corridor', 'N', 12000),
    ('South Loop', 'S', 10000),
    ('City Center', 'C', 15000)
) AS v(name, code, annual_fee)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_routes r
  WHERE r.school_id = s.id AND lower(r.name) = lower(v.name) AND r.deleted_at IS NULL
);

INSERT INTO public.transport_stops (school_id, route_id, name, sequence, pickup_time)
SELECT r.school_id, r.id, v.name, v.seq, v.ptime
FROM public.transport_routes r
JOIN (
  VALUES
    ('North Corridor', 'Green Park', 1, '07:10'),
    ('North Corridor', 'Market Square', 2, '07:25'),
    ('North Corridor', 'School Gate', 3, '07:45'),
    ('South Loop', 'Lake View', 1, '07:05'),
    ('South Loop', 'Temple Road', 2, '07:20'),
    ('South Loop', 'School Gate', 3, '07:40'),
    ('City Center', 'Railway Station', 1, '06:55'),
    ('City Center', 'Bus Stand', 2, '07:15'),
    ('City Center', 'School Gate', 3, '07:35')
) AS v(route_name, name, seq, ptime) ON v.route_name = r.name
WHERE r.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transport_stops s
    WHERE s.route_id = r.id AND lower(s.name) = lower(v.name) AND s.deleted_at IS NULL
  );

WITH pick_students AS (
  SELECT st.id AS student_id, st.school_id,
         row_number() OVER (ORDER BY st.admission_number) AS rn
  FROM public.students st
  WHERE st.status = 'ACTIVE'
  ORDER BY st.admission_number
  LIMIT 12
),
stop_picks AS (
  SELECT ts.id AS stop_id, ts.route_id, ts.school_id,
         row_number() OVER (ORDER BY tr.name, ts.sequence) AS rn
  FROM public.transport_stops ts
  JOIN public.transport_routes tr ON tr.id = ts.route_id
  WHERE ts.deleted_at IS NULL
    AND tr.name IN ('North Corridor', 'South Loop', 'City Center')
),
stop_count AS (
  SELECT count(*)::int AS n FROM stop_picks
)
INSERT INTO public.student_transport (school_id, student_id, route_id, stop_id, mode, is_active)
SELECT ps.school_id, ps.student_id, sp.route_id, sp.stop_id,
       CASE (ps.rn % 3)
         WHEN 1 THEN 'PICKUP'::public.transport_mode
         WHEN 2 THEN 'DROP'::public.transport_mode
         ELSE 'BOTH'::public.transport_mode
       END,
       true
FROM pick_students ps
CROSS JOIN stop_count sc
JOIN stop_picks sp ON sp.rn = ((ps.rn - 1) % GREATEST(sc.n, 1)) + 1
ON CONFLICT (student_id) DO UPDATE
  SET route_id = EXCLUDED.route_id,
      stop_id = EXCLUDED.stop_id,
      mode = EXCLUDED.mode,
      is_active = true,
      updated_at = now();
