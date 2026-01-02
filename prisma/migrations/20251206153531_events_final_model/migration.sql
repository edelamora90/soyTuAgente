/*
  Warnings:

  - You are about to drop the column `city` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `BlogPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "city",
DROP COLUMN "location",
DROP COLUMN "state",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsapp" TEXT;

-- DropTable
DROP TABLE "public"."BlogPost";
