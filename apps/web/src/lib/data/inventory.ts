import { createClient } from "@/lib/supabase/server";

export type InventoryItemType = "SUPPLY" | "ASSET";
export type InventoryMovementType = "PURCHASE" | "ISSUE" | "ADJUST";
export type InventoryLedgerEntryType = "INCOME" | "EXPENSE";

export type InventoryItemRecord = {
  id: string;
  sku: string | null;
  name: string;
  item_type: InventoryItemType;
  category: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  location: string | null;
  is_active: boolean;
  is_low_stock: boolean;
};

export type InventoryMovementRecord = {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string | null;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost: number | null;
  moved_on: string;
  note: string | null;
  recorded_by_name: string | null;
};

export type InventoryLedgerRecord = {
  id: string;
  entry_type: InventoryLedgerEntryType;
  title: string;
  amount: number;
  entry_date: string;
  category: string | null;
  note: string | null;
  linked_movement_id: string | null;
};

export type InventoryOverview = {
  items: number;
  supplies: number;
  assets: number;
  lowStock: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
};

export type IncomeExpenseTotals = {
  income: number;
  expense: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function monthBounds(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0);
  const end = `${y}-${String(m).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function mapItem(row: Record<string, unknown>): InventoryItemRecord {
  const qty = toNumber(row.quantity_on_hand);
  const reorder = toNumber(row.reorder_level);
  return {
    id: row.id as string,
    sku: (row.sku as string | null) ?? null,
    name: row.name as string,
    item_type: row.item_type as InventoryItemType,
    category: row.category as string,
    unit: row.unit as string,
    quantity_on_hand: qty,
    reorder_level: reorder,
    unit_cost: toNumber(row.unit_cost),
    location: (row.location as string | null) ?? null,
    is_active: Boolean(row.is_active),
    is_low_stock: qty <= reorder,
  };
}

export async function getInventoryOverview(
  schoolId: string,
): Promise<InventoryOverview> {
  const supabase = await createClient();
  const { start, end } = monthBounds();

  const [itemsRes, suppliesRes, assetsRes, itemsData, ledgerRes] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .eq("is_active", true),
      supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .eq("is_active", true)
        .eq("item_type", "SUPPLY"),
      supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .eq("is_active", true)
        .eq("item_type", "ASSET"),
      supabase
        .from("inventory_items")
        .select("quantity_on_hand, reorder_level")
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .eq("is_active", true),
      supabase
        .from("inventory_ledger_entries")
        .select("entry_type, amount")
        .eq("school_id", schoolId)
        .gte("entry_date", start)
        .lte("entry_date", end),
    ]);

  if (itemsRes.error) throw new Error(itemsRes.error.message);
  if (suppliesRes.error) throw new Error(suppliesRes.error.message);
  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (itemsData.error) throw new Error(itemsData.error.message);
  if (ledgerRes.error) throw new Error(ledgerRes.error.message);

  const lowStock = (itemsData.data ?? []).filter((row) => {
    const qty = toNumber(row.quantity_on_hand);
    const reorder = toNumber(row.reorder_level);
    return qty <= reorder;
  }).length;

  let incomeThisMonth = 0;
  let expenseThisMonth = 0;
  for (const row of ledgerRes.data ?? []) {
    if (row.entry_type === "INCOME") incomeThisMonth += row.amount || 0;
    else expenseThisMonth += row.amount || 0;
  }

  return {
    items: itemsRes.count ?? 0,
    supplies: suppliesRes.count ?? 0,
    assets: assetsRes.count ?? 0,
    lowStock,
    incomeThisMonth,
    expenseThisMonth,
  };
}

export async function getIncomeExpenseTotals(
  schoolId: string,
): Promise<IncomeExpenseTotals> {
  const supabase = await createClient();
  const { start, end } = monthBounds();
  const { data, error } = await supabase
    .from("inventory_ledger_entries")
    .select("entry_type, amount")
    .eq("school_id", schoolId)
    .gte("entry_date", start)
    .lte("entry_date", end);

  if (error) throw new Error(error.message);

  let income = 0;
  let expense = 0;
  for (const row of data ?? []) {
    if (row.entry_type === "INCOME") income += row.amount || 0;
    else expense += row.amount || 0;
  }
  return { income, expense };
}

export async function listInventoryItems(
  schoolId: string,
): Promise<InventoryItemRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id, sku, name, item_type, category, unit, quantity_on_hand,
      reorder_level, unit_cost, location, is_active
    `,
    )
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapItem(row as Record<string, unknown>));
}

