"use client";

import { useWatch } from "react-hook-form";
import { CheckCircle, XCircle, TriangleAlert } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
}

interface Props {
  control: any;
  categorias: Categoria[];
}

export function ResumenValidacionTotalesPorColumna({ control, categorias }: Props) {
  const sobres = useWatch({ control, name: "totales.sobres" }) ?? 0;
  const votosEspeciales = useWatch({ control, name: "votosEspeciales" }) ?? {};
  const resultadosPresidenciales = useWatch({ control, name: "resultadosPresidenciales" }) ?? [];

  const data = categorias.map((cat) => {
    const especiales = Object.values(votosEspeciales?.[cat.id] || {}).reduce(
      (acc: number, val: any) => acc + (Number(val) || 0),
      0
    );

    const presidenciales = resultadosPresidenciales.reduce(
      (acc: number, curr: any) => acc + (Number(curr?.[cat.id]) || 0),
      0
    );

    const total = especiales + presidenciales;
    const coincide = total === sobres;

    return {
      id: cat.id,
      nombre: cat.nombre.toUpperCase(),
      total,
      coincide,
    };
  });

  const gridStyle = {
    gridTemplateColumns: `1fr repeat(${categorias.length}, 100px)`,
  };

  const columnasInconsistentes = data.filter((cat) => !cat.coincide);

  return (
    <div className="space-y-2 mt-4">
      {/* Grid con Título + Inputs con íconos */}
      <div className="grid items-center gap-2 px-2" style={gridStyle}>
        <div className="font-bold text-sm -ml-2 uppercase">total de votos cargados</div>

        {data.map((cat) => (
          <div key={cat.id} className="relative flex items-center">
            <input
              value={cat.total}
              disabled
              className={`text-sm px-2 h-8 w-full text-center rounded-md border pr-6
                ${cat.coincide
                  ? "text-green-800 border-green-400 bg-green-50"
                  : "text-red-800 border-red-400 bg-red-50"
                }`}
            />
            {cat.coincide ? (
              <CheckCircle className="absolute right-1 w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="absolute right-1 w-4 h-4 text-red-600" />
            )}
          </div>
        ))}
      </div>

      {/* Mensaje si hay inconsistencias */}
      {columnasInconsistentes.length > 0 && (
        <div
          className="grid text-sm text-red-700 px-2 py-2"
          style={gridStyle}
        >
          <div className={`col-span-${categorias.length + 1} text-center flex flex-col items-center gap-1`}>
            <div className="flex items-center gap-1 font-medium uppercase">
              <TriangleAlert className="w-4 h-4" />
              <span>Inconsistencias en el recuento de votos.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
