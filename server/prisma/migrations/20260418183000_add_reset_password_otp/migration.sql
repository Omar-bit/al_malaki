CREATE TABLE `ResetPasswordOtp` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `otpHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `attemptsRemaining` INTEGER NOT NULL DEFAULT 5,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ResetPasswordOtp_email_key`(`email`),
  UNIQUE INDEX `ResetPasswordOtp_userId_key`(`userId`),
  INDEX `ResetPasswordOtp_email_expiresAt_idx`(`email`, `expiresAt`),
  INDEX `ResetPasswordOtp_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ResetPasswordOtp`
  ADD CONSTRAINT `ResetPasswordOtp_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
