-- Store trainer rates in minor currency units without discarding existing values.
ALTER TABLE "TrainerProfile"
RENAME COLUMN "hourlyRate" TO "hourlyRateMinor";

-- Invitations are single-use. Only a SHA-256 token hash is persisted.
CREATE TABLE "TrainerInvitation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainerInvitation_tokenHash_key"
ON "TrainerInvitation"("tokenHash");

CREATE INDEX "TrainerInvitation_userId_consumedAt_idx"
ON "TrainerInvitation"("userId", "consumedAt");

CREATE INDEX "TrainerInvitation_expiresAt_idx"
ON "TrainerInvitation"("expiresAt");

ALTER TABLE "TrainerInvitation"
ADD CONSTRAINT "TrainerInvitation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
