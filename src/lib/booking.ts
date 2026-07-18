import { prisma } from "./prisma";

const TZ = "Europe/Istanbul";

/** Verilen anın İstanbul takvim günü anahtarını ("YYYY-MM-DD") döner. */
function istanbulDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

/** 0=Pazartesi … 6=Pazar (İstanbul saatine göre). */
function istanbulWeekday(date: Date): number {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return order.indexOf(weekdayName);
}

function istanbulMinutesOfDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Number(map.hour) * 60 + Number(map.minute);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** date için "gün başlangıcı" temsili (saat/dakika önemsiz, yalnızca takvim günü). */
function dateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

/** O haftanın günü için kuralın ürettiği TÜM olası slot etiketleri (doluluktan bağımsız). */
function fullSlotGrid(rules: { startTime: string; endTime: string; slotMinutes: number; bufferMinutes: number }[]): string[] {
  const labels: string[] = [];
  for (const rule of rules) {
    const step = rule.slotMinutes + rule.bufferMinutes;
    const start = timeToMinutes(rule.startTime);
    const end = timeToMinutes(rule.endTime);
    for (let t = start; t + rule.slotMinutes <= end; t += step) {
      labels.push(minutesToTime(t));
    }
  }
  return labels.sort();
}

/**
 * Belirli bir günün slot durumunu üretir: `all` o gün için AvailabilityRule'un
 * ürettiği tam ızgara (dolu olsa da listede kalır — arayüzde "DOLU" gösterilir),
 * `available` gerçekten seçilebilir olanlar (BlockedDate, mevcut PENDING/CONFIRMED
 * randevular ve — bugünse — geçmiş saatler elenir).
 */
export async function getDaySlotInfo(
  date: Date,
): Promise<{ all: string[]; available: string[] }> {
  const dateKey = istanbulDateKey(date);
  const weekday = istanbulWeekday(date);

  const [rules, blocked, appointments] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { weekday, isActive: true } }),
    prisma.blockedDate.findFirst({ where: { date: dateFromKey(dateKey) } }),
    prisma.appointment.findMany({
      where: {
        date: dateFromKey(dateKey),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true },
    }),
  ]);

  const all = fullSlotGrid(rules);
  if (blocked || rules.length === 0) return { all, available: [] };

  const taken = new Set(appointments.map((a) => a.startTime));
  const now = new Date();
  const isToday = istanbulDateKey(now) === dateKey;
  const nowMinutes = istanbulMinutesOfDay(now);

  const available = all.filter((label) => {
    if (taken.has(label)) return false;
    if (isToday && timeToMinutes(label) <= nowMinutes) return false;
    return true;
  });

  return { all, available };
}

export async function getAvailableSlotsForDate(date: Date): Promise<string[]> {
  return (await getDaySlotInfo(date)).available;
}

export type DaySlots = { dateKey: string; date: Date; allSlots: string[]; slots: string[] };

/** Bugünden itibaren, hafta sonu dahil olası N takvim gününün müsaitlik durumu. */
export async function getUpcomingDaySlots(days = 5): Promise<DaySlots[]> {
  const results: DaySlots[] = [];
  const cursor = new Date();
  let added = 0;
  let guard = 0;
  while (added < days && guard < days * 4) {
    guard++;
    const dateKey = istanbulDateKey(cursor);
    const { all, available } = await getDaySlotInfo(cursor);
    // Hafta sonu ve kapalı günler de listede kalsın (boş slot olarak) — kullanıcı
    // görsün ama seçemesin; yalnızca AvailabilityRule'da tanımsız günler tamamen atlanır.
    results.push({ dateKey, date: dateFromKey(dateKey), allSlots: all, slots: available });
    added++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

/** Bir slotun hâlâ müsait olup olmadığını (submit anı çift kontrol) doğrular. */
export async function isSlotAvailable(date: Date, startTime: string): Promise<boolean> {
  const slots = await getAvailableSlotsForDate(date);
  return slots.includes(startTime);
}

/** AvailabilityRule'daki slotMinutes'a göre bitiş saatini hesaplar. */
export async function computeEndTime(date: Date, startTime: string): Promise<string> {
  const weekday = istanbulWeekday(date);
  const rule = await prisma.availabilityRule.findFirst({
    where: { weekday, isActive: true },
  });
  const duration = rule?.slotMinutes ?? 45;
  return minutesToTime(timeToMinutes(startTime) + duration);
}

export { istanbulDateKey, dateFromKey };
