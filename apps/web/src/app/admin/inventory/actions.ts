"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createInventoryItem,
  createLedgerEntry,
  recordInventoryMovement,
  softDeleteInventoryItem,
  updateInventoryItem,
  type InventoryItemType,
  type InventoryLedgerEntryType,
  type InventoryMovementType,
} from "@/lib/data/inventory";

function revalidateInventory(itemId?: string) {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/items");
  revalidatePath("/admin/inventory/movements");
  revalidatePath("/admin/inventory/ledger");
  revalidatePath("/admin");
  if (itemId) revalidatePath(`/admin/inventory/items/${itemId}`);
}

export async function createItemAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    const created = await createInventoryItem({
      schoolId: profile.school_id,
      sku: String(formData.get("sku") || "").trim() || null,
      name: String(formData.get("name") || ""),
      itemType: (String(formData.get("itemType") || "SUPPLY") ||
        "SUPPLY") as InventoryItemType,
      category: String(formData.get("category") || ""),
      unit: String(formData.get("unit") || "pcs"),
      quantityOnHand: Number(formData.get("quantityOnHand") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
      unitCost: Number(formData.get("unitCost") || 0),
      location: String(formData.get("location") || "").trim() || null,
    });
    revalidateInventory(created.id);
    return { success: true, id: created.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create item.",
    };
  }
}

export async function updateItemAction(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    await updateInventoryItem({
      schoolId: profile.school_id,
      id,
      sku: String(formData.get("sku") || "").trim() || null,
      name: String(formData.get("name") || ""),
      itemType: (String(formData.get("itemType") || "SUPPLY") ||
        "SUPPLY") as InventoryItemType,
      category: String(formData.get("category") || ""),
      unit: String(formData.get("unit") || "pcs"),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
      unitCost: Number(formData.get("unitCost") || 0),
      location: String(formData.get("location") || "").trim() || null,
      isActive: formData.get("isActive") === "true",
    });
    revalidateInventory(id);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update item.",
    };
  }
}

export async function deleteItemAction(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    await softDeleteInventoryItem(profile.school_id, id);
    revalidateInventory(id);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete item.",
    };
  }
}

export async function recordMovementAction(formData: FormData) {
  const profile = await requireAdmin();
  const itemId = String(formData.get("itemId") || "");
  const postExpense = formData.get("postExpense") === "true";
  try {
    await recordInventoryMovement({
      schoolId: profile.school_id,
      recordedById: profile.id,
      itemId,
      movementType: (String(formData.get("movementType") || "PURCHASE") ||
        "PURCHASE") as InventoryMovementType,
      quantity: Number(formData.get("quantity") || 0),
      unitCost: String(formData.get("unitCost") || "").trim()
        ? Number(formData.get("unitCost"))
        : null,
      movedOn: String(formData.get("movedOn") || ""),
      note: String(formData.get("note") || "").trim() || null,
      postExpense,
    });
    revalidateInventory(itemId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not record movement.",
    };
  }
}

export async function createLedgerEntryAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await createLedgerEntry({
      schoolId: profile.school_id,
      recordedById: profile.id,
      entryType: (String(formData.get("entryType") || "EXPENSE") ||
        "EXPENSE") as InventoryLedgerEntryType,
      title: String(formData.get("title") || ""),
      amount: Number(formData.get("amount") || 0),
      entryDate: String(formData.get("entryDate") || ""),
      category: String(formData.get("category") || "").trim() || null,
      note: String(formData.get("note") || "").trim() || null,
    });
    revalidateInventory();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create ledger entry.",
    };
  }
}
