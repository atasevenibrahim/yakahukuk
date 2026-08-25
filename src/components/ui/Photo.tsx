import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/cn";

/**
 * Sayfa içi fotoğraf çerçevesi.
 *
 * API'si bilerek `PlaceholderImage` ile aynı (`className` ile ölçü veriliyor): bir yer
 * tutucu gerçek fotoğrafla değiştirilirken çağrı yerinde tek satır değişiyor ve çerçeve
 * görsel dili bozulmuyor.
 */
export function Photo({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  /** Statik import — Next böylece ölçüyü bilir ve blur placeholder üretir. */
  src: StaticImageData;
  alt: string;
  className?: string;
  /**
   * ZORUNLU. Verilmezse Next görselin tam ekran genişlikte olduğunu varsayıp mobilde
   * gereksiz büyük dosya indiriyor (aynı tuzak ArticleCover'da da not düşülmüş).
   */
  sizes: string;
  /** Yalnızca ekranın ilk açılışında görünen görsel için — ana sayfa hero'su gibi. */
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-md border border-line bg-cream", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        placeholder="blur"
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
