import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Define tu contraseña</h1>
        <p className="mt-1 text-sm text-[--ink-soft]">Este paso finaliza la activación o recuperación de tu cuenta.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
