import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  canPersistChat,
  chatStorageKey,
  loadChat,
  migrateChatScope,
} from "@/lib/editor/chat-storage";

/** Tarayıcı localStorage'ının yerine geçen sahte. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    dump: () => Object.fromEntries(data),
  };
}

describe("chatStorageKey", () => {
  test("kapsamı önekler", () => {
    assert.equal(chatStorageKey("abc-TR"), "yaka:chat:v2:abc-TR");
  });

  test("v1 anahtarlarıyla çakışmaz — kirlenmiş eski kayıtlar okunmasın diye", () => {
    assert.notEqual(chatStorageKey("abc-TR"), "yaka:chat:abc-TR");
  });

  test("makale ve dil ayrı kapsam üretir", () => {
    assert.notEqual(chatStorageKey("abc-TR"), chatStorageKey("abc-EN"));
  });
});

describe("loadChat — kayıt yoksa BOŞ döner", () => {
  const store = fakeStorage({
    "yaka:chat:v2:A-TR": JSON.stringify([{ id: "1", role: "user", text: "A'nın mesajı" }]),
  });

  test("var olan geçmişi okur", () => {
    assert.equal(loadChat(store, chatStorageKey("A-TR")).length, 1);
  });

  test("kaydı olmayan makale için boş dizi — hatanın birinci yarısı buydu", () => {
    assert.deepEqual(loadChat(store, chatStorageKey("B-TR")), []);
  });

  test("bozuk JSON çökmez", () => {
    assert.deepEqual(loadChat(fakeStorage({ k: "{bozuk" }), "k"), []);
  });

  test("dizi olmayan kayıt reddedilir", () => {
    assert.deepEqual(loadChat(fakeStorage({ k: '{"a":1}' }), "k"), []);
  });
});

describe("canPersistChat — yazma kapısı", () => {
  test("okuma bitmeden yazılmaz (hatanın ikinci yarısı)", () => {
    assert.equal(canPersistChat("yaka:chat:v2:A-TR", "yaka:chat:v2:B-TR", true), false);
  });

  test("okuma bitince yazılır", () => {
    assert.equal(canPersistChat("yaka:chat:v2:B-TR", "yaka:chat:v2:B-TR", true), true);
  });

  test("ilk mount'ta yazılmaz", () => {
    assert.equal(canPersistChat(null, "yaka:chat:v2:B-TR", true), false);
  });

  test("persist=false iken hiç yazılmaz (sihirbaz)", () => {
    assert.equal(canPersistChat("k", "k", false), false);
  });
});

describe("migrateChatScope", () => {
  test("kaydı yeni kapsama taşır ve eskisini siler", () => {
    const s = fakeStorage({
      "yaka:chat:v2:yeni-TR": JSON.stringify([{ id: "1", role: "user", text: "taslak" }]),
    });
    assert.equal(migrateChatScope(s, "yeni-TR", "cuid123-TR"), true);
    assert.equal(loadChat(s, chatStorageKey("cuid123-TR")).length, 1);
    assert.equal(s.getItem(chatStorageKey("yeni-TR")), null);
  });

  test("taşınacak kayıt yoksa false döner", () => {
    assert.equal(migrateChatScope(fakeStorage(), "yeni-EN", "cuid123-EN"), false);
  });
});

describe("uçtan uca: makaleler arası geçiş", () => {
  /** ChatPanel'in effect sırasını modeller: okuma → (kullanıcı yazar) → kaydetme. */
  function visit(
    storage: ReturnType<typeof fakeStorage>,
    scope: string,
    append?: string,
  ): { id: string; role: string; text: string }[] {
    const key = chatStorageKey(scope);
    let messages = loadChat<{ id: string; role: string; text: string }>(storage, key);
    const loadedKey = key;
    if (append) messages = [...messages, { id: append, role: "user", text: append }];
    if (canPersistChat(loadedKey, key, true)) storage.setItem(key, JSON.stringify(messages));
    return messages;
  }

  test("B'ye geçince ekran boşalır, A'nın metni B'ye yazılmaz, A'ya dönünce geri gelir", () => {
    const s = fakeStorage();
    visit(s, "A-TR", "A-mesaj");

    assert.deepEqual(visit(s, "B-TR"), [], "B temiz açılmalı");
    assert.ok(
      !JSON.stringify(s.dump()["yaka:chat:v2:B-TR"] ?? "").includes("A-mesaj"),
      "B'nin kaydı A'nın mesajıyla kirlenmemeli",
    );

    const backOnA = visit(s, "A-TR");
    assert.equal(backOnA.length, 1);
    assert.equal(backOnA[0].text, "A-mesaj");
  });
});
