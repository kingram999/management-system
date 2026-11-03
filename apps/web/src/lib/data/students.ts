import { createClient } from "@/lib/supabase/server";

export type StudentDirectoryRow = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  status: string;
  photo_url: string | null;
  house: string | null;
  category: string | null;
  remarks: string | null;
  date_of_birth: string;
  blood_group: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  nationality: string | null;
  mother_tongue: string | null;
  id_number: string | null;
  admitted_at: string;
  class_id: string | null;
  class_name: string | null;
  section_id: string | null;
  section_name: string | null;
  roll_number: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  father_name: string | null;
  mother_name: string | null;
  default_fee: number | null;
  concession_amount: number | null;
  final_fee: number | null;
  paid_fee: number;
  pending_fee: number | null;
  uses_transport: boolean;
  transport_route: string | null;
  transport_route_id: string | null;
  transport_stop: string | null;
  transport_mode: string | null;
};

type FeeSnapshot = {
  fee_amount: number | null;
  concession_type: string | null;
  concession_value: number | string | null;
  final_fee_amount: number | null;
};

function computeConcessionAmount(fee: FeeSnapshot): number | null {
  if (!fee.concession_type || fee.concession_value == null) return null;
  const value = Number(fee.concession_value);
  if (Number.isNaN(value) || value <= 0) return null;
  const base = fee.fee_amount ?? 0;
  if (fee.concession_type === "PERCENT") {
    return Math.round(base * (Math.min(100, Math.max(0, value)) / 100));
  }
  if (fee.concession_type === "AMOUNT") {
    return Math.round(Math.max(0, value));
  }
  return null;
}

const MAX_PHOTO_BYTES = 200 * 1024;

export async function uploadStudentPhoto(
  schoolId: string,
  studentId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 200 KB or smaller.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Photo must be an image file.");
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${schoolId}/${studentId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("student-photos")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("student-photos").getPublicUrl(path);
  return data.publicUrl;
}

export type StudentProfile = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  nationality: string | null;
  mother_tongue: string | null;
  id_number: string | null;
  house: string | null;
  category: string | null;
  remarks: string | null;
  photo_url: string | null;
  status: string;
  admitted_at: string;
  enrollment: {
    class_id: string | null;
    class_name: string | null;
    section_id: string | null;
    section_name: string | null;
    roll_number: string | null;
    academic_year_name: string | null;
  } | null;
  guardians: Array<{
    link_id: string;
    guardian_id: string;
    is_primary: boolean;
    full_name: string;
    relation: string;
    relation_other: string | null;
    phone: string;
    phone_secondary: string | null;
    email: string | null;
    address: string | null;
    occupation: string | null;
    can_pickup: boolean;
  }>;
  transport: {
    route_id: string;
    route_name: string;
    stop_id: string;
    stop_name: string;
    mode: "PICKUP" | "DROP" | "BOTH";
  } | null;
};

type GuardianLink = {
  is_primary: boolean;
  guardian:
    | {
        full_name: string;
        phone: string;
        relation: string;
      }
    | {
        full_name: string;
        phone: string;
        relation: string;
      }[]
    | null;
};

function unwrapGuardian(link: GuardianLink) {
  if (!link.guardian) return null;
  return Array.isArray(link.guardian) ? link.guardian[0] : link.guardian;
}

function primaryGuardian(links: GuardianLink[]) {
  const ordered = [...links].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const first = unwrapGuardian(ordered[0] ?? { is_primary: false, guardian: null });
  return { name: first?.full_name ?? null, phone: first?.phone ?? null };
}

function parentName(links: GuardianLink[], relation: "FATHER" | "MOTHER") {
  for (const link of links) {
    const g = unwrapGuardian(link);
    if (g?.relation === relation) return g.full_name;
  }
  return null;
}

