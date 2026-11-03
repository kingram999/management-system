"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getFeePaymentReceipt,
  recordFeePayment,
  type FeePaymentMethod,
} from "@/lib/data/fees";

function revalidateFees(studentId?: string) {
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/dues");
  revalidatePath("/admin/fees/collect");
  revalidatePath("/admin/students");
  if (studentId) {
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath(`/admin/fees/collect?studentId=${studentId}`);
  }
}

export async function getFeeReceiptAction(paymentId: string) {
  const profile = await requireAdmin();
  if (!paymentId) return { error: "Receipt not found." };

  try {
    const receipt = await getFeePaymentReceipt(profile.school_id, paymentId);
    if (!receipt) return { error: "Receipt not found." };
    return { success: true, receipt };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not load receipt.",
    };
  }
}

export async function recordFeePaymentAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("method") || "") as FeePaymentMethod;
  const paidAtRaw = String(formData.get("paidAt") || "");
  const note = String(formData.get("note") || "").trim() || null;

  if (!studentId) return { error: "Select a student." };
  if (!paidAtRaw) return { error: "Payment date is required." };

  const paidAt = new Date(paidAtRaw);
  if (Number.isNaN(paidAt.getTime())) {
    return { error: "Invalid payment date." };
  }

  try {
    const result = await recordFeePayment({
      schoolId: profile.school_id,
      recordedById: profile.id,
      studentId,
      amount,
      method,
      paidAt: paidAt.toISOString(),
      note,
    });
    revalidateFees(studentId);
    return {
      success: true,
      paymentId: result.id,
      receiptNumber: result.receiptNumber,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not record payment.",
    };
  }
}
