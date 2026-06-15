-- AlterTable
ALTER TABLE `User`
  ADD COLUMN `birthDate` DATETIME(3) NULL,
  ADD COLUMN `profilePicture` VARCHAR(191) NULL;
