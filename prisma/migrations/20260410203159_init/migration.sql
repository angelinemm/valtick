-- CreateEnum
CREATE TYPE "LiftStatus" AS ENUM ('working', 'broken', 'junked');

-- CreateTable
CREATE TABLE "Resort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "moneyCents" INTEGER NOT NULL,
    "lastTickAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lift" (
    "id" TEXT NOT NULL,
    "resortId" TEXT NOT NULL,
    "liftModelKey" TEXT NOT NULL,
    "currentBreakProbability" DOUBLE PRECISION NOT NULL,
    "status" "LiftStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resort_guestId_key" ON "Resort"("guestId");

-- CreateIndex
CREATE INDEX "Lift_resortId_idx" ON "Lift"("resortId");

-- CreateIndex
CREATE INDEX "Lift_status_idx" ON "Lift"("status");

-- AddForeignKey
ALTER TABLE "Lift" ADD CONSTRAINT "Lift_resortId_fkey" FOREIGN KEY ("resortId") REFERENCES "Resort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
