import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recuperar acceso</h1>
        <p className="mt-1 text-sm text-[--ink-soft]">Te enviaremos un enlace para restablecer tu contraseña.</p>
      </div>

      <ForgotPasswordForm />

      <p className="text-sm text-[--ink-soft]">
        <Link href="/login" className="font-medium text-[--brand] hover:underline">
          Volver al login
        </Link>
      </p>
    </div>
  );
}
