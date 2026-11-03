import { createClient } from "@/lib/supabase/server";
import {
  getFeeOverview,
  listStudentFeeBalances,
  type StudentFeeBalance,
} from "./fees";
import { getIncomeExpenseTotals } from "./inventory";

export type BirthdayPerson = {
  id: string;
  name: string;
  detail: string | null;
};

export type DashboardStats = {
  activeStudents: number;
  teachers: number;
  employees: number;
  guardians: number;
  fee: {
    billed: number;
    collected: number;
    pending: number;
  };
  incomeExpense: {
    income: number;
    expense: number;
  };
  pendingFeeStudents: StudentFeeBalance[];
  studentBirthdaysToday: BirthdayPerson[];
  employeeBirthdaysToday: BirthdayPerson[];
  admissions: {
    pending: number;
    approved: number;
    total: number;
  };
  recentApplications: Array<{
    id: string;
    application_number: string;
    first_name: string;
    last_name: string;
    status: string;
    created_at: string;
  }>;
};

function todayMonthDay() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export async function getDashboardStats(
  schoolId: string,
): Promise<DashboardStats> {
  const supabase = await createClient();
  const { month, day } = todayMonthDay();

  const [
    fee,
    feeBalances,
    incomeExpense,
    { count: activeStudents },
    { count: guardians },
    { data: birthdayRows },
    { count: employeesCount },
    { count: teachersCount },
    { data: employeeBirthdayRows },
    { count: pending },
    { count: approved },
    { count: total },
    { data: recent },
  ] = await Promise.all([
    getFeeOverview(schoolId),
    listStudentFeeBalances(schoolId),
    getIncomeExpenseTotals(schoolId),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "ACTIVE"),
    supabase
      .from("guardians")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId),
    supabase
      .from("students")
      .select("id, first_name, last_name, date_of_birth, admission_number")
      .eq("school_id", schoolId)
      .eq("status", "ACTIVE"),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .eq("status", "ACTIVE"),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .eq("status", "ACTIVE")
      .eq("category", "TEACHER"),
    supabase
      .from("employees")
      .select("id, first_name, last_name, date_of_birth, designation, employee_code")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .eq("status", "ACTIVE"),
    supabase
      .from("admission_applications")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW", "WAITLISTED"]),
    supabase
      .from("admission_applications")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "APPROVED"),
    supabase
      .from("admission_applications")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId),
    supabase
      .from("admission_applications")
      .select(
        "id, application_number, first_name, last_name, status, created_at",
      )
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pendingFeeStudents = feeBalances
    .filter((row) => row.status === "ACTIVE" && row.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 10);

  const studentBirthdaysToday = (birthdayRows ?? [])
    .filter((row) => {
      if (!row.date_of_birth) return false;
      // date_of_birth is a calendar date; parse as local Y-M-D to avoid TZ shifts
      const raw = String(row.date_of_birth).slice(0, 10);
      const [, mm, dd] = raw.split("-").map(Number);
      return mm === month && dd === day;
    })
    .map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      detail: row.admission_number as string | null,
    }));

  const employeeBirthdaysToday = (employeeBirthdayRows ?? [])
    .filter((row) => {
      if (!row.date_of_birth) return false;
      const raw = String(row.date_of_birth).slice(0, 10);
      const [, mm, dd] = raw.split("-").map(Number);
      return mm === month && dd === day;
    })
    .map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      detail: (row.designation || row.employee_code) as string | null,
    }));

  return {
    activeStudents: activeStudents ?? 0,
    teachers: teachersCount ?? 0,
    employees: employeesCount ?? 0,
    guardians: guardians ?? 0,
    fee: {
      billed: fee.billed,
      collected: fee.collected,
      pending: fee.pending,
    },
    incomeExpense,
    pendingFeeStudents,
    studentBirthdaysToday,
    employeeBirthdaysToday,
    admissions: {
      pending: pending ?? 0,
      approved: approved ?? 0,
      total: total ?? 0,
    },
    recentApplications: recent ?? [],
  };
}
