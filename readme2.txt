¿Cómo decidir qué separar (y dónde)?

Piensa en capas:

Presentacional (UI “tonta”)
Componentes que sólo reciben props y renderizan: SuccessScreen, SaveConfirmDialog, CertificateHeader, etc.
Criterio: si no llaman a fetch, ni a stores, ni tienen useEffect salvo para UI → es presentacional.

Contenedores (estado/flujo)
Orquestan hooks, estado global, navegación, side-effects y pasan props a UI.
Criterio: si decide “qué mostrar y cuándo” o habla con hooks/servicios → contenedor (CertificadoWizardMobile).

Hooks (lógica reusable + side-effects)
useWizardSteps, useCertificadoSave, useDiferenciaInconsistencia, useCategorias, etc.
Criterio: si hay estado/efectos y no renderiza UI → hook.

Utils (puras, sin React)
toApiPayload, toNum, getDefaultEscuelaFromUser.
Criterio: funciones puras, transformaciones de datos, formateos. Sin hooks, sin DOM, sin fetch.

Constants/Types
STEPS, STEP_FIELDS, tipos compartidos.
Criterio: datos estáticos y tipos que se comparten en muchos archivos.

Services (opcional)
Si mañana hablás con varias rutas, creá services/certificados.ts con saveCertificado(payload) y el contenedor/hook lo usa.
Criterio: agrupar llamadas HTTP por dominio, aislar fetch para testear y centralizar headers, errores, etc.

Regla mental rápida: “si algo empieza a crecer de 80–100 líneas, o hace 2+ cosas diferentes, se va a su archivo”.

Tips rápidos

Evita ciclos de import (p.ej., constants que importan componentes). Mantener constants y utils sin importar React ni UI.

Tipos opcionales: si tu hook useAgrupaciones devuelve nombre?: string, tipalo así y ajusta render con || "SIN NOMBRE".

UI/Validación: validá en hooks (p.ej., diferencia) y pasá un booleano a los botones para colorearlos o mostrar diálogos.

Barrels (index.ts): cuando hay muchas piezas en una carpeta, podés exportarlas desde un index.ts para acortar imports.