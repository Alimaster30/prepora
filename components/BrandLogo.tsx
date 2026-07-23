import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "desktop" | "mobile" | "responsive";
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export default function BrandLogo({
  variant = "responsive",
  priority = false,
  className,
  imageClassName,
}: BrandLogoProps) {
  return (
    <span
      role="img"
      aria-label="Prepora"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {variant !== "mobile" && (
        <Image
          src="/prepora-logo.png"
          alt=""
          width={176}
          height={62}
          priority={priority}
          sizes={
            variant === "responsive"
              ? "(min-width: 640px) 144px, 0px"
              : "144px"
          }
          className={cn(
            "h-8 w-auto object-contain",
            variant === "responsive" && "hidden sm:block",
            imageClassName
          )}
        />
      )}
      {variant !== "desktop" && (
        <Image
          src="/prepora-mobile-logo.png"
          alt=""
          width={55}
          height={62}
          priority={priority}
          sizes={
            variant === "responsive"
              ? "(max-width: 639px) 36px, 0px"
              : "36px"
          }
          className={cn(
            "h-9 w-auto object-contain",
            variant === "responsive" && "sm:hidden",
            imageClassName
          )}
        />
      )}
    </span>
  );
}
