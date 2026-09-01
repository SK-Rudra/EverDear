-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('LOVED', 'FRIEND', 'FAMILY');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PublicMessageStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REMOVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATEFUL_CONTENT', 'SEXUAL_CONTENT', 'PERSONAL_INFORMATION', 'SELF_HARM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(512),
    "ip_hash" VARCHAR(128),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LetterType" NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(160),
    "recipient_name" VARCHAR(120) NOT NULL,
    "sender_name" VARCHAR(120) NOT NULL,
    "content" JSONB NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "first_viewed_at" TIMESTAMPTZ(3),
    "last_viewed_at" TIMESTAMPTZ(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_attachments" (
    "id" UUID NOT NULL,
    "letter_id" UUID NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "storage_key" VARCHAR(500) NOT NULL,
    "thumbnail_key" VARCHAR(500),
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "letter_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_links" (
    "id" UUID NOT NULL,
    "letter_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "token_prefix" VARCHAR(16) NOT NULL,
    "expires_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "last_accessed_at" TIMESTAMPTZ(3),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "letter_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_messages" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "content" VARCHAR(500) NOT NULL,
    "display_location" VARCHAR(80),
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "author_hash" VARCHAR(128),
    "status" "PublicMessageStatus" NOT NULL DEFAULT 'PENDING',
    "published_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "public_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "reporter_user_id" UUID,
    "reporter_hash" VARCHAR(128),
    "reason" "ReportReason" NOT NULL,
    "details" VARCHAR(500),
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "letters_user_id_status_updated_at_idx" ON "letters"("user_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "letters_status_expires_at_idx" ON "letters"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "letter_attachments_storage_key_key" ON "letter_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "letter_attachments_letter_id_sort_order_idx" ON "letter_attachments"("letter_id", "sort_order");

-- CreateIndex
CREATE INDEX "letter_attachments_letter_id_type_status_idx" ON "letter_attachments"("letter_id", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "letter_links_letter_id_key" ON "letter_links"("letter_id");

-- CreateIndex
CREATE UNIQUE INDEX "letter_links_token_hash_key" ON "letter_links"("token_hash");

-- CreateIndex
CREATE INDEX "letter_links_expires_at_idx" ON "letter_links"("expires_at");

-- CreateIndex
CREATE INDEX "public_messages_status_published_at_idx" ON "public_messages"("status", "published_at");

-- CreateIndex
CREATE INDEX "public_messages_user_id_created_at_idx" ON "public_messages"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "public_messages_expires_at_idx" ON "public_messages"("expires_at");

-- CreateIndex
CREATE INDEX "reports_message_id_status_idx" ON "reports"("message_id", "status");

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reports_message_id_reporter_user_id_key" ON "reports"("message_id", "reporter_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_message_id_reporter_hash_key" ON "reports"("message_id", "reporter_hash");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_attachments" ADD CONSTRAINT "letter_attachments_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_links" ADD CONSTRAINT "letter_links_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_messages" ADD CONSTRAINT "public_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
