-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'VENDOR') NOT NULL;

-- CreateTable
CREATE TABLE `UserInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'ADMIN', 'VENDOR') NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserInvitation_email_key`(`email`),
    UNIQUE INDEX `UserInvitation_tokenHash_key`(`tokenHash`),
    INDEX `UserInvitation_email_expiresAt_idx`(`email`, `expiresAt`),
    INDEX `UserInvitation_invitedById_idx`(`invitedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserInvitation` ADD CONSTRAINT `UserInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
