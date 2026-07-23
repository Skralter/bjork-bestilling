/*
  Warnings:

  - You are about to drop the column `maxPerUser` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "maxPerUser",
DROP COLUMN "unit",
ADD COLUMN     "breweryName" TEXT,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "orderStep" INTEGER NOT NULL DEFAULT 1;
