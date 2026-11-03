import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EmployeeCategory = "TEACHER" | "STAFF" | "OTHER";
export type EmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "TERMINATED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export type EmployeeRecord = {
  id: string;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: EmployeeCategory;
  designation: string;
  department: string | null;
  joined_on: string | null;
  status: EmployeeStatus;
  monthly_salary: number;
  profile_id: string | null;
  login_active: boolean | null;
  login_email: string | null;
};

export type EmployeesOverview = {
  staff: number;
  teachers: number;
  presentToday: number;
  salaryPaidThisMonth: number;
};

export type EmployeeAttendanceRow = {
  employeeId: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  designation: string;
  category: EmployeeCategory;
  status: AttendanceStatus;
  existing: boolean;
};

export type EmployeeSalaryPayment = {
  id: string;
  employee_id: string;
  amount: number;
  paid_on: string;
  period_label: string | null;
  method: string | null;
  note: string | null;
  employee_name?: string;
};

export type PayrollRow = {
  employee: EmployeeRecord;
  paidThisPeriod: number;
  pendingThisPeriod: number;
};

const EMPLOYEE_SELECT = `
  id, employee_code, first_name, last_name, gender, date_of_birth,
  phone, email, address, category, designation, department, joined_on,
  status, monthly_salary, profile_id,
  profile:profiles(id, email, is_active)
`;

