import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const existing = await prisma.availabilityRule.count();
if (existing > 0) {
  console.log(`AvailabilityRule zaten dolu (${existing} kayıt) — seed atlandı.`);
  await prisma.$disconnect();
  process.exit(0);
}

// Pazartesi(0)–Cuma(4): 09:00–18:00, Cumartesi(5)/Pazar(6): kapalı.
const rules = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: 45,
  bufferMinutes: 15,
  isActive: weekday < 5,
}));

await prisma.availabilityRule.createMany({ data: rules });
console.log(`AvailabilityRule seed edildi: ${rules.length} kayıt (Pzt–Cum aktif, 45dk/15dk).`);
await prisma.$disconnect();