export async function getInventoryItem(
  schoolId: string,
  itemId: string,
): Promise<InventoryItemRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id, sku, name, item_type, category, unit, quantity_on_hand,
      reorder_level, unit_cost, location, is_active
    `,
    )
    .eq("school_id", schoolId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapItem(data as Record<string, unknown>);
}

export async function createInventoryItem(input: {
  schoolId: string;
  sku?: string | null;
  name: string;
  itemType?: InventoryItemType;
  category: string;
  unit?: string;
  quantityOnHand?: number;
  reorderLevel?: number;
  unitCost?: number;
  location?: string | null;
  isActive?: boolean;
}): Promise<{ id: string }> {
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name) throw new Error("Item name is required.");
  if (!category) throw new Error("Category is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      school_id: input.schoolId,
      sku: input.sku?.trim() || null,
      name,
      item_type: input.itemType ?? "SUPPLY",
      category,
      unit: input.unit?.trim() || "pcs",
      quantity_on_hand: Math.max(0, input.quantityOnHand ?? 0),
      reorder_level: Math.max(0, input.reorderLevel ?? 0),
      unit_cost: Math.max(0, Math.round(input.unitCost ?? 0)),
      location: input.location?.trim() || null,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("An item with this SKU already exists.");
    }
    throw new Error(error?.message || "Could not create item.");
  }
  return data;
}

export async function updateInventoryItem(input: {
  schoolId: string;
  id: string;
  sku?: string | null;
  name: string;
  itemType?: InventoryItemType;
  category: string;
  unit?: string;
  reorderLevel?: number;
  unitCost?: number;
  location?: string | null;
  isActive?: boolean;
}): Promise<void> {
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name) throw new Error("Item name is required.");
  if (!category) throw new Error("Category is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      sku: input.sku?.trim() || null,
      name,
      item_type: input.itemType ?? "SUPPLY",
      category,
      unit: input.unit?.trim() || "pcs",
      reorder_level: Math.max(0, input.reorderLevel ?? 0),
      unit_cost: Math.max(0, Math.round(input.unitCost ?? 0)),
      location: input.location?.trim() || null,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      throw new Error("An item with this SKU already exists.");
    }
    throw new Error(error.message);
  }
}

export async function softDeleteInventoryItem(
  schoolId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      deleted_at: now,
      is_active: false,
      updated_at: now,
    })
    .eq("id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

function deltaForMovement(
  type: InventoryMovementType,
  quantity: number,
): number {
  if (type === "PURCHASE") return Math.abs(quantity);
  if (type === "ISSUE") return -Math.abs(quantity);
  return quantity; // ADJUST: signed
}

export async function recordInventoryMovement(input: {
  schoolId: string;
  recordedById: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number | null;
  movedOn: string;
  note?: string | null;
  postExpense?: boolean;
}): Promise<{ id: string }> {
  if (!input.movedOn) throw new Error("Movement date is required.");
  if (!Number.isFinite(input.quantity) || input.quantity === 0) {
    throw new Error("Quantity must be non-zero.");
  }
  if (
    (input.movementType === "PURCHASE" || input.movementType === "ISSUE") &&
    input.quantity < 0
  ) {
    throw new Error("Purchase and issue quantities must be positive.");
  }

  const item = await getInventoryItem(input.schoolId, input.itemId);
  if (!item) throw new Error("Item not found.");
  if (!item.is_active) throw new Error("Cannot move an inactive item.");

  const qtyAbs =
    input.movementType === "ADJUST"
      ? input.quantity
      : Math.abs(input.quantity);
  const delta = deltaForMovement(input.movementType, qtyAbs);
  const nextQty = item.quantity_on_hand + delta;
  if (nextQty < 0) {
    throw new Error("Insufficient stock for this issue/adjustment.");
  }

  const unitCost =
    input.unitCost == null
      ? input.movementType === "PURCHASE"
        ? item.unit_cost
        : null
      : Math.max(0, Math.round(input.unitCost));

  const supabase = await createClient();
  const { data: movement, error } = await supabase
    .from("inventory_movements")
    .insert({
      school_id: input.schoolId,
      item_id: input.itemId,
      movement_type: input.movementType,
      quantity: qtyAbs,
      unit_cost: unitCost,
      moved_on: input.movedOn,
      note: input.note?.trim() || null,
      recorded_by_id: input.recordedById,
    })
    .select("id")
    .single();

  if (error || !movement) {
    throw new Error(error?.message || "Could not record movement.");
  }

  const itemUpdate: Record<string, unknown> = {
    quantity_on_hand: nextQty,
    updated_at: new Date().toISOString(),
  };
  if (input.movementType === "PURCHASE" && unitCost != null && unitCost > 0) {
    itemUpdate.unit_cost = unitCost;
  }

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update(itemUpdate)
    .eq("id", input.itemId)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (updateError) {
    await supabase.from("inventory_movements").delete().eq("id", movement.id);
    throw new Error(updateError.message);
  }

  const shouldPostExpense =
    input.postExpense !== false &&
    input.movementType === "PURCHASE" &&
    unitCost != null &&
    unitCost > 0;

  if (shouldPostExpense) {
    const amount = Math.round(Math.abs(qtyAbs) * unitCost);
    if (amount > 0) {
      const { error: ledgerError } = await supabase
        .from("inventory_ledger_entries")
        .insert({
          school_id: input.schoolId,
          entry_type: "EXPENSE",
          title: `Purchase: ${item.name}`,
          amount,
          entry_date: input.movedOn,
          category: item.category,
          note: input.note?.trim() || null,
          linked_movement_id: movement.id,
          recorded_by_id: input.recordedById,
        });
      if (ledgerError) {
        // Movement + qty already saved; surface soft failure as thrown for visibility
        throw new Error(
          `Movement saved but expense ledger failed: ${ledgerError.message}`,
        );
      }
    }
  }

  return movement;
}

export async function listInventoryMovements(
  schoolId: string,
  itemId?: string,
): Promise<InventoryMovementRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_movements")
    .select(
      `
      id, item_id, movement_type, quantity, unit_cost, moved_on, note,
      item:inventory_items(name, sku),
      recorded_by:profiles!recorded_by_id(full_name)
    `,
    )
    .eq("school_id", schoolId)
    .order("moved_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (itemId) query = query.eq("item_id", itemId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const item = Array.isArray(row.item) ? row.item[0] : row.item;
    const recordedBy = Array.isArray(row.recorded_by)
      ? row.recorded_by[0]
      : row.recorded_by;
    return {
      id: row.id,
      item_id: row.item_id,
      item_name: item?.name ?? "",
      item_sku: item?.sku ?? null,
      movement_type: row.movement_type as InventoryMovementType,
      quantity: toNumber(row.quantity),
      unit_cost: row.unit_cost,
      moved_on: row.moved_on,
      note: row.note,
      recorded_by_name: recordedBy?.full_name ?? null,
    };
  });
}

export async function listLedgerEntries(
  schoolId: string,
): Promise<InventoryLedgerRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_ledger_entries")
    .select(
      "id, entry_type, title, amount, entry_date, category, note, linked_movement_id",
    )
    .eq("school_id", schoolId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryLedgerRecord[];
}

export async function createLedgerEntry(input: {
  schoolId: string;
  recordedById: string;
  entryType: InventoryLedgerEntryType;
  title: string;
  amount: number;
  entryDate: string;
  category?: string | null;
  note?: string | null;
}): Promise<{ id: string }> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  if (!input.entryDate) throw new Error("Date is required.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_ledger_entries")
    .insert({
      school_id: input.schoolId,
      entry_type: input.entryType,
      title,
      amount: Math.round(input.amount),
      entry_date: input.entryDate,
      category: input.category?.trim() || null,
      note: input.note?.trim() || null,
      recorded_by_id: input.recordedById,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create ledger entry.");
  }
  return data;
}
