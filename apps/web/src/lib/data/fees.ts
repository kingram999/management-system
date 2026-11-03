import { createClient } from "@/lib/supabase/server";
import { listStudentsForDirectory } from "./students";

export type FeePaymentMethod = "CASH" | "UPI" | "BANK" | "OTHER";

export type FeeOverview = {
  billed: number;
  collected: number;
  pending: number;
  byClass: Array<{
    classId: string | null;
    className: string;
    billed: number;
    collected: number;
    pending: number;
    studentCount: number;
  }>;
};

export type StudentFeeBalance = {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  classId: string | null;
  className: string | null;
  sectionName: string | null;
  status: string;
  billed: number;
  paid: number;
  pending: number;
};

export type FeePaymentRecord = {
  id: string;
  amount: number;
  method: FeePaymentMethod;
  paid_at: string;
  receipt_number: string;
  note: string | null;
};

function activeStudentsOnly(
  rows: Awaited<ReturnType<typeof listStudentsForDirectory>>,
) {
  return rows.filter((row) => row.status === "ACTIVE");
}

export async function getFeeOverview(schoolId: string): Promise<FeeOverview> {
  const students = activeStudentsOnly(await listStudentsForDirectory(schoolId));
  let billed = 0;
  let collected = 0;
  let pending = 0;
  const byClassMap = new Map<
    string,
    {
      classId: string | null;
      className: string;
      billed: number;
      collected: number;
      pending: number;
      studentCount: number;
    }
  >();

  for (const student of students) {
    const studentBilled = student.final_fee ?? 0;
    const studentPaid = student.paid_fee;
    const studentPending =
      student.pending_fee == null
        ? Math.max(0, studentBilled - studentPaid)
        : student.pending_fee;

    billed += studentBilled;
    collected += studentPaid;
    pending += studentPending;

    const key = student.class_id ?? "__none__";
    const existing = byClassMap.get(key) ?? {
      classId: student.class_id,
      className: student.class_name ?? "No class",
      billed: 0,
      collected: 0,
      pending: 0,
      studentCount: 0,
    };
    existing.billed += studentBilled;
    existing.collected += studentPaid;
    existing.pending += studentPending;
    existing.studentCount += 1;
    byClassMap.set(key, existing);
  }

  const byClass = Array.from(byClassMap.values()).sort((a, b) =>
    a.className.localeCompare(b.className),
  );

  return { billed, collected, pending, byClass };
}

export async function listStudentFeeBalances(
  schoolId: string,
): Promise<StudentFeeBalance[]> {
  const students = await listStudentsForDirectory(schoolId);
  return students.map((student) => {
    const billed = student.final_fee ?? 0;
    const paid = student.paid_fee;
    const pending =
      student.pending_fee == null ? Math.max(0, billed - paid) : student.pending_fee;
    return {
      studentId: student.id,
      admissionNumber: student.admission_number,
      firstName: student.first_name,
      lastName: student.last_name,
      classId: student.class_id,
      className: student.class_name,
      sectionName: student.section_name,
      status: student.status,
      billed,
      paid,
      pending,
    };
  });
}

export async function getStudentFeeBalance(
  schoolId: string,
  studentId: string,
): Promise<StudentFeeBalance | null> {
  const rows = await listStudentFeeBalances(schoolId);
  return rows.find((row) => row.studentId === studentId) ?? null;
}

export async function listPaymentsForStudent(
  schoolId: string,
  studentId: string,
): Promise<FeePaymentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .select("id, amount, method, paid_at, receipt_number, note")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FeePaymentRecord[];
}

