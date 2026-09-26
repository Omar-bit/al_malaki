-- CreateTable
CREATE TABLE `ContentMedia` (
    `id` VARCHAR(191) NOT NULL,
    `slot` VARCHAR(191) NOT NULL,
    `type` ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
    `filename` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `focalX` DOUBLE NOT NULL DEFAULT 50,
    `focalY` DOUBLE NOT NULL DEFAULT 50,
    `zoom` DOUBLE NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentMedia_slot_position_idx`(`slot`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
