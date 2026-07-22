-- CreateTable
CREATE TABLE `InfluencerTrackingLink` (
    `id` VARCHAR(191) NOT NULL,
    `influencerName` VARCHAR(191) NOT NULL,
    `influencerHandle` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `destinationPath` VARCHAR(191) NOT NULL DEFAULT '/',
    `notes` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `lastClickedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InfluencerTrackingLink_code_key`(`code`),
    INDEX `InfluencerTrackingLink_code_idx`(`code`),
    INDEX `InfluencerTrackingLink_status_idx`(`status`),
    INDEX `InfluencerTrackingLink_influencerName_idx`(`influencerName`),
    INDEX `InfluencerTrackingLink_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `influencerTrackingLinkId` VARCHAR(191) NULL,
    ADD COLUMN `influencerTrackedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `influencerTrackingLinkId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_influencerTrackingLinkId_idx` ON `User`(`influencerTrackingLinkId`);

-- CreateIndex
CREATE INDEX `Order_influencerTrackingLinkId_idx` ON `Order`(`influencerTrackingLinkId`);

-- AddForeignKey
ALTER TABLE `InfluencerTrackingLink` ADD CONSTRAINT `InfluencerTrackingLink_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_influencerTrackingLinkId_fkey` FOREIGN KEY (`influencerTrackingLinkId`) REFERENCES `InfluencerTrackingLink`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_influencerTrackingLinkId_fkey` FOREIGN KEY (`influencerTrackingLinkId`) REFERENCES `InfluencerTrackingLink`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
