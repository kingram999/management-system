-- Sample inventory items, movements, and ledger entries.
-- Safe to re-run: skips existing SKUs / seed notes.

INSERT INTO public.inventory_items (
  school_id, sku, name, item_type, category, unit, quantity_on_hand,
  reorder_level, unit_cost, location, is_active
)
SELECT s.id, v.sku, v.name, v.item_type::public.inventory_item_type, v.category, v.unit,
       v.qty, v.reorder, v.cost, v.location, true
FROM public.schools s
CROSS JOIN (
  VALUES
    ('STN-001', 'A4 Paper Ream', 'SUPPLY', 'Stationery', 'ream', 25, 10, 280, 'Store room'),
    ('STN-002', 'Blue Ball Pens', 'SUPPLY', 'Stationery', 'box', 8, 5, 120, 'Store room'),
    ('STN-003', 'Chalk Box', 'SUPPLY', 'Classroom', 'box', 15, 8, 60, 'Store room'),
    ('CLN-001', 'Floor Cleaner', 'SUPPLY', 'Cleaning', 'ltr', 12, 6, 90, 'Utility'),
    ('CLN-002', 'Hand Wash', 'SUPPLY', 'Cleaning', 'bottle', 4, 6, 75, 'Utility'),
    ('LAB-001', 'Test Tubes', 'SUPPLY', 'Lab', 'set', 20, 5, 350, 'Science lab'),
    ('AST-001', 'Desktop Computer', 'ASSET', 'IT', 'pcs', 12, 2, 28000, 'Computer lab'),
    ('AST-002', 'Projector', 'ASSET', 'AV', 'pcs', 3, 1, 22000, 'AV room'),
    ('AST-003', 'Steel Almirah', 'ASSET', 'Furniture', 'pcs', 6, 1, 8500, 'Office'),
    ('AST-004', 'Printer', 'ASSET', 'IT', 'pcs', 2, 1, 12000, 'Admin office')
) AS v(sku, name, item_type, category, unit, qty, reorder, cost, location)
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_items i
  WHERE i.school_id = s.id AND i.sku = v.sku AND i.deleted_at IS NULL
);

WITH admin AS (
  SELECT id AS profile_id, school_id FROM public.profiles WHERE role = 'ADMIN' LIMIT 1
),
items AS (
  SELECT i.*
  FROM public.inventory_items i
  JOIN admin a ON a.school_id = i.school_id
  WHERE i.deleted_at IS NULL AND i.sku IN ('STN-001', 'STN-002', 'CLN-001', 'AST-001')
),
ins_movements AS (
  INSERT INTO public.inventory_movements (
    school_id, item_id, movement_type, quantity, unit_cost, moved_on, note, recorded_by_id
  )
  SELECT i.school_id, i.id,
         CASE i.sku
           WHEN 'STN-002' THEN 'ISSUE'::public.inventory_movement_type
           ELSE 'PURCHASE'::public.inventory_movement_type
         END,
         CASE i.sku WHEN 'STN-002' THEN 2 ELSE 5 END,
         i.unit_cost,
         current_date,
         'Seed movement',
         a.profile_id
  FROM items i
  CROSS JOIN admin a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory_movements m
    WHERE m.item_id = i.id AND m.note = 'Seed movement'
  )
  RETURNING id, school_id, item_id, movement_type, quantity, unit_cost, moved_on, recorded_by_id
)
INSERT INTO public.inventory_ledger_entries (
  school_id, entry_type, title, amount, entry_date, category, note, linked_movement_id, recorded_by_id
)
SELECT m.school_id, 'EXPENSE', 'Purchase: ' || i.name,
       ROUND(m.quantity * COALESCE(m.unit_cost, 0))::int,
       m.moved_on, i.category, 'Seed purchase expense', m.id, m.recorded_by_id
FROM ins_movements m
JOIN public.inventory_items i ON i.id = m.item_id
WHERE m.movement_type = 'PURCHASE'
  AND ROUND(m.quantity * COALESCE(m.unit_cost, 0)) > 0;

INSERT INTO public.inventory_ledger_entries (
  school_id, entry_type, title, amount, entry_date, category, note, recorded_by_id
)
SELECT s.id, v.entry_type::public.inventory_ledger_entry_type, v.title, v.amount,
       current_date, v.category, v.note, p.id
FROM public.schools s
JOIN public.profiles p ON p.school_id = s.id AND p.role = 'ADMIN'
CROSS JOIN (
  VALUES
    ('INCOME', 'Hall rental', 5000, 'Facilities', 'Seed income'),
    ('INCOME', 'Book fair proceeds', 3200, 'Events', 'Seed income'),
    ('EXPENSE', 'Electricity bill', 8500, 'Utilities', 'Seed expense')
) AS v(entry_type, title, amount, category, note)
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_ledger_entries e
  WHERE e.school_id = s.id AND e.note = v.note AND e.title = v.title
);
