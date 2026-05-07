import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-lg rounded-2xl border bg-[--panel] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[--ink-soft]">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-sm text-[--ink-soft]">
          La ruta solicitada no existe o ya no está disponible.
        </p>
        <Link
          href="/prompts"
          className="mt-6 inline-flex rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Ir a prompts
        </Link>
      </section>
    </main>
  );
}
