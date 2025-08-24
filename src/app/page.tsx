// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();            // en tu setup es async
  const token = cookieStore.get("auth_token")?.value;
  redirect(token ? "/certificados/nuevo" : "/login");
}
