import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale + localized-pathname farkında Link / navigasyon yardımcıları.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
