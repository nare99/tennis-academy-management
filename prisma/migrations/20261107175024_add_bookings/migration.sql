
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_customerId_startAt_idx"
ON "Booking"("customerId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_courtId_startAt_idx"
ON "Booking"("courtId", "startAt");

-- AddForeignKey
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_courtId_fkey"
FOREIGN KEY ("courtId") REFERENCES "Court"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ensure that every booking has a valid time interval.
ALTER TABLE "Booking"
ADD CONSTRAINT "booking_valid_time_interval"
CHECK ("startAt" < "endAt");

-- Enable GiST equality support for text court IDs.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping active bookings for the same court.
ALTER TABLE "Booking"
ADD CONSTRAINT "booking_no_overlapping_active_court_bookings"
EXCLUDE USING GIST (
    "courtId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));
