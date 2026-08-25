/**
 * Testler için `@/...` yol takma adını çözer.
 *
 * Node tsconfig'in `paths` ayarını okumaz; uygulama kodu ise her yerde `@/lib/...` kullanıyor.
 * Bu çözümleyici olmadan testlerin ya kaynakları göreli yolla import etmesi (kırılgan) ya da
 * bir paketleyici eklenmesi gerekirdi. `module.register` ile ~20 satır yeterli.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL(import.meta.dirname + "/"));
