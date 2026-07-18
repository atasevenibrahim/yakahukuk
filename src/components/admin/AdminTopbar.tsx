"use client";

import { useState } from "react";
import Link from "next/link";

export function AdminTopbar({
  eyebrow = "PANEL",
  title,
  userName,
  notificationCount = 0,
}: {
  eyebrow?: string;
  title: string;
  userName: string;
  notificationCount?: number;
}) {
  const [notifications, setNotifications] = useState(notificationCount);
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="sticky top-0 z-50 flex items-center gap-5 border-b border-line bg-cream/95 px-8 py-3.5 backdrop-blur-sm">
      <div>
        <span className="font-mono text-[10.5px] tracking-[2px] text-muted">{eyebrow}</span>
        <h1 className="mt-0.5 font-serif text-[23px] font-semibold">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-[18px]">
        <span className="rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[11.5px] tracking-[1px] text-muted">
          TR · EN
        </span>
        <button
          type="button"
          onClick={() => setNotifications(0)}
          aria-label="Bildirimler"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-[15px] transition-colors hover:border-gold"
        >
          🔔
          {notifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 font-mono text-[10px] text-white">
              {notifications}
            </span>
          )}
        </button>
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink text-[13px] font-bold text-cream">
            {initials || "AD"}
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-[13px] font-semibold leading-none">{userName}</span>
            <span className="font-mono text-[9.5px] tracking-[1.5px] text-gold">SÜPER ADMİN</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
