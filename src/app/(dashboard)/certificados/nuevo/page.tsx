// app/(dashboard)/certificados/nuevo/page.tsx

import { RequireAuth2 } from "@/components/auth/RequireAuth";
import CertificadoWizardMobile from "@/features/certificados/wizard/CertificadoWizardMobile";


export default function Page() {
  return (
    <RequireAuth2>
      <CertificadoWizardMobile />
    </RequireAuth2>
  );
}