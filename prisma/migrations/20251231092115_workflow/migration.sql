-- CreateEnum
CREATE TYPE "kategori_enum" AS ENUM ('TERBITAN', 'MEDIA_SOSIAL', 'TERJEMAHAN', 'KEUANGAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "status_task_enum" AS ENUM ('DRAFT', 'SEDANG_BERJALAN', 'MENUNGGU_KONFIRMASI', 'SELESAI');

-- CreateEnum
CREATE TYPE "progress_enum" AS ENUM ('P0_25', 'P26_50', 'P51_75', 'P76_99', 'SELESAI');

-- CreateEnum
CREATE TYPE "admin_decision_enum" AS ENUM ('SETUJU', 'REVISI');

-- CreateEnum
CREATE TYPE "archive_reason_enum" AS ENUM ('AUTO_STAGE', 'FINAL_STAGE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori" "kategori_enum" NOT NULL,
    "status" "status_task_enum" NOT NULL DEFAULT 'DRAFT',
    "progress" "progress_enum" NOT NULL DEFAULT 'P0_25',
    "pjId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tahapKe" INTEGER NOT NULL,
    "judulTahap" TEXT NOT NULL,
    "status" "status_task_enum" NOT NULL DEFAULT 'DRAFT',
    "progress" "progress_enum" NOT NULL DEFAULT 'P0_25',
    "deadline" TIMESTAMP(3),
    "linkPekerjaan" TEXT,
    "linkHasil" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminConfirmation" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "decision" "admin_decision_enum" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archive" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tahapKe" INTEGER NOT NULL,
    "judulTahap" TEXT NOT NULL,
    "status" "status_task_enum" NOT NULL,
    "progress" "progress_enum" NOT NULL,
    "reason" "archive_reason_enum" NOT NULL,
    "archivedById" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_pjId_fkey" FOREIGN KEY ("pjId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminConfirmation" ADD CONSTRAINT "AdminConfirmation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminConfirmation" ADD CONSTRAINT "AdminConfirmation_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
