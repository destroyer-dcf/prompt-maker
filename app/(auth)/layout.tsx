import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[--surface] lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="text-white" />
        <div className="max-w-md space-y-5">
          <h1 className="text-4xl font-semibold leading-tight">
            Biblioteca de prompts profesional para equipos pequeños.
          </h1>
          <p className="text-sm leading-7 text-slate-200">
            Gestiona versiones, comparte por API, organiza por colecciones y reutiliza conocimiento de IA de forma segura.
          </p>
        </div>
        <p className="text-xs text-slate-300">Acceso cerrado por invitación del administrador.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-[--panel] p-7 shadow-sm">{children}</div>
      </section>
    </div>
  );
}
