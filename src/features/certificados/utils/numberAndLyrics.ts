const unidades = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
];
const decenas = [
  "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];
const especiales: { [key: number]: string } = {
  10: "DIEZ",
  11: "ONCE",
  12: "DOCE",
  13: "TRECE",
  14: "CATORCE",
  15: "QUINCE",
  16: "DIECISÉIS",
  17: "DIECISIETE",
  18: "DIECIOCHO",
  19: "DIECINUEVE",
};

export function numberToWordsEs(num: number): string {
  if (num === 0) return "CERO";

  if (num >= 1000) return "MIL O MÁS";

  const partes: string[] = [];

  const centenas = Math.floor(num / 100);
  const resto = num % 100;
  const decena = Math.floor(resto / 10);
  const unidad = resto % 10;

  if (centenas > 0) {
    if (centenas === 1 && resto === 0) {
      partes.push("CIEN");
    } else if (centenas === 1) {
      partes.push("CIENTO");
    } else if (centenas === 5) {
      partes.push("QUINIENTOS");
    } else if (centenas === 7) {
      partes.push("SETECIENTOS");
    } else if (centenas === 9) {
      partes.push("NOVECIENTOS");
    } else {
      partes.push(unidades[centenas] + "CIENTOS");
    }
  }

  if (resto > 0) {
    if (especiales[resto]) {
      partes.push(especiales[resto]);
    } else {
      if (decena > 0) {
        partes.push(decenas[decena]);
      }
      if (unidad > 0) {
        if (decena > 2) {
          partes.push("Y " + unidades[unidad]);
        } else if (decena === 2) {
          partes[partes.length - 1] = "VEINTI" + unidades[unidad].toLowerCase();
        } else {
          partes.push(unidades[unidad]);
        }
      }
    }
  }

  return partes.join(" ").trim();
}
