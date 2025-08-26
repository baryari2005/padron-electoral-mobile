import { create } from "zustand";

export type AuthUser = { id?: string; email?: string; name?: string; [k: string]: any } | null;

type AuthState = {
  token: string | null;
  user: AuthUser;
  isAuthenticated: boolean;
  setSession: (token: string, user?: AuthUser) => void;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  authHeaders: () => Record<string, string>;
};

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) => set({ token, user: user ?? null, isAuthenticated: !!token }),
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
  authHeaders: (): Record<string, string> => {
    const t = get().token;
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return headers;
  },
}));
