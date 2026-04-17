-- AlterTable
ALTER TABLE `registerotp` MODIFY `attemptsRemaining` INTEGER NOT NULL DEFAULT 5;

-- CreateIndex
CREATE INDEX `RegisterOtp_userId_idx` ON `RegisterOtp`(`userId`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);
