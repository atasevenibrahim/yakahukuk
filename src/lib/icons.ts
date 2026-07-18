import {
  Heart,
  Gavel,
  Lightbulb,
  Globe,
  Landmark,
  TrendingDown,
  Layers,
  HeartPulse,
  Umbrella,
  Briefcase,
  ShoppingBag,
  Receipt,
  Lock,
  Ruler,
  Eye,
  Clock,
  Feather,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Search,
  Phone,
  type LucideIcon,
} from "lucide-react";

/**
 * Sitedeki TÜM ikonlar buradan gelir (lucide-react). Yeni bir ikon gerektiğinde
 * yalnızca burada yeni bir anahtar eklenir; bileşenler ham `lucide-react`
 * import etmez, `AppIcon` üzerinden bu kayda erişir.
 */
export const icons = {
  // Çalışma alanları
  heart: Heart,
  gavel: Gavel,
  lightbulb: Lightbulb,
  globe: Globe,
  landmark: Landmark,
  trendingDown: TrendingDown,
  layers: Layers,
  heartPulse: HeartPulse,
  umbrella: Umbrella,
  briefcase: Briefcase,
  shoppingBag: ShoppingBag,
  receipt: Receipt,
  // Değerler
  lock: Lock,
  ruler: Ruler,
  eye: Eye,
  clock: Clock,
  feather: Feather,
  shieldCheck: ShieldCheck,
  // Arayüz
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  star: Star,
  message: MessageCircle,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  externalLink: ArrowUpRight,
  check: Check,
  search: Search,
  phone: Phone,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
