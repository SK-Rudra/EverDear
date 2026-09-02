-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('MESSAGE_PUBLISHED', 'MESSAGE_HIDDEN', 'MESSAGE_RESTORED', 'MESSAGE_REMOVED', 'REPORT_REVIEWED', 'REPORT_DISMISSED', 'REPORT_ACTIONED');

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "message_id" UUID,
    "report_id" UUID,
    "action" "ModerationActionType" NOT NULL,
    "note" VARCHAR(500),
    "previous_state" VARCHAR(40),
    "next_state" VARCHAR(40),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_logs_actor_user_id_created_at_idx" ON "moderation_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_logs_message_id_created_at_idx" ON "moderation_logs"("message_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_logs_report_id_created_at_idx" ON "moderation_logs"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_logs_action_created_at_idx" ON "moderation_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
