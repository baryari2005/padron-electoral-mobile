// app/offline/page.tsx
export default function OfflinePage() {
    return (
        <main className="min-h-dvh grid place-items-center p-6 text-center">
            <div>
                <h1 className="text-xl font-semibold">Sin conexión</h1>
                <p className="text-sm text-muted-foreground mt-2">Revisá tu conexión a internet. Algunos contenidos pueden no estar disponibles.</p>
            </div>
        </main>
    );
}