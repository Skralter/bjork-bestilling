/*
  Warnings:

  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[sid]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sid_key" ON "sessions"("sid");
