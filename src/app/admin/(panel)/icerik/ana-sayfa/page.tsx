import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getHomeHero } from "@/content/hero";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { HeroBrowser } from "./HeroBrowser";

export const metadata: Metadata = { title: "Ana Sayfa / Hero" };

export default async function IcerikAnaSayfaPage() {
  const [user, hero] = await Promise.all([getSessionUser(), getHomeHero()]);

  return (
    <>
      <AdminTopbar eyebrow="PANEL / İÇERİK" title="Ana Sayfa / Hero" userName={user?.name ?? "Yönetici"} />
      <HeroBrowser hero={hero} />
    </>
  );
}
