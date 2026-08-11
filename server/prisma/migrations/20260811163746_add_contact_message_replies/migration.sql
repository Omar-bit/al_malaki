-- CreateTable
CREATE TABLE `ContactMessageReply` (
    `id` VARCHAR(191) NOT NULL,
    `contactMessageId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorRole` ENUM('CUSTOMER', 'ADMIN', 'VENDOR') NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessageReply_contactMessageId_createdAt_idx`(`contactMessageId`, `createdAt`),
    INDEX `ContactMessageReply_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContactMessageReply` ADD CONSTRAINT `ContactMessageReply_contactMessageId_fkey` FOREIGN KEY (`contactMessageId`) REFERENCES `ContactMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactMessageReply` ADD CONSTRAINT `ContactMessageReply_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
