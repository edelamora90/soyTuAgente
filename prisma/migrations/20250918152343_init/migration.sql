-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT[] DEFAULT ARRAY['admin']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "ubicacion" TEXT NOT NULL,
    "whatsapp" TEXT,
    "especialidades" TEXT[],
    "experiencia" TEXT[],
    "servicios" TEXT[],
    "certificaciones" TEXT[],
    "aseguradoras" TEXT[],
    "mediaThumbs" TEXT[],
    "mediaHero" TEXT NOT NULL,
    "redes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT,
    "verificado" BOOLEAN DEFAULT false,
    "foto" TEXT,
    "ubicacion" TEXT,
    "whatsapp" TEXT,
    "especialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experiencia" TEXT,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aseguradoras" TEXT,
    "logroDestacado" TEXT,
    "logosAseg" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosMini" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotoHero" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "tiktok" TEXT,

    CONSTRAINT "AgentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "public"."AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "public"."Agent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSubmission_slug_key" ON "public"."AgentSubmission"("slug");
