-- CreateTable
CREATE TABLE `Campaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `titleTh` VARCHAR(300) NOT NULL,
    `titleEn` VARCHAR(300) NOT NULL,
    `summaryTh` TEXT NOT NULL,
    `summaryEn` TEXT NOT NULL,
    `statementTh` TEXT NOT NULL,
    `statementEn` TEXT NOT NULL,
    `officialUrl` VARCHAR(500) NULL,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `closesAt` DATETIME(3) NULL,
    `showSigners` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Campaign_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Signature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(200) NOT NULL,
    `country` CHAR(2) NOT NULL,
    `signaturePath` VARCHAR(300) NOT NULL,
    `showPublic` BOOLEAN NOT NULL DEFAULT false,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'th',
    `ipHash` VARCHAR(64) NULL,
    `userAgent` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Signature_campaignId_createdAt_idx`(`campaignId`, `createdAt`),
    INDEX `Signature_campaignId_country_idx`(`campaignId`, `country`),
    UNIQUE INDEX `Signature_campaignId_email_key`(`campaignId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Signature` ADD CONSTRAINT `Signature_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

