export type SchoolRecord = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
  setup_completed_at: string | null;
  section_assignment_rule: string;
  roll_number_assignment_rule: string;
};

export type ClassRecord = {
  id: string;
  name: string;
  numeric_level: number;
  academic_year_id: string;
  annual_fee: number;
  sections: SectionRecord[];
};

export type SectionRecord = {
  id: string;
  name: string;
  head_teacher_name?: string | null;
  deleted_at?: string | null;
};

/** Flat row for the class settings table (one section per row). */
export type SectionRow = {
  sectionId: string;
  sectionName: string;
  headTeacherName: string | null;
  classId: string;
  className: string;
  numericLevel: number;
  annualFee: number;
};

export type AcademicYearRecord = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export type EnquiryStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "CLOSED";

export type AdmissionEnquiryRecord = {
  id: string;
  student_name: string;
  guardian_name: string;
  phone: string;
  email: string | null;
  interested_class: string | null;
  message: string | null;
  status: EnquiryStatus;
  created_at: string;
};
