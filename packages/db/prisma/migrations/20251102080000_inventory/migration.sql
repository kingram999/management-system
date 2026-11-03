CREATE TYPE public.inventory_item_type AS ENUM ('SUPPLY', 'ASSET');
CREATE TYPE public.inventory_movement_type AS ENUM ('PURCHASE', 'ISSUE', 'ADJUST');
CREATE TYPE public.inventory_ledger_entry_type AS ENUM ('INCOME', 'EXPENSE');

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  item_type public.inventory_item_type NOT NULL DEFAULT 'SUPPLY',
  category text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  quantity_on_hand numeric(12, 2) NOT NULL DEFAULT 0,
  reorder_level numeric(12, 2) NOT NULL DEFAULT 0,
  unit_cost integer NOT NULL DEFAULT 0,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_items_school_type_idx ON public.inventory_items(school_id, item_type);
CREATE INDEX inventory_items_school_active_idx ON public.inventory_items(school_id, is_active);
CREATE UNIQUE INDEX inventory_items_active_sku_uniq
  ON public.inventory_items(school_id, lower(sku))
  WHERE deleted_at IS NULL AND sku IS NOT NULL;

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  movement_type public.inventory_movement_type NOT NULL,
  quantity numeric(12, 2) NOT NULL,
  unit_cost integer,
  moved_on date NOT NULL,
  note text,
  recorded_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_movements_school_date_idx ON public.inventory_movements(school_id, moved_on);
CREATE INDEX inventory_movements_school_item_idx ON public.inventory_movements(school_id, item_id);

CREATE TABLE public.inventory_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  entry_type public.inventory_ledger_entry_type NOT NULL,
  title text NOT NULL,
  amount integer NOT NULL,
  entry_date date NOT NULL,
  category text,
  note text,
  linked_movement_id uuid UNIQUE REFERENCES public.inventory_movements(id) ON DELETE SET NULL,
  recorded_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_ledger_entries_school_date_idx
  ON public.inventory_ledger_entries(school_id, entry_date);
CREATE INDEX inventory_ledger_entries_school_type_idx
  ON public.inventory_ledger_entries(school_id, entry_type);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_select ON public.inventory_items
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY inventory_items_write ON public.inventory_items
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY inventory_movements_select ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY inventory_movements_write ON public.inventory_movements
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY inventory_ledger_entries_select ON public.inventory_ledger_entries
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY inventory_ledger_entries_write ON public.inventory_ledger_entries
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());
