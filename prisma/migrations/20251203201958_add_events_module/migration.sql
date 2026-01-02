-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EVENT', 'CAPACITACION', 'WEBINAR');

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('ONLINE', 'PRESENCIAL', 'HIBRIDO');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "mode" "EventMode" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "coverImg" TEXT,
    "speakerName" TEXT,
    "speakerRole" TEXT,
    "speakerAvatar" TEXT,
    "registrationUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
