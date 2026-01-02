-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "assets" TEXT[] DEFAULT ARRAY[]::TEXT[];
