import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAdmissionEnquiries } from "@/lib/data/enquiries";
import type { EnquiryStatus } from "@/lib/data/types";
import { EnquiriesTable } from "./enquiries-table";

const FILTERS: Array<{ label: string; value: EnquiryStatus | "ALL" }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Closed", value: "CLOSED" },
  { label: "All", value: "ALL" },
];

export default async function AdmissionEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const statusParam = (params.status || "PENDING").toUpperCase();
  const status = (
    ["PENDING", "CONTACTED", "CONVERTED", "CLOSED", "ALL"].includes(statusParam)
      ? statusParam
      : "PENDING"
  ) as EnquiryStatus | "ALL";

  const enquiries = await listAdmissionEnquiries(profile.school_id, status);

  return (
    <div>
      <div>
        <h2 className="display-font text-3xl">Admission Enquiries</h2>
        <p className="mt-1 text-sm text-muted">
          Pending and reviewed enquiries from the school website
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const href =
            filter.value === "PENDING"
              ? "/admin/admissions/enquiries"
              : `/admin/admissions/enquiries?status=${filter.value}`;
          const active = status === filter.value;
          return (
            <Link
              key={filter.value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-brand text-white"
                  : "border border-border bg-background text-muted"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <EnquiriesTable enquiries={enquiries} />
      </div>
    </div>
  );
}
