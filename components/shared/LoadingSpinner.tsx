type LoadingSpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export function LoadingSpinner({
  label = "Cargando...",
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        className={`inline-block animate-spin rounded-full border-[--ink-soft] border-t-transparent ${sizeClasses[size]}`}
        aria-hidden
      />
      <span className="text-sm text-[--ink-soft]">{label}</span>
    </div>
  );
}
