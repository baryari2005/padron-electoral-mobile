// src/features/certificados/wizard/utils/payload.ts
import type { CertificadoFormData } from "@/features/certificados/utils/schema/schema";

export const toNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

export function toApiPayload(values: CertificadoFormData, categorias: { id: string }[]) {
  const votosEspeciales: Record<string, any> = {};
  for (const [catId, obj] of Object.entries(values.votosEspeciales || {})) {
    const o = obj as any;
    votosEspeciales[String(catId)] = {
      nulos: toNum(o?.nulos),
      recurridos: toNum(o?.recurridos),
      impugnados: toNum(o?.impugnados),
      comandoElectoral: toNum(o?.comandoElectoral),
      blancos: toNum(o?.blancos),
    };
  }

  const resultados: Array<{ categoria: string; agrupacionId: string; votos: number }> = [];
  for (const row of values.resultadosPresidenciales || []) {
    const agrupacionId = String((row as any)?.agrupacionId ?? "");
    for (const cat of categorias) {
      resultados.push({
        categoria: String(cat.id),
        agrupacionId,
        votos: toNum((row as any)?.[cat.id]),
      });
    }
  }

  return {
    establecimientoId: String(values.mesa.escuelaId ?? ""),
    numeroMesa: toNum(values.mesa.numeroMesa),
    circuitoId:
      values.mesa.circuitoId !== undefined && values.mesa.circuitoId !== null
        ? toNum(values.mesa.circuitoId)
        : undefined,
    totales: {
      sobres: toNum(values.totales.sobres),
      votantes: toNum(values.totales.votantes),
      diferencia: toNum(values.totales.diferencia),
    },
    votosEspeciales,
    resultados,
  };
}
