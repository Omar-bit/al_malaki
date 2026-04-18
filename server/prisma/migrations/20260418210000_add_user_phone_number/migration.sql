-- Add optional phone number storage for user profiles.
ALTER TABLE `User`
ADD COLUMN `phoneNumber` VARCHAR(20) NULL;