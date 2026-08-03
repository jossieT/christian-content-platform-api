-- AlterTable: Make email and passwordHash optional on users, add phoneNumber and isPhoneVerified
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: unique phoneNumber index on users
CREATE UNIQUE INDEX IF NOT EXISTS "users_phoneNumber_key" ON "users"("phoneNumber");
CREATE INDEX IF NOT EXISTS "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateTable: otp_verifications
CREATE TABLE IF NOT EXISTS "otp_verifications" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: otp_verifications
CREATE INDEX IF NOT EXISTS "otp_verifications_phoneNumber_isUsed_expiresAt_idx" ON "otp_verifications"("phoneNumber", "isUsed", "expiresAt");

-- CreateTable: auth_audit_logs
CREATE TABLE IF NOT EXISTS "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "identifier" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: auth_audit_logs
CREATE INDEX IF NOT EXISTS "auth_audit_logs_userId_idx" ON "auth_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "auth_audit_logs_provider_event_idx" ON "auth_audit_logs"("provider", "event");
