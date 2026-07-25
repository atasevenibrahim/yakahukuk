"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "../../../public/yaka-logo.png";
import { logout } from "@/app/admin/actions";

type NavItem =
  | { type: "link"; label: string; href: string; badge?: number }
  | { type: "section"; label: string }
  | { type: "disabled"; label: string };

const CONTENT_LINKS: { label: string; href: string }[] = [
  { label: "Çalışma Alanları", href: "/admin/icerik/calisma-alanlari" },
  { label: "Ekip", href: "/admin/icerik/ekip" },
  { label: "Makaleler", href: "/admin/makaleler" },
  { label: "Basında Biz", href: "/admin/icerik/basinda-biz" },
  { label: "Yorumlar", href: "/admin/icerik/yorumlar" },
  { label: "SSS", href: "/admin/icerik/sss" },
  { label: "Yasal Metinler", href: "/admin/icerik/yasal-metinler" },
  { label: "Ana Sayfa / Hero", href: "/admin/icerik/ana-sayfa" },
  { label: "Medya", href: "/admin/medya" },
];


export function AdminSidebar({
  newMessageCount,
  pendingAppointmentCount,
}: {
  newMessageCount: number;
  pendingAppointmentCount: number;
}) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { type: "link", label: "Dashboard", href: "/admin" },
    {
      type: "link",
      label: "Gelen Talepler",
      href: "/admin/gelen-talepler",
      badge: newMessageCount || undefined,
    },
    {
      type: "link",
      label: "Randevular",
      href: "/admin/randevular",
      badge: pendingAppointmentCount || undefined,
    },
    { type: "section", label: "İÇERİK" },
    ...CONTENT_LINKS.map((item): NavItem => ({ type: "link", label: item.label, href: item.href })),
    { type: "section", label: "SİSTEM" },
    { type: "link", label: "Ayarlar", href: "/admin/ayarlar" },
    { type: "link", label: "Profil", href: "/admin/profil" },
  ];

  return (
    <div className="sticky top-0 flex h-screen w-[248px] flex-none flex-col overflow-y-auto bg-ink-deep">
      <Link
        href="/admin"
        className="flex items-center gap-2.5 border-b border-cream/10 px-[22px] py-5"
      >
        <Image
          src={logo}
          alt="YAKA logo"
          width={34}
          height={34}
          className="object-contain brightness-0 invert-[0.95]"
        />
        <span className="flex flex-col gap-px">
          <span className="font-serif text-[17px] font-semibold leading-none tracking-[2px] text-cream">
            YAKA
          </span>
          <span className="font-mono text-[7.5px] tracking-[2px] text-on-dark-muted">
            YÖNETİM PANELİ
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item, i) => {
          if (item.type === "section") {
            return (
              <span
                key={i}
                className="px-3 pb-1.5 pt-4 font-mono text-[9.5px] tracking-[2.5px] text-muted"
              >
                {item.label}
              </span>
            );
          }
          if (item.type === "disabled") {
            return (
              <span
                key={i}
                className="flex cursor-not-allowed items-center gap-3 rounded px-3 py-2.5 text-[13.5px] font-medium text-on-dark-muted/40"
              >
                <span className="block h-3 w-3 flex-none rotate-45 rounded-full border-[1.5px] border-on-dark-muted/30" />
                {item.label}
              </span>
            );
          }
          const active = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "border-l-2 border-gold bg-cream/[0.08] text-cream"
                  : "border-l-2 border-transparent text-on-dark-muted hover:bg-cream/[0.06] hover:text-cream"
              }`}
            >
              <span
                className={`block h-3 w-3 flex-none border-[1.5px] ${
                  active ? "rounded-none border-gold" : "rounded-full border-muted"
                }`}
                style={{ transform: "rotate(45deg)" }}
              />
              {item.label}
              {!!item.badge && (
                <span className="ml-auto rounded-full bg-gold px-2 py-0.5 font-mono text-[10.5px] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 border-t border-cream/10 px-6 py-4 text-[13px] text-on-dark-muted transition-colors hover:text-cream"
        >
          ← Çıkış yap
        </button>
      </form>
    </div>
  );
}
