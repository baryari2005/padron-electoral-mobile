export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import LoginForm from "@/components/auth/LoginForm";


export default function Page() {
    return <LoginForm />;
}