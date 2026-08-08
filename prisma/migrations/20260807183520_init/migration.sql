-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'ASSISTANT', 'PARENT');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('CLASS_8', 'CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('WEEKLY_TEST', 'MONTHLY_TEST', 'EXAM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'TERM', 'ANNUAL');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PAID', 'PARTIAL', 'OVERDUE', 'PENDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_date" TIMESTAMP(3),

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "class_level" "ClassLevel" NOT NULL,
    "section" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "admission_date" TIMESTAMP(3),
    "school_name" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_links" (
    "id" TEXT NOT NULL,
    "parent_user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicable_classes" "ClassLevel"[],

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_subjects" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT,

    CONSTRAINT "student_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "subject_id" TEXT,
    "marked_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_level" "ClassLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "assessment_type" "AssessmentType" NOT NULL,
    "max_marks" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "chapter_topic" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_marks" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "entered_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "class_level" "ClassLevel" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount_due" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "recorded_by" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "generated_pdf_url" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "at_risk_settings" (
    "id" TEXT NOT NULL,
    "attendance_window_days" INTEGER NOT NULL DEFAULT 30,
    "attendance_threshold_percent" INTEGER NOT NULL DEFAULT 75,
    "average_recent_count" INTEGER NOT NULL DEFAULT 5,
    "average_threshold_percent" INTEGER NOT NULL DEFAULT 40,
    "consecutive_absences_threshold" INTEGER NOT NULL DEFAULT 3,
    "trend_window_count" INTEGER NOT NULL DEFAULT 3,
    "trend_decline_threshold_points" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "at_risk_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_user_id_key" ON "staff_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_links_parent_user_id_student_id_key" ON "parent_student_links"("parent_user_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_subjects_student_id_subject_id_key" ON "student_subjects"("student_id", "subject_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_id_date_idx" ON "attendance_records"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_student_id_date_subject_id_key" ON "attendance_records"("student_id", "date", "subject_id");

-- CreateIndex
CREATE INDEX "assessments_subject_id_class_level_idx" ON "assessments"("subject_id", "class_level");

-- CreateIndex
CREATE INDEX "assessment_marks_student_id_idx" ON "assessment_marks"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_marks_assessment_id_student_id_key" ON "assessment_marks"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_payments_student_id_idx" ON "fee_payments"("student_id");

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
