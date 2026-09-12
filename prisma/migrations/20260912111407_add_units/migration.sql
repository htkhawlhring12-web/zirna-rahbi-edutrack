/*
  Warnings:

  - You are about to drop the column `class_level` on the `chapters` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `chapters` table. All the data in the column will be lost.
  - Added the required column `unit_id` to the `chapters` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chapters" DROP CONSTRAINT "chapters_subject_id_fkey";

-- DropIndex
DROP INDEX "public"."chapters_subject_id_class_level_idx";

-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "class_level",
DROP COLUMN "subject_id",
ADD COLUMN     "unit_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_level" "ClassLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "units_subject_id_class_level_idx" ON "units"("subject_id", "class_level");

-- CreateIndex
CREATE INDEX "chapters_unit_id_idx" ON "chapters"("unit_id");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
