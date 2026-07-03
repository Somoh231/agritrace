import Image from "next/image";

import { cn } from "@/components/enterprise/cn";

export const MINISTRY_LOGO_ALT = "Liberia Ministry of Agriculture";

/** Official Ministry of Agriculture branding assets (public/logos/) */
export const MINISTRY_LOGO = {
  /** High-resolution combined national + MOA brand mark */
  brand: "/logos/moa-logo.jpeg",
  /** Compact PNG brand strip */
  brandPng: "/logos/liberia-moa-brand.png",
  /** Cropped MOA circular seal — sidebar & compact surfaces */
  seal: "/logos/moa-seal.jpeg",
} as const;

export type MinistryBrandLogoVariant = "seal" | "brand";

const SEAL_SIZES = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

export default function MinistryBrandLogo({
  variant = "seal",
  size = "md",
  className,
  imageClassName,
  priority = false,
}: {
  variant?: MinistryBrandLogoVariant;
  size?: keyof typeof SEAL_SIZES | number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const px = typeof size === "number" ? size : SEAL_SIZES[size];

  if (variant === "brand") {
    return (
      <span className={cn("relative block w-full max-w-[min(100%,320px)]", className)}>
        <Image
          src={MINISTRY_LOGO.brand}
          alt={MINISTRY_LOGO_ALT}
          width={681}
          height={293}
          className={cn("h-auto w-full object-contain", imageClassName)}
          priority={priority}
          sizes="(max-width: 640px) 260px, 320px"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-white/25",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={MINISTRY_LOGO.seal}
        alt={MINISTRY_LOGO_ALT}
        width={px}
        height={px}
        className={cn("h-full w-full object-contain p-0.5", imageClassName)}
        priority={priority}
      />
    </span>
  );
}
