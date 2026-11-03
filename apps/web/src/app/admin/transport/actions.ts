"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  clearStudentTransport,
  createTransportRoute,
  createTransportStop,
  softDeleteTransportRoute,
  softDeleteTransportStop,
  updateTransportRoute,
  updateTransportStop,
  upsertStudentTransport,
  type TransportMode,
} from "@/lib/data/transport";

function revalidateTransport(studentId?: string) {
  revalidatePath("/admin/transport");
  revalidatePath("/admin/transport/routes");
  revalidatePath("/admin/transport/students");
  revalidatePath("/admin/students");
  if (studentId) {
    revalidatePath(`/admin/students/${studentId}`);
  }
}

export async function createRouteAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await createTransportRoute({
      schoolId: profile.school_id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "").trim() || null,
      annualFee: Number(formData.get("annualFee") || 0),
      isActive: formData.get("isActive") !== "false",
    });
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create route.",
    };
  }
}

export async function updateRouteAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await updateTransportRoute({
      schoolId: profile.school_id,
      id: String(formData.get("id") || ""),
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "").trim() || null,
      annualFee: Number(formData.get("annualFee") || 0),
      isActive: formData.get("isActive") === "true",
    });
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update route.",
    };
  }
}

export async function deleteRouteAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await softDeleteTransportRoute(
      profile.school_id,
      String(formData.get("id") || ""),
    );
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete route.",
    };
  }
}

export async function createStopAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await createTransportStop({
      schoolId: profile.school_id,
      routeId: String(formData.get("routeId") || ""),
      name: String(formData.get("name") || ""),
      sequence: Number(formData.get("sequence") || 0),
      pickupTime: String(formData.get("pickupTime") || "").trim() || null,
    });
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create stop.",
    };
  }
}

export async function updateStopAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await updateTransportStop({
      schoolId: profile.school_id,
      id: String(formData.get("id") || ""),
      name: String(formData.get("name") || ""),
      sequence: Number(formData.get("sequence") || 0),
      pickupTime: String(formData.get("pickupTime") || "").trim() || null,
    });
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update stop.",
    };
  }
}

export async function deleteStopAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await softDeleteTransportStop(
      profile.school_id,
      String(formData.get("id") || ""),
    );
    revalidateTransport();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete stop.",
    };
  }
}

export async function upsertStudentTransportAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  const mode = String(formData.get("mode") || "BOTH") as TransportMode;
  try {
    await upsertStudentTransport({
      schoolId: profile.school_id,
      studentId,
      routeId: String(formData.get("routeId") || ""),
      stopId: String(formData.get("stopId") || ""),
      mode,
    });
    revalidateTransport(studentId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save transport assignment.",
    };
  }
}

export async function clearStudentTransportAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  try {
    await clearStudentTransport(profile.school_id, studentId);
    revalidateTransport(studentId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not clear transport assignment.",
    };
  }
}