export async function listStudentsForDirectory(
  schoolId: string,
): Promise<StudentDirectoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, admission_number, first_name, last_name, gender, status, photo_url, house, category, remarks, date_of_birth,
      blood_group, address, city, state, pincode, nationality, mother_tongue, id_number, admitted_at,
      enrollments:student_enrollments(
        roll_number, class_id, section_id,
        class:classes(id, name),
        section:sections(id, name),
        academic_year:academic_years(is_current)
      ),
      guardians:student_guardians(
        is_primary,
        guardian:guardians(full_name, phone, relation)
      ),
      admission_application:admission_applications!admission_application_id(
        fee_amount, concession_type, concession_value, final_fee_amount
      ),
      fee_payments(amount),
      transport:student_transport(
        is_active, mode, route_id, stop_id,
        route:transport_routes(name),
        stop:transport_stops(name)
      )
    `,
    )
    .eq("school_id", schoolId)
    .order("last_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((student) => {
    const enrollments = (student.enrollments ?? []) as Array<{
      roll_number: string | null;
      class_id: string;
      section_id: string | null;
      class: { id: string; name: string } | { id: string; name: string }[] | null;
      section:
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      academic_year:
        | { is_current: boolean }
        | { is_current: boolean }[]
        | null;
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
    const links = (student.guardians ?? []) as GuardianLink[];
    const guardian = primaryGuardian(links);

    const applicationRaw = (
      student as {
        admission_application?: FeeSnapshot | FeeSnapshot[] | null;
      }
    ).admission_application;
    const fee: FeeSnapshot | null = Array.isArray(applicationRaw)
      ? (applicationRaw[0] ?? null)
      : (applicationRaw ?? null);
    const defaultFee = fee?.fee_amount ?? null;
    const concessionAmount = fee ? computeConcessionAmount(fee) : null;
    const finalFee = fee?.final_fee_amount ?? null;
    const payments = (
      student as { fee_payments?: Array<{ amount: number }> | null }
    ).fee_payments;
    const paidFee = (payments ?? []).reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0,
    );
    const pendingFee =
      finalFee == null ? null : Math.max(0, finalFee - paidFee);

    const transportRaw = (
      student as {
        transport?:
          | {
              is_active: boolean;
              mode: string;
              route_id: string;
              stop_id: string;
              route: { name: string } | { name: string }[] | null;
              stop: { name: string } | { name: string }[] | null;
            }
          | {
              is_active: boolean;
              mode: string;
              route_id: string;
              stop_id: string;
              route: { name: string } | { name: string }[] | null;
              stop: { name: string } | { name: string }[] | null;
            }[]
          | null;
      }
    ).transport;
    const transport = Array.isArray(transportRaw)
      ? transportRaw[0]
      : transportRaw;
    const usesTransport = Boolean(transport?.is_active);
    const transportRoute = usesTransport
      ? Array.isArray(transport?.route)
        ? transport?.route[0]
        : transport?.route
      : null;
    const transportStop = usesTransport
      ? Array.isArray(transport?.stop)
        ? transport?.stop[0]
        : transport?.stop
      : null;

    return {
      id: student.id,
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      status: student.status,
      photo_url: student.photo_url,
      house: student.house,
      category: student.category ?? null,
      remarks: student.remarks ?? null,
      date_of_birth: student.date_of_birth,
      blood_group: student.blood_group,
      address: student.address,
      city: student.city,
      state: student.state,
      pincode: student.pincode,
      nationality: student.nationality,
      mother_tongue: student.mother_tongue,
      id_number: student.id_number,
      admitted_at: student.admitted_at,
      class_id: schoolClass?.id ?? current?.class_id ?? null,
      class_name: schoolClass?.name ?? null,
      section_id: section?.id ?? current?.section_id ?? null,
      section_name: section?.name ?? null,
      roll_number: current?.roll_number ?? null,
      guardian_name: guardian.name,
      guardian_phone: guardian.phone,
      father_name: parentName(links, "FATHER"),
      mother_name: parentName(links, "MOTHER"),
      default_fee: defaultFee,
      concession_amount: concessionAmount,
      final_fee: finalFee,
      paid_fee: paidFee,
      pending_fee: pendingFee,
      uses_transport: usesTransport,
      transport_route: transportRoute?.name ?? null,
      transport_route_id: usesTransport ? (transport?.route_id ?? null) : null,
      transport_stop: transportStop?.name ?? null,
      transport_mode: usesTransport ? (transport?.mode ?? null) : null,
    };
  });
}

export async function getStudentProfile(
  schoolId: string,
  studentId: string,
): Promise<StudentProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, admission_number, first_name, last_name, date_of_birth, gender, blood_group,
      address, city, state, pincode, nationality, mother_tongue, id_number, house,
      category, remarks, photo_url, status, admitted_at,
      enrollments:student_enrollments(
        roll_number, class_id, section_id,
        class:classes(id, name),
        section:sections(id, name),
        academic_year:academic_years(name, is_current)
      ),
      guardians:student_guardians(
        id, is_primary,
        guardian:guardians(
          id, full_name, relation, relation_other, phone, phone_secondary,
          email, address, occupation, can_pickup
        )
      ),
      transport:student_transport(
        is_active, mode, route_id, stop_id,
        route:transport_routes(name),
        stop:transport_stops(name)
      )
    `,
    )
    .eq("school_id", schoolId)
    .eq("id", studentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const enrollments = (data.enrollments ?? []) as Array<{
    roll_number: string | null;
    class_id: string;
    section_id: string | null;
    class: { id: string; name: string } | { id: string; name: string }[] | null;
    section:
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
    academic_year:
      | { name: string; is_current: boolean }
      | { name: string; is_current: boolean }[]
      | null;
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
  const academicYear = current
    ? Array.isArray(current.academic_year)
      ? current.academic_year[0]
      : current.academic_year
    : null;

  const guardians = ((data.guardians ?? []) as Array<{
    id: string;
    is_primary: boolean;
    guardian:
      | {
          id: string;
          full_name: string;
          relation: string;
          relation_other: string | null;
          phone: string;
          phone_secondary: string | null;
          email: string | null;
          address: string | null;
          occupation: string | null;
          can_pickup: boolean;
        }
      | {
          id: string;
          full_name: string;
          relation: string;
          relation_other: string | null;
          phone: string;
          phone_secondary: string | null;
          email: string | null;
          address: string | null;
          occupation: string | null;
          can_pickup: boolean;
        }[]
      | null;
  }>)
    .map((link) => {
      const g = Array.isArray(link.guardian) ? link.guardian[0] : link.guardian;
      if (!g) return null;
      return {
        link_id: link.id,
        guardian_id: g.id,
        is_primary: link.is_primary,
        full_name: g.full_name,
        relation: g.relation,
        relation_other: g.relation_other,
        phone: g.phone,
        phone_secondary: g.phone_secondary,
        email: g.email,
        address: g.address,
        occupation: g.occupation,
        can_pickup: g.can_pickup,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

  const transportRaw = (
    data as {
      transport?:
        | {
            is_active: boolean;
            mode: "PICKUP" | "DROP" | "BOTH";
            route_id: string;
            stop_id: string;
            route: { name: string } | { name: string }[] | null;
            stop: { name: string } | { name: string }[] | null;
          }
        | {
            is_active: boolean;
            mode: "PICKUP" | "DROP" | "BOTH";
            route_id: string;
            stop_id: string;
            route: { name: string } | { name: string }[] | null;
            stop: { name: string } | { name: string }[] | null;
          }[]
        | null;
    }
  ).transport;
  const transportRow = Array.isArray(transportRaw)
    ? transportRaw[0]
    : transportRaw;
  const transport =
    transportRow?.is_active
      ? {
          route_id: transportRow.route_id,
          route_name: (
            Array.isArray(transportRow.route)
              ? transportRow.route[0]
              : transportRow.route
          )?.name ?? "",
          stop_id: transportRow.stop_id,
          stop_name: (
            Array.isArray(transportRow.stop)
              ? transportRow.stop[0]
              : transportRow.stop
          )?.name ?? "",
          mode: transportRow.mode,
        }
      : null;

  return {
    id: data.id,
    admission_number: data.admission_number,
    first_name: data.first_name,
    last_name: data.last_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    blood_group: data.blood_group,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    nationality: data.nationality,
    mother_tongue: data.mother_tongue,
    id_number: data.id_number,
    house: data.house,
    category: data.category ?? null,
    remarks: data.remarks ?? null,
    photo_url: data.photo_url,
    status: data.status,
    admitted_at: data.admitted_at,
    enrollment: current
      ? {
          class_id: schoolClass?.id ?? current.class_id,
          class_name: schoolClass?.name ?? null,
          section_id: section?.id ?? current.section_id,
          section_name: section?.name ?? null,
          roll_number: current.roll_number,
          academic_year_name: academicYear?.name ?? null,
        }
      : null,
    guardians,
    transport,
  };
}

export async function updateStudentPersonal(
  schoolId: string,
  studentId: string,
  input: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    blood_group: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    nationality: string | null;
    mother_tongue: string | null;
    id_number: string | null;
    house: string | null;
    category: string | null;
    remarks: string | null;
    status: string;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
}

export async function updateGuardianDetails(
  schoolId: string,
  guardianId: string,
  input: {
    full_name: string;
    phone: string;
    phone_secondary: string | null;
    email: string | null;
    address: string | null;
    occupation: string | null;
    can_pickup: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guardianId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
}

export async function setPrimaryGuardian(
  schoolId: string,
  studentId: string,
  linkId: string,
) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!student) throw new Error("Student not found.");

  await supabase
    .from("student_guardians")
    .update({ is_primary: false })
    .eq("student_id", studentId);

  const { error } = await supabase
    .from("student_guardians")
    .update({ is_primary: true })
    .eq("id", linkId)
    .eq("student_id", studentId);

  if (error) throw new Error(error.message);
}
