// src/stores/auth.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Rol = { id: number; nombre: string };
export type Establecimiento = { id: number; nombre: string; circuito?: any };
export type UsuarioEstablecimientoLite = { principal?: boolean; establecimiento?: Establecimiento | null; escuela?: Establecimiento | null; establecimientoId?: number | string; escuelaId?: number | string };

export type AuthUser = {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  avatarUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  rol?: Rol;
  permisos?: string[];
  // estructuras posibles:
  escuelas?: UsuarioEstablecimientoLite[];
  usuario?: { escuelas?: UsuarioEstablecimientoLite[] };
  usuarioEstablecimientos?: UsuarioEstablecimientoLite[];
  usuariosEscuelas?: UsuarioEstablecimientoLite[];
  establecimientos?: UsuarioEstablecimientoLite[];
  profile?: { escuelas?: UsuarioEstablecimientoLite[] };
  // normalizadas por nosotros:
  escuelaId?: number | null;
  escuela?: Establecimiento | null;
} | null;

function toNum(n: unknown): number | null {
  if (n === null || n === undefined) return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function extractEscuelaFromUser(user: any): { escuelaId: number | null; escuela: Establecimiento | null } {
  const candidates: Array<any[] | undefined> = [
    user?.escuelas,
    user?.usuario?.escuelas,
    user?.usuarioEstablecimientos,
    user?.usuariosEscuelas,
    user?.establecimientos,
    user?.profile?.escuelas,
  ];
  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length > 0) {
      const chosen = (arr.find((x: any) => x?.principal) ?? arr[0]) as UsuarioEstablecimientoLite;
      const escuelaObj: any = chosen?.establecimiento ?? chosen?.escuela ?? null;
      const escuelaIdRaw = chosen?.establecimientoId ?? chosen?.escuelaId ?? escuelaObj?.id ?? null;
      return { escuelaId: toNum(escuelaIdRaw), escuela: escuelaObj ?? null };
    }
  }
  return { escuelaId: null, escuela: null };
}

type AuthState = {
  token: string | null;         // si no lo necesitás en cliente, podés poner siempre null y depender de cookie httpOnly
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  hasHydrated: boolean;

  // estado derivado/sensible a usuario
  escuelaId: number | null;

  // acciones
  setSession: (token: string | null, user: any) => void;
  setUser: (user: any) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  reset: () => void;

  authHeaders: () => Record<string, string>;

  triedMe: boolean;                 // ← NUEVO: indica si ya intentaste /me al menos una vez
  fetchMe: () => Promise<void>;     // ya lo tenés
  fetchUser: () => Promise<void>; // ← NUEVO: alias de compatibilidad al viejo nombre
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      hasHydrated: false,
      escuelaId: null,

      setSession: (token, rawUser) => {
        // normalizar escuela
        const { escuelaId, escuela } = extractEscuelaFromUser(rawUser ?? {});
        const user: AuthUser = rawUser
          ? { ...rawUser, escuelaId, escuela }
          : null;

        // limpiar cualquier estado derivado de usuario previo
        localStorage.removeItem("escuelaId");
        localStorage.removeItem("mesaSeleccionada");

        set({
          token: token ?? null,
          user,
          isAuthenticated: !!token,
          escuelaId,
        });
      },

      setUser: (rawUser) => {
        const { escuelaId, escuela } = extractEscuelaFromUser(rawUser ?? {});
        const user: AuthUser = rawUser ? { ...rawUser, escuelaId, escuela } : null;
        set({ user, escuelaId });
      },

      setToken: (token) => set({ token, isAuthenticated: !!token }),

      fetchMe: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const res = await fetch("/api/app-auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
          });

          if (!res.ok) {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              triedMe: true,            // ← clave
            });
            return;
          }

          const data = await res.json().catch(() => ({} as any));
          const meUser = (data?.user ?? data) as any;
          const { escuelaId, escuela } = extractEscuelaFromUser(meUser ?? {});
          set({
            user: meUser ? { ...meUser, escuelaId, escuela } : null,
            escuelaId,
            isAuthenticated: !!meUser,
            loading: false,
            triedMe: true,              // ← clave
          });
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            triedMe: true,              // ← clave
          });
        }
      },
      fetchUser: async () => {
        await get().fetchMe();          // ← alias al método nuevo
      },
      logout: async () => {
        try {
          await fetch("/api/app-auth/logout", { 
            method: "POST",
            cache: "no-store", 
            credentials: "include"        
        }).catch(() => { });
        } finally {          
          localStorage.removeItem("escuelaId");
          localStorage.removeItem("mesaSeleccionada");
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            escuelaId: null,
            loading: false,
            triedMe: true,
          });
        }
      },

      reset: () => {
        localStorage.removeItem("escuelaId");
        localStorage.removeItem("mesaSeleccionada");
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          escuelaId: null,
          loading: false,
        });
      },

      authHeaders: (): Record<string, string> => {
        const headers: Record<string, string> = {};
        const t = get().token;
        if (t) headers.Authorization = `Bearer ${t}`;
        return headers;
      },
      triedMe: false,

    }),
    {
      name: "auth-v2-store", // 🔑 cambia el nombre para “romper” la persistencia vieja
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos token+user+escuelaId (¡no caches derivados raros!)
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        escuelaId: s.escuelaId,
      }),
      onRehydrateStorage: () => (state) => {
        state && (state.hasHydrated = true);
      },
      migrate: (persisted: any, version) => {
        // Limpieza segura si venías del store viejo
        if (version < 2) {
          return { token: null, user: null, isAuthenticated: false, escuelaId: null };
        }
        return persisted;
      },
    }
  )
);
