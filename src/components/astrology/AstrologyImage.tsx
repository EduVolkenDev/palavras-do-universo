"use client";

import Image from "next/image";
import type { ComponentProps } from "react";
import { resolveAstrologyImageSource } from "@/lib/astrology/image-source";

type AstrologyImageProps = Omit<ComponentProps<typeof Image>, "src"> & {
  src: string | null | undefined;
};

export default function AstrologyImage({ src, alt, ...props }: AstrologyImageProps) {
  const safeSource = resolveAstrologyImageSource(src);
  if (!safeSource) return null;

  return <Image {...props} src={safeSource} alt={alt} />;
}
