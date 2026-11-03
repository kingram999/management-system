"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  activateEmployeeLogin,
  createEmployee,
  createEmployeeLogin,
  deactivateEmployeeLogin,
  recordSalaryPayment,
  saveEmployeeAttendance,
  softDeleteEmployee,
  updateEmployee,
  type AttendanceStatus,
  type EmployeeCategory,
  type EmployeeStatus,
} from "@/lib/data/employees";

function revalidateEmployees(employeeId?: string) {
  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/directory");
  revalidatePath("/admin/employees/attendance");
  revalidatePath("/admin/employees/payroll");
  revalidatePath("/admin");
  if (employeeId) {
    revalidatePath(`/admin/employees/${employeeId}`);
  }
}

export async function createEmployeeAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    const created = await createEmployee({
      schoolId: profile.school_id,
      employeeCode: String(formData.get("employeeCode") || "").trim() || null,
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      gender: String(formData.get("gender") || "").trim() || null,
      dateOfBirth: String(formData.get("dateOfBirth") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      category: (String(formData.get("category") || "STAFF") ||
        "STAFF") as EmployeeCategory,
      designation: String(formData.get("designation") || ""),
      department: String(formData.get("department") || "").trim() || null,
      joinedOn: String(formData.get("joinedOn") || "").trim() || null,
      status: (String(formData.get("status") || "ACTIVE") ||
        "ACTIVE") as EmployeeStatus,
      monthlySalary: Number(formData.get("monthlySalary") || 0),
    });
    revalidateEmployees(created.id);
    return { success: true, id: created.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create employee.",
    };
  }
}

export async function updateEmployeeAction(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    await updateEmployee({
      schoolId: profile.school_id,
      id,
      employeeCode: String(formData.get("employeeCode") || "").trim() || null,
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      gender: String(formData.get("gender") || "").trim() || null,
      dateOfBirth: String(formData.get("dateOfBirth") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      category: (String(formData.get("category") || "STAFF") ||
        "STAFF") as EmployeeCategory,
      designation: String(formData.get("designation") || ""),
      department: String(formData.get("department") || "").trim() || null,
      joinedOn: String(formData.get("joinedOn") || "").trim() || null,
      status: (String(formData.get("status") || "ACTIVE") ||
        "ACTIVE") as EmployeeStatus,
      monthlySalary: Number(formData.get("monthlySalary") || 0),
    });
    revalidateEmployees(id);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update employee.",
    };
  }
}

export async function deleteEmployeeAction(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    await softDeleteEmployee(profile.school_id, id);
    revalidateEmployees(id);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not delete employee.",
    };
  }
}

export async function saveEmployeeAttendanceAction(input: {
  date: string;
  marks: Array<{ employeeId: string; status: AttendanceStatus }>;
}) {
  const profile = await requireAdmin();
  try {
    await saveEmployeeAttendance({
      schoolId: profile.school_id,
      markedById: profile.id,
      date: input.date,
      marks: input.marks,
    });
    revalidateEmployees();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save staff attendance.",
    };
  }
}

export async function recordSalaryPaymentAction(formData: FormData) {
  const profile = await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  try {
    await recordSalaryPayment({
      schoolId: profile.school_id,
      recordedById: profile.id,
      employeeId,
      amount: Number(formData.get("amount") || 0),
      paidOn: String(formData.get("paidOn") || ""),
      periodLabel: String(formData.get("periodLabel") || "").trim() || null,
      method: String(formData.get("method") || "").trim() || null,
      note: String(formData.get("note") || "").trim() || null,
    });
    revalidateEmployees(employeeId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not record salary payment.",
    };
  }
}

export async function createEmployeeLoginAction(formData: FormData) {
  const profile = await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  try {
    await createEmployeeLogin({
      schoolId: profile.school_id,
      employeeId,
      temporaryPassword: String(formData.get("temporaryPassword") || ""),
    });
    revalidateEmployees(employeeId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create employee login.",
    };
  }
}

export async function deactivateEmployeeLoginAction(formData: FormData) {
  const profile = await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  try {
    await deactivateEmployeeLogin({
      schoolId: profile.school_id,
      employeeId,
    });
    revalidateEmployees(employeeId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not deactivate employee login.",
    };
  }
}

export async function activateEmployeeLoginAction(formData: FormData) {
  const profile = await requireAdmin();
  const employeeId = String(formData.get("employeeId") || "");
  try {
    await activateEmployeeLogin({
      schoolId: profile.school_id,
      employeeId,
    });
    revalidateEmployees(employeeId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not activate employee login.",
    };
  }
}
