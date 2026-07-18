import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

// Prisma 7: bağlantı URL'i artık schema.prisma'da değil, burada tanımlanır.
// `env()` yardımcısı DATABASE_URL yoksa config yüklenirken anında fırlatıyor —
// bu da `prisma generate`'i (DB bağlantısı gerektirmediği halde) DATABASE_URL'e
// bağımlı kılıyor. datasource @prisma/config'te opsiyonel (yalnızca migrate/db push
// için gerekli), bu yüzden düz process.env okuması kullanılır: generate her zaman
// çalışır, gerçek bağlantı gerektiren komutlar DATABASE_URL yoksa kendi (daha
// anlaşılır) hatasını verir.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
