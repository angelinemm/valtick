-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable: make guestId nullable and add userId
ALTER TABLE "Resort" ALTER COLUMN "guestId" DROP NOT NULL;
ALTER TABLE "Resort" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resort_userId_key" ON "Resort"("userId");

-- AddForeignKey
ALTER TABLE "Resort" ADD CONSTRAINT "Resort_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
