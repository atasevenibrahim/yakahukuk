import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 "no-rust-engine": PrismaClient artık bir driver adapter gerektiriyor.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Next.js dev modunda hot-reload'da yeni bağlantı açılmasını önlemek için
// global tekil örnek (Prisma'nın önerdiği desen).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
