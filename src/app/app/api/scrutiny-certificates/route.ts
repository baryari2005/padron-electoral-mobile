import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { certificadoSchema } from "@/lib/validations/certificado.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    // Validación lado servidor (opcional pero recomendado)
    const data = certificadoSchema.parse(raw);

    // Reenvío al backend real
    const created = await apiFetch<any>({
      path: "/scrutiny-certificates",
      init: { method: "POST", body: JSON.stringify(data) },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const status =
      e?.name === "ZodError" ? 400 :
      e?.message?.includes("API") ? 502 : 500;

    return NextResponse.json(
      { error: e?.issues ?? e?.message ?? "Error" },
      { status }
    );
  }
}
