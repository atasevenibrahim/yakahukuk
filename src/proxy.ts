import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16'da "middleware" → "proxy" konvansiyonu. next-intl locale
// tespiti/yönlendirmesini burada çalıştırır.
export default createMiddleware(routing);

export const config = {
  // api, next içi kaynaklar ve dosya uzantılı istekler hariç her yol.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
