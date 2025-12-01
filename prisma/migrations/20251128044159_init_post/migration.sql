/*
  Warnings:

  - You are about to drop the column `content` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `external_url` on the `Post` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Post_published_publishedAt_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "content",
DROP COLUMN "date",
DROP COLUMN "external_url",
ADD COLUMN     "contentMd" TEXT,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ALTER COLUMN "readMinutes" DROP NOT NULL,
ALTER COLUMN "readMinutes" DROP DEFAULT;
