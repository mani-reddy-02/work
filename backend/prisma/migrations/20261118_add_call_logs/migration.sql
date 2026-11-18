-- ==============================================================================
-- Migration: Add CallLog model and Enums (CallDirection, CallStatus)
-- Target: Staging / Development PostgreSQL Database
-- ==============================================================================

-- 1. Pre-Migration Safety Checks: Detect existing incompatible tables or enums
DO $$ 
DECLARE
    tbl_exists boolean;
    enum_dir_exists boolean;
    enum_status_exists boolean;
    col_count integer;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'call_logs'
    ) INTO tbl_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'CallDirection'
    ) INTO enum_dir_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'CallStatus'
    ) INTO enum_status_exists;

    -- If call_logs table exists, verify column count compatibility before proceeding
    IF tbl_exists THEN
        SELECT count(*) INTO col_count 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'call_logs';
        
        IF col_count != 18 THEN
            RAISE EXCEPTION 'PRE-MIGRATION ABORT: Table call_logs already exists with incompatible schema (% columns, expected 18).', col_count;
        END IF;
    END IF;

    -- If CallDirection exists, verify values
    IF enum_dir_exists THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid 
            WHERE t.typname = 'CallDirection' AND e.enumlabel = 'PATIENT_TO_HOSPITAL'
        ) THEN
            RAISE EXCEPTION 'PRE-MIGRATION ABORT: Type CallDirection exists with incompatible values.';
        END IF;
    END IF;

    -- If CallStatus exists, verify values
    IF enum_status_exists THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid 
            WHERE t.typname = 'CallStatus' AND e.enumlabel = 'INITIATED'
        ) THEN
            RAISE EXCEPTION 'PRE-MIGRATION ABORT: Type CallStatus exists with incompatible values.';
        END IF;
    END IF;
END $$;

-- 2. CreateEnum: CallDirection
DO $$ BEGIN
    CREATE TYPE "CallDirection" AS ENUM ('PATIENT_TO_HOSPITAL', 'HOSPITAL_TO_PATIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CreateEnum: CallStatus
DO $$ BEGIN
    CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'QUEUED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'BUSY', 'NO_ANSWER', 'FAILED', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. CreateTable: call_logs
CREATE TABLE IF NOT EXISTS "call_logs" (
    "id" TEXT NOT NULL,
    "callSid" TEXT,
    "bookingId" TEXT,
    "bookingType" TEXT NOT NULL DEFAULT 'OP',
    "initiatedById" TEXT NOT NULL,
    "callerRole" "Role" NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "virtualNumber" TEXT NOT NULL DEFAULT '08047290980',
    "direction" "CallDirection" NOT NULL DEFAULT 'PATIENT_TO_HOSPITAL',
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "price" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- 5. Safe Indices for High-Throughput Lookup
CREATE UNIQUE INDEX IF NOT EXISTS "call_logs_callSid_key" ON "call_logs"("callSid");
CREATE INDEX IF NOT EXISTS "call_logs_bookingId_idx" ON "call_logs"("bookingId");
CREATE INDEX IF NOT EXISTS "call_logs_callSid_idx" ON "call_logs"("callSid");
CREATE INDEX IF NOT EXISTS "call_logs_initiatedById_idx" ON "call_logs"("initiatedById");
CREATE INDEX IF NOT EXISTS "call_logs_createdAt_idx" ON "call_logs"("createdAt");

-- 6. Supabase Row Level Security (RLS)
-- Enables strict RLS to ensure direct Supabase PostgREST clients cannot query telephony audit records.
-- All access is mediated securely through the backend authorized connection.
ALTER TABLE "call_logs" ENABLE ROW LEVEL SECURITY;
