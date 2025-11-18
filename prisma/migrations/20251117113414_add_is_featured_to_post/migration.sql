/*
  Warnings:

  - You are about to drop the column `contentMd` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "contentMd",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;
