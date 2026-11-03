import { requireAdmin } from "@/lib/auth";
import {
  getStudentFeeBalance,
  listPaymentsForStudent,
  listStudentFeeBalances,
} from "@/lib/data/fees";
import { CollectPaymentClient } from "./collect-client";

export default async function CollectPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const studentId = params.studentId || "";

  const students = await listStudentFeeBalances(profile.school_id);
  const [balance, payments] = studentId
    ? await Promise.all([
        getStudentFeeBalance(profile.school_id, studentId),
        listPaymentsForStudent(profile.school_id, studentId),
      ])
    : [null, []];

  return (
    <CollectPaymentClient
      students={students}
      initialStudentId={studentId}
      initialBalance={balance}
      initialPayments={payments}
    />
  );
}