async function nextReceiptNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear().toString();
  const prefix = `RCP-${year}-`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .select("receipt_number")
    .eq("school_id", schoolId)
    .like("receipt_number", `${prefix}%`)
    .order("receipt_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  const latest = data?.[0]?.receipt_number as string | undefined;
  const next = latest
    ? Number.parseInt(latest.slice(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(Number.isFinite(next) ? next : 1).padStart(4, "0")}`;
}

export async function recordFeePayment(input: {
  schoolId: string;
  recordedById: string;
  studentId: string;
  amount: number;
  method: FeePaymentMethod;
  paidAt: string;
  note?: string | null;
}): Promise<{ id: string; receiptNumber: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const balance = await getStudentFeeBalance(input.schoolId, input.studentId);
  if (!balance) throw new Error("Student not found.");
  if (input.amount > balance.pending) {
    throw new Error(
      `Amount cannot exceed pending fee (${balance.pending}).`,
    );
  }

  const methods: FeePaymentMethod[] = ["CASH", "UPI", "BANK", "OTHER"];
  if (!methods.includes(input.method)) {
    throw new Error("Choose a valid payment method.");
  }

  const receiptNumber = await nextReceiptNumber(input.schoolId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .insert({
      school_id: input.schoolId,
      student_id: input.studentId,
      amount: Math.round(input.amount),
      method: input.method,
      paid_at: input.paidAt,
      receipt_number: receiptNumber,
      note: input.note?.trim() || null,
      recorded_by_id: input.recordedById,
    })
    .select("id, receipt_number")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not record payment.");
  }

  return { id: data.id, receiptNumber: data.receipt_number };
}

export type FeePaymentReceipt = {
  paymentId: string;
  receiptNumber: string;
  amount: number;
  method: FeePaymentMethod;
  paidAt: string;
  note: string | null;
  recordedByName: string | null;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    className: string | null;
    sectionName: string | null;
  };
  school: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
  billed: number;
  paidTotal: number;
  pending: number;
};

export async function getFeePaymentReceipt(
  schoolId: string,
  paymentId: string,
): Promise<FeePaymentReceipt | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .select(
      `
      id, amount, method, paid_at, receipt_number, note, school_id, student_id,
      recorded_by:profiles!recorded_by_id(full_name),
      student:students!student_id(
        id, admission_number, first_name, last_name,
        enrollments:student_enrollments(
          class:classes(name),
          section:sections(name),
          academic_year:academic_years(is_current)
        )
      ),
      school:schools!school_id(
        name, address, city, state, pincode, phone, email, logo_url
      )
    `,
    )
    .eq("id", paymentId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const recordedBy = Array.isArray(data.recorded_by)
    ? data.recorded_by[0]
    : data.recorded_by;
  const studentRaw = Array.isArray(data.student) ? data.student[0] : data.student;
  const schoolRaw = Array.isArray(data.school) ? data.school[0] : data.school;
  if (!studentRaw || !schoolRaw) return null;

  const enrollments = (studentRaw.enrollments ?? []) as Array<{
    class: { name: string } | { name: string }[] | null;
    section: { name: string } | { name: string }[] | null;
    academic_year: { is_current: boolean } | { is_current: boolean }[] | null;
  }>;
  const current =
    enrollments.find((item) => {
      const year = Array.isArray(item.academic_year)
        ? item.academic_year[0]
        : item.academic_year;
      return year?.is_current;
    }) ?? enrollments[0];
  const schoolClass = current
    ? Array.isArray(current.class)
      ? current.class[0]
      : current.class
    : null;
  const section = current
    ? Array.isArray(current.section)
      ? current.section[0]
      : current.section
    : null;

  const balance = await getStudentFeeBalance(schoolId, studentRaw.id);

  return {
    paymentId: data.id,
    receiptNumber: data.receipt_number,
    amount: data.amount,
    method: data.method,
    paidAt: data.paid_at,
    note: data.note,
    recordedByName: recordedBy?.full_name ?? null,
    student: {
      id: studentRaw.id,
      admissionNumber: studentRaw.admission_number,
      firstName: studentRaw.first_name,
      lastName: studentRaw.last_name,
      className: schoolClass?.name ?? null,
      sectionName: section?.name ?? null,
    },
    school: {
      name: schoolRaw.name,
      address: schoolRaw.address,
      city: schoolRaw.city,
      state: schoolRaw.state,
      pincode: schoolRaw.pincode,
      phone: schoolRaw.phone,
      email: schoolRaw.email,
      logoUrl: schoolRaw.logo_url,
    },
    billed: balance?.billed ?? 0,
    paidTotal: balance?.paid ?? 0,
    pending: balance?.pending ?? 0,
  };
}
