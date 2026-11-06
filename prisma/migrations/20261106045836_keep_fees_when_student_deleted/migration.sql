-- DropForeignKey
ALTER TABLE "public"."fee_payments" DROP CONSTRAINT "fee_payments_student_id_fkey";

-- AlterTable
ALTER TABLE "fee_payments" ADD COLUMN     "student_name" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "student_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
