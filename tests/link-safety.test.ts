import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hasLinkableOccurrence, linkifyFirstFreeOccurrence } from "@/lib/ai/link-safety";

describe("hasLinkableOccurrence — sunucu tarafı öneri süzgeci", () => {
  test("bağlantısız düz metinde ifade varsa true", () => {
    assert.equal(hasLinkableOccurrence("Ticaret Hukuku ile ilgili bilgi.", "Ticaret Hukuku"), true);
  });

  test("ifade YALNIZCA mevcut bir bağlantının içinde geçiyorsa false — asıl kusur buydu", () => {
    const body = "İş yeri kiralarında [Ticaret Hukuku](/tr/calisma-alanlari/ticaret-hukuku) devreye girer.";
    assert.equal(hasLinkableOccurrence(body, "Ticaret Hukuku"), false);
  });

  test("ifade hem bağlantı içinde hem dışında geçiyorsa true (dışarıdaki geçiş yeterli)", () => {
    const body = "Ticaret Hukuku önemlidir. Ayrıca [Ticaret Hukuku](/yol) sayfamıza bakın.";
    assert.equal(hasLinkableOccurrence(body, "Ticaret Hukuku"), true);
  });

  test("boş ifade her zaman false", () => {
    assert.equal(hasLinkableOccurrence("herhangi bir metin", ""), false);
  });

  test("gövdede hiç geçmeyen ifade false", () => {
    assert.equal(hasLinkableOccurrence("alakasız metin", "Ticaret Hukuku"), false);
  });
});

describe("linkifyFirstFreeOccurrence — istemci tarafı uygulama", () => {
  test("düz metindeki ifadeyi bağlantıya çevirir", () => {
    const next = linkifyFirstFreeOccurrence("Ticaret Hukuku önemlidir.", "Ticaret Hukuku", "/yol");
    assert.equal(next, "[Ticaret Hukuku](/yol) önemlidir.");
  });

  test("ifade zaten bağlantı içindeyse ve BAŞKA geçişi yoksa null döner — asıl kusur buydu", () => {
    const body = "İş yeri kiralarında [Ticaret Hukuku](/tr/calisma-alanlari/ticaret-hukuku) devreye girer.";
    assert.equal(linkifyFirstFreeOccurrence(body, "Ticaret Hukuku", "/tr/calisma-alanlari/ticaret-hukuku"), null);
  });

  test("iç içe bağlantı ASLA üretilmez — eski .replace() davranışıyla karşılaştırma", () => {
    const body = "İş yeri kiralarında [Ticaret Hukuku](/yol) devreye girer.";
    const buggyOldBehavior = body.replace("Ticaret Hukuku", "[Ticaret Hukuku](/yol)");
    assert.match(buggyOldBehavior, /\[\[Ticaret Hukuku\]/, "eski davranış gerçekten iç içe bağlantı üretiyormuş");

    const fixed = linkifyFirstFreeOccurrence(body, "Ticaret Hukuku", "/yol");
    assert.equal(fixed, null, "düzeltilmiş sürüm bağlantı DIŞINDA geçiş bulamayınca uygulamayı reddeder");
  });

  test("ifade hem bağlantı içinde hem dışında geçiyorsa DIŞARIDAKİ geçişi hedefler", () => {
    const body = "[Ticaret Hukuku](/eski-yol) sayfasına ek olarak Ticaret Hukuku burada da geçiyor.";
    const next = linkifyFirstFreeOccurrence(body, "Ticaret Hukuku", "/yeni-yol");
    assert.equal(
      next,
      "[Ticaret Hukuku](/eski-yol) sayfasına ek olarak [Ticaret Hukuku](/yeni-yol) burada da geçiyor.",
    );
  });

  test("ifade gövdede hiç yoksa null", () => {
    assert.equal(linkifyFirstFreeOccurrence("alakasız metin", "Ticaret Hukuku", "/yol"), null);
  });

  test("boş ifade null", () => {
    assert.equal(linkifyFirstFreeOccurrence("herhangi bir metin", "", "/yol"), null);
  });

  test("birden fazla mevcut bağlantı arasında doğru boşluğu bulur", () => {
    const body = "[A](/a) düz metin B burada [C](/c)";
    const next = linkifyFirstFreeOccurrence(body, "düz metin B", "/b");
    assert.equal(next, "[A](/a) [düz metin B](/b) burada [C](/c)");
  });
});
