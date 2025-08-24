export type EstablecimientoConCircuito = {
  id: string;
  nombre: string;
  circuito: {
    id: string;
    nombre: string;
    codigo: string;
  };
  mesasPorEstablecimiento: {
    id: string;
    numero: string; // o `number`, depende cómo lo estés usando
  }[];
};
