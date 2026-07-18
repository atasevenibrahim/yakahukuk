import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16'da "middleware" → "proxy" konvansiyonu. next-intl locale
// tespiti/yönlendirmesini burada çalıştırır.
export default createMiddleware(routing);

export const config = {
  // api, next içi kaynaklar, dosya uzantılı istekler ve /admin (kendi ayrı
  // oturum/guard sistemi var, next-intl locale sistemine dahil değil) hariç her yol.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
