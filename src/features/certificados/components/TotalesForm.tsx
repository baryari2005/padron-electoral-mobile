"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { CertificadoFormData } from "../utils/schema/schema";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { FormItemNumberAndLyrics } from "./FormItemNumberAndLyrics";


interface TotalesFormProps {
    control: UseFormReturn<CertificadoFormData>["control"];
    setValue: UseFormReturn<CertificadoFormData>["setValue"];
}

export function TotalesForm({ control, setValue }: TotalesFormProps) {
    const sobres = useWatch({ control, name: "totales.sobres" }) ?? 0;
    const votantes = useWatch({ control, name: "totales.votantes" }) ?? 0;

    useEffect(() => {
        if (!isNaN(sobres) && !isNaN(votantes)) {
            const diferencia = votantes - sobres;
            setValue("totales.diferencia", diferencia);
        }
    }, [sobres, votantes, setValue]);

    const campos = [
        { name: "votantes", label: "Cantidad de electores que han votado" },
        { name: "sobres", label: "Cantidad de sobres en la urna" },
        { name: "diferencia", label: "Diferencia" },
    ] as const;

    return (
        <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campos.map(({ name, label }) => (
                    <FormItemNumberAndLyrics
                        key={name}
                        control={control}
                        name={`totales.${name}`}
                        label={label}
                        disabled={name === "diferencia"}
                        showErrorCondition={(n, v) => n === "totales.diferencia" && v !== 0}
                        errorMessage={
                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-semibold">
                                <TriangleAlert className="w-4 h-4" />
                                Hay diferencia entre sobres y votantes
                            </div>
                        }
                    />
                ))}
            </div>
        </div>
    );
}
