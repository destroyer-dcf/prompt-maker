"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="grid min-h-screen place-items-center bg-[--surface] p-6 text-[--ink]">
        <section className="w-full max-w-xl rounded-2xl border bg-[--panel] p-6">
          <h1 className="text-2xl font-semibold">Se produjo un error</h1>
          <p className="mt-2 text-sm text-[--ink-soft]">
            Intenta recargar. Si persiste, revisa los logs del servidor.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-[--panel-soft] p-3 text-xs">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Reintentar
          </button>
        </section>
      </body>
    </html>
  );
}
