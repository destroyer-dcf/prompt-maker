import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido</h1>
        <p className="mt-1 text-sm text-[--ink-soft]">Inicia sesión para acceder a tus prompts.</p>
      </div>

      <LoginForm nextPath={next} />

      <p className="text-sm text-[--ink-soft]">
        <Link href="/forgot-password" className="font-medium text-[--brand] hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </div>
  );
}