function mapEmployee(row: Record<string, unknown>): EmployeeRecord {
  const profileRaw = row.profile as
    | { id: string; email: string; is_active: boolean }
    | { id: string; email: string; is_active: boolean }[]
    | null
    | undefined;
  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

  return {
    id: row.id as string,
    employee_code: (row.employee_code as string | null) ?? null,
    first_name: row.first_name as string,
    last_name: row.last_name as string,
    gender: (row.gender as string | null) ?? null,
    date_of_birth: (row.date_of_birth as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    category: row.category as EmployeeCategory,
    designation: row.designation as string,
    department: (row.department as string | null) ?? null,
    joined_on: (row.joined_on as string | null) ?? null,
    status: row.status as EmployeeStatus,
    monthly_salary: (row.monthly_salary as number) ?? 0,
    profile_id: (row.profile_id as string | null) ?? null,
    login_active: profile ? profile.is_active : null,
    login_email: profile?.email ?? null,
  };
}

function currentPeriodLabel(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(periodLabel?: string) {
  const label = periodLabel || currentPeriodLabel();
  const [y, m] = label.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0);
  const end = `${y}-${String(m).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { label, start, end };
}

export async function getEmployeesOverview(
  schoolId: string,
): Promise<EmployeesOverview> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start, end } = monthBounds();

  const [staffRes, teachersRes, presentRes, paidRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .eq("status", "ACTIVE"),
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .eq("status", "ACTIVE")
      .eq("category", "TEACHER"),
    supabase
      .from("employee_attendance")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("attendance_date", today)
      .eq("status", "PRESENT"),
    supabase
      .from("employee_salary_payments")
      .select("amount")
      .eq("school_id", schoolId)
      .gte("paid_on", start)
      .lte("paid_on", end),
  ]);

  if (staffRes.error) throw new Error(staffRes.error.message);
  if (teachersRes.error) throw new Error(teachersRes.error.message);
  if (presentRes.error) throw new Error(presentRes.error.message);
  if (paidRes.error) throw new Error(paidRes.error.message);

  const salaryPaidThisMonth = (paidRes.data ?? []).reduce(
    (sum, row) => sum + (row.amount || 0),
    0,
  );

  return {
    staff: staffRes.count ?? 0,
    teachers: teachersRes.count ?? 0,
    presentToday: presentRes.count ?? 0,
    salaryPaidThisMonth,
  };
}

export async function listEmployees(
  schoolId: string,
): Promise<EmployeeRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEmployee(row as Record<string, unknown>));
}

export async function getEmployee(
  schoolId: string,
  employeeId: string,
): Promise<EmployeeRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("school_id", schoolId)
    .eq("id", employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapEmployee(data as Record<string, unknown>);
}

export async function createEmployee(input: {
  schoolId: string;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: EmployeeCategory;
  designation: string;
  department?: string | null;
  joinedOn?: string | null;
  status?: EmployeeStatus;
  monthlySalary?: number;
}): Promise<{ id: string }> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const designation = input.designation.trim();
  if (!firstName || !lastName) throw new Error("Name is required.");
  if (!designation) throw new Error("Designation is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      school_id: input.schoolId,
      employee_code: input.employeeCode?.trim() || null,
      first_name: firstName,
      last_name: lastName,
      gender: input.gender || null,
      date_of_birth: input.dateOfBirth || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      category: input.category ?? "STAFF",
      designation,
      department: input.department?.trim() || null,
      joined_on: input.joinedOn || null,
      status: input.status ?? "ACTIVE",
      monthly_salary: Math.max(0, Math.round(input.monthlySalary ?? 0)),
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("An employee with this code already exists.");
    }
    throw new Error(error?.message || "Could not create employee.");
  }
  return data;
}

export async function updateEmployee(input: {
  schoolId: string;
  id: string;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: EmployeeCategory;
  designation: string;
  department?: string | null;
  joinedOn?: string | null;
  status?: EmployeeStatus;
  monthlySalary?: number;
}): Promise<void> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const designation = input.designation.trim();
  if (!firstName || !lastName) throw new Error("Name is required.");
  if (!designation) throw new Error("Designation is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      employee_code: input.employeeCode?.trim() || null,
      first_name: firstName,
      last_name: lastName,
      gender: input.gender || null,
      date_of_birth: input.dateOfBirth || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      category: input.category ?? "STAFF",
      designation,
      department: input.department?.trim() || null,
      joined_on: input.joinedOn || null,
      status: input.status ?? "ACTIVE",
      monthly_salary: Math.max(0, Math.round(input.monthlySalary ?? 0)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      throw new Error("An employee with this code already exists.");
    }
    throw new Error(error.message);
  }
}

export async function softDeleteEmployee(
  schoolId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("employees")
    .update({
      deleted_at: now,
      status: "INACTIVE",
      updated_at: now,
    })
    .eq("id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function listEmployeeAttendanceSheet(input: {
  schoolId: string;
  date: string;
}): Promise<{
  date: string;
  rows: EmployeeAttendanceRow[];
  lastMarkedByName: string | null;
}> {
  const supabase = await createClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, designation, category, status",
    )
    .eq("school_id", input.schoolId)
    .is("deleted_at", null)
    .eq("status", "ACTIVE")
    .order("last_name", { ascending: true });

  if (error) throw new Error(error.message);

  const ids = (employees ?? []).map((e) => e.id);
  const existing = new Map<
    string,
    { status: AttendanceStatus; markedByName: string | null }
  >();
  let lastMarkedByName: string | null = null;

  if (ids.length) {
    const { data: marks, error: marksError } = await supabase
      .from("employee_attendance")
      .select(
        `
        employee_id, status,
        marked_by:profiles!marked_by_id(full_name)
      `,
      )
      .eq("school_id", input.schoolId)
      .eq("attendance_date", input.date)
      .in("employee_id", ids);

    if (marksError) throw new Error(marksError.message);

    for (const mark of marks ?? []) {
      const markedBy = Array.isArray(mark.marked_by)
        ? mark.marked_by[0]
        : mark.marked_by;
      existing.set(mark.employee_id, {
        status: mark.status as AttendanceStatus,
        markedByName: markedBy?.full_name ?? null,
      });
      if (markedBy?.full_name) lastMarkedByName = markedBy.full_name;
    }
  }

  return {
    date: input.date,
    lastMarkedByName,
    rows: (employees ?? []).map((emp) => {
      const mark = existing.get(emp.id);
      return {
        employeeId: emp.id,
        employeeCode: emp.employee_code,
        firstName: emp.first_name,
        lastName: emp.last_name,
        designation: emp.designation,
        category: emp.category as EmployeeCategory,
        status: mark?.status ?? "PRESENT",
        existing: Boolean(mark),
      };
    }),
  };
}

export async function saveEmployeeAttendance(input: {
  schoolId: string;
  markedById: string;
  date: string;
  marks: Array<{ employeeId: string; status: AttendanceStatus }>;
}): Promise<void> {
  if (!input.date) throw new Error("Date is required.");
  if (!input.marks.length) throw new Error("No attendance marks to save.");

  const supabase = await createClient();
  const now = new Date().toISOString();
  const rows = input.marks.map((mark) => ({
    school_id: input.schoolId,
    employee_id: mark.employeeId,
    attendance_date: input.date,
    status: mark.status,
    marked_by_id: input.markedById,
    updated_at: now,
  }));

  const { error } = await supabase.from("employee_attendance").upsert(rows, {
    onConflict: "employee_id,attendance_date",
  });

  if (error) throw new Error(error.message);
}

export async function listSalaryPaymentsForEmployee(
  schoolId: string,
  employeeId: string,
): Promise<EmployeeSalaryPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_salary_payments")
    .select("id, employee_id, amount, paid_on, period_label, method, note")
    .eq("school_id", schoolId)
    .eq("employee_id", employeeId)
    .order("paid_on", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeeSalaryPayment[];
}

export async function listPayrollRows(
  schoolId: string,
  periodLabel?: string,
): Promise<{ periodLabel: string; rows: PayrollRow[] }> {
  const { label, start, end } = monthBounds(periodLabel);
  const employees = await listEmployees(schoolId);
  const active = employees.filter((e) => e.status === "ACTIVE");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_salary_payments")
    .select("employee_id, amount")
    .eq("school_id", schoolId)
    .gte("paid_on", start)
    .lte("paid_on", end);

  if (error) throw new Error(error.message);

  const paidByEmployee = new Map<string, number>();
  for (const payment of data ?? []) {
    paidByEmployee.set(
      payment.employee_id,
      (paidByEmployee.get(payment.employee_id) ?? 0) + (payment.amount || 0),
    );
  }

  return {
    periodLabel: label,
    rows: active.map((employee) => {
      const paidThisPeriod = paidByEmployee.get(employee.id) ?? 0;
      return {
        employee,
        paidThisPeriod,
        pendingThisPeriod: Math.max(0, employee.monthly_salary - paidThisPeriod),
      };
    }),
  };
}

export async function recordSalaryPayment(input: {
  schoolId: string;
  recordedById: string;
  employeeId: string;
  amount: number;
  paidOn: string;
  periodLabel?: string | null;
  method?: string | null;
  note?: string | null;
}): Promise<{ id: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  if (!input.paidOn) throw new Error("Payment date is required.");

  const employee = await getEmployee(input.schoolId, input.employeeId);
  if (!employee) throw new Error("Employee not found.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_salary_payments")
    .insert({
      school_id: input.schoolId,
      employee_id: input.employeeId,
      amount: Math.round(input.amount),
      paid_on: input.paidOn,
      period_label: input.periodLabel?.trim() || currentPeriodLabel(),
      method: input.method?.trim() || null,
      note: input.note?.trim() || null,
      recorded_by_id: input.recordedById,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not record salary payment.");
  }
  return data;
}

export async function createEmployeeLogin(input: {
  schoolId: string;
  employeeId: string;
  temporaryPassword: string;
}): Promise<void> {
  const password = input.temporaryPassword.trim();
  if (password.length < 8) {
    throw new Error("Temporary password must be at least 8 characters.");
  }

  const employee = await getEmployee(input.schoolId, input.employeeId);
  if (!employee) throw new Error("Employee not found.");
  if (employee.profile_id) {
    throw new Error("This employee already has a login linked.");
  }
  const email = (employee.email || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Add an email on the employee profile before creating a login.");
  }

  const role = employee.category === "TEACHER" ? "TEACHER" : "STAFF";
  const admin = createAdminClient();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${employee.first_name} ${employee.last_name}`.trim(),
        school_id: input.schoolId,
        role,
      },
    });

  if (createError || !created.user) {
    throw new Error(createError?.message || "Could not create login user.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: created.user.id,
      school_id: input.schoolId,
      role,
      full_name: `${employee.first_name} ${employee.last_name}`.trim(),
      email,
      phone: employee.phone,
      is_active: true,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError?.message || "Could not create staff profile.");
  }

  const { error: linkError } = await admin
    .from("employees")
    .update({
      profile_id: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.employeeId)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (linkError) {
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(linkError.message);
  }
}

export async function deactivateEmployeeLogin(input: {
  schoolId: string;
  employeeId: string;
}): Promise<void> {
  const employee = await getEmployee(input.schoolId, input.employeeId);
  if (!employee?.profile_id) {
    throw new Error("No login is linked to this employee.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employee.profile_id)
    .eq("school_id", input.schoolId);

  if (error) throw new Error(error.message);
}

export async function activateEmployeeLogin(input: {
  schoolId: string;
  employeeId: string;
}): Promise<void> {
  const employee = await getEmployee(input.schoolId, input.employeeId);
  if (!employee?.profile_id) {
    throw new Error("No login is linked to this employee.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employee.profile_id)
    .eq("school_id", input.schoolId);

  if (error) throw new Error(error.message);
}

export { currentPeriodLabel };
