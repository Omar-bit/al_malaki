-- AlterTable
ALTER TABLE `RegisterOtp`
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `RegisterOtp_userId_key` ON `RegisterOtp`(`userId`);

-- AddForeignKey
ALTER TABLE `RegisterOtp`
    ADD CONSTRAINT `RegisterOtp_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
