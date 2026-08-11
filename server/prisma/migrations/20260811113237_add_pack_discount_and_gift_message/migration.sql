-- AlterTable
ALTER TABLE `order` ADD COLUMN `giftMessage` TEXT NULL,
    ADD COLUMN `packDiscount` DOUBLE NOT NULL DEFAULT 0;
