import { cn } from "@/lib/utils/cn";

export function UserStatusBadge({
  status,
}: {
  status: "active" | "pending" | "disabled";
}) {
  const label =
    status === "active" ? "Activo" : status === "pending" ? "Pendiente" : "Desactivado";

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "active"
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
          : status === "pending"
            ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
            : "border-rose-500/50 bg-rose-500/10 text-rose-700",
      )}
    >
      {label}
    </span>
  );
}
