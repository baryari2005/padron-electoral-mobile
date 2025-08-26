"use client";
import { Cargando } from "@/components/ui/upload";
import Image from "next/image";
import { Props } from "./types/types";

export function CommonLoader( props: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-secondary text-muted-foreground">
      <div className="relative w-[60px] h-[60px] mb-2">
        <Image
          src={props.logo}
          alt={props.alternativeText}
          sizes = "180px"
          fill
          className="object-contain dark:hidden rounded-lg"
          priority
        />
        <Image
          src={props.alternativeLogo}
          alt={props.alternativeText}
          sizes = "180px"
          fill
          className="object-contain hidden dark:block rounded-lg"
          priority
        />
      </div>

      <h1 className="text-2xl font-bold">{props.title}</h1>
      <p className="text-muted-foreground">{props.subTitle}</p>
      <hr className="w-1/4 border-muted my-6" />
    
      <Cargando label={props.loaderText} />
    </div>
  );
}