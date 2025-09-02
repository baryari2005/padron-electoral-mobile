import { EstablecimientoConCircuito } from "@/features/certificados/types/types";

export type Props = {
  logo: string;
  alternativeLogo: string;
  alternativeText: string;
  title: string;
  subTitle: string;
  loaderText: string;
}


export type UsuarioEstablecimientoLite = {
  principal?: boolean;
  establecimiento?: EstablecimientoConCircuito;   
  establecimientoId?: number;                     
};