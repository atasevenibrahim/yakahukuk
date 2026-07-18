import { icons, type IconName } from "@/lib/icons";

/** Sitedeki tüm ikonlar için tek giriş noktası — bkz. `src/lib/icons.ts`. */
export function AppIcon({
  name,
  className,
  size = 20,
  strokeWidth = 1.75,
  fill,
}: {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
}) {
  const Icon = icons[name];
  return (
    <Icon
      aria-hidden
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      fill={fill}
    />
  );
}
