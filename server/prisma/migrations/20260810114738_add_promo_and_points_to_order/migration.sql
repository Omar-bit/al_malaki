-- AlterTable
ALTER TABLE `order` ADD COLUMN `discount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `pointsUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `promoCodeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_promoCodeId_idx` ON `Order`(`promoCodeId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_promoCodeId_fkey` FOREIGN KEY (`promoCodeId`) REFERENCES `PromoCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
