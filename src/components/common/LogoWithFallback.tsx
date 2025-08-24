// app/(dashboard)/components/common/LogoConFallback.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  unoptimized?: boolean;
};

const PLACEHOLDER = "/sinimagen.png"; // 👈 archivo dentro de /public

export function LogoConFallback({
  src,
  alt = "Logo",
  width = 28,
  height = 28,
  className = "h-7 w-7 rounded-full object-contain bg-muted",
  unoptimized,
}: Props) {
  const initial = (src && src.trim() !== "") ? src : PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState<string>(initial);

  const handleError = () => {
    // evitar loop si ya estamos usando el placeholder
    if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      loading="lazy"
      unoptimized={unoptimized}
    />
  );
}
