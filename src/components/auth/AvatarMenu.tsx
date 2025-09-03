// src/components/auth/AvatarMenu.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

type Props = { className?: string };

function AvatarMenuInner({ className }: Props) {
  // ✅ selectores separados (sin objetos nuevos)
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();

  const initials = useMemo(() => {
    const a = (user?.nombre?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
    const b = (user?.apellido?.[0] ?? "").toUpperCase();
    return `${a}${b}`;
  }, [user?.nombre, user?.apellido, user?.email]);

  const doLogout = async () => {
    await logout();
    try { localStorage.removeItem("auth-v2-store"); } catch { }

    // **Hard reload** para matar cualquier caché de Server Components
    //window.location.replace("/login"); // o window.location.href = "/login"

    // router.replace("/login");
    // router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className} aria-label="Abrir menú de usuario">
          <Avatar className="h-8 w-8 ring-2 ring-gray-950-600">
            <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.email ?? "avatar"} />
            <AvatarFallback className="bg-gray-700 text-white">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end"
        className="
    w-56
    !border-1                    /* sin borde */
    border-gray-400
    !shadow-none                 /* sin sombra */       
    !bg-white dark:!bg-neutral-900
    !backdrop-blur-none
    supports-[backdrop-filter]:!backdrop-blur-none
    focus:outline-none focus-visible:ring-0 ring-0
  "
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{user?.nombre ?? "Usuario"}</span>
            <span className="text-[11px] text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={doLogout}
          className="
    !cursor-pointer
    data-[highlighted]:cursor-pointer
    hover:cursor-pointer
    data-[highlighted]:bg-gray-100
    data-[highlighted]:text-blue-700
  "
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AvatarMenu = React.memo(AvatarMenuInner);
export default AvatarMenu;
