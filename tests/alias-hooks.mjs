import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * next-intl'in ESM derlemesi `next/navigation`ı import ediyor ve bu yalnızca bir paketleyici
 * altında çözülüyor. Bu zincire bağlı modüller testte sahteleriyle değiştiriliyor — test
 * edilen fonksiyonlar (ör. `collectionSchema`) onlardan yalnızca sabitleri kullanıyor.
 */
const STUBS = new Map([["@/lib/metadata", "tests/stubs/metadata.ts"]]);

/**
 * Uygulama kodu import'ları uzantısız yazıyor (Next paketleyicisi buna izin veriyor);
 * Node ESM ise açık uzantı istiyor. Aradaki farkı burada kapatıyoruz.
 */
function withExtension(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS.get(specifier);
  if (stub) {
    return { url: pathToFileURL(path.join(ROOT, stub)).href, shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const target = withExtension(path.join(ROOT, "src", specifier.slice(2)));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }

  // Göreli, uzantısız TypeScript import'ları (ör. `./prisma`)
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const target = withExtension(
      path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier),
    );
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
