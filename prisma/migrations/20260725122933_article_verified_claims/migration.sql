-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "verifiedClaims" TEXT[] DEFAULT ARRAY[]::TEXT[];
