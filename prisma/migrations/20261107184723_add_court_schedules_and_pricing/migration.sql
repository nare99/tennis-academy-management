-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "PricingDayType" AS ENUM ('WEEKDAY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "PricingPeriod" AS ENUM ('OFF_PEAK', 'PEAK');

-- Rename the existing price column without losing data.
ALTER TABLE "Booking"
RENAME COLUMN "price" TO "priceMinor";

-- AlterTable
ALTER TABLE "Court" ADD COLUMN     "hasLights" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AcademySettings" (
    "id" TEXT NOT NULL DEFAULT 'academy',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Yerevan',
    "peakStartMinute" INTEGER NOT NULL DEFAULT 1020,
    "peakEndMinute" INTEGER NOT NULL DEFAULT 1260,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtOperatingHours" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtOperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtPricingRule" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayType" "PricingDayType" NOT NULL,
    "period" "PricingPeriod" NOT NULL,
    "hourlyRateMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtOperatingHours_courtId_dayOfWeek_idx" ON "CourtOperatingHours"("courtId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "CourtPricingRule_courtId_dayType_period_key" ON "CourtPricingRule"("courtId", "dayType", "period");

-- AddForeignKey
ALTER TABLE "CourtOperatingHours" ADD CONSTRAINT "CourtOperatingHours_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtPricingRule" ADD CONSTRAINT "CourtPricingRule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking prices cannot be negative.
ALTER TABLE "Booking"
ADD CONSTRAINT "booking_price_minor_nonnegative"
CHECK ("priceMinor" >= 0);

-- Operating intervals must be valid local minutes after midnight.
ALTER TABLE "CourtOperatingHours"
ADD CONSTRAINT "court_operating_hours_valid_interval"
CHECK (
    "startMinute" >= 0
    AND "endMinute" <= 1440
    AND "startMinute" < "endMinute"
);

-- Prevent overlapping operating intervals for the same court and weekday.
-- btree_gist was installed by the earlier booking migration.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "CourtOperatingHours"
ADD CONSTRAINT "court_operating_hours_no_overlap"
EXCLUDE USING GIST (
    "courtId" WITH =,
    "dayOfWeek" WITH =,
    int4range("startMinute", "endMinute", '[)') WITH &&
);

-- Hourly rates cannot be negative.
ALTER TABLE "CourtPricingRule"
ADD CONSTRAINT "court_pricing_rule_rate_nonnegative"
CHECK ("hourlyRateMinor" >= 0);

-- Peak hours must form a valid interval within the day.
ALTER TABLE "AcademySettings"
ADD CONSTRAINT "academy_settings_valid_peak_hours"
CHECK (
    "peakStartMinute" >= 0
    AND "peakEndMinute" <= 1440
    AND "peakStartMinute" < "peakEndMinute"
);

-- Enforce the fixed singleton settings ID.
ALTER TABLE "AcademySettings"
ADD CONSTRAINT "academy_settings_fixed_id"
CHECK ("id" = 'academy');

ALTER TABLE "CourtPricingRule"
ADD CONSTRAINT "court_pricing_rule_currency_valid"
CHECK (length("currency") = 3);
