import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

function RowSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-[--panel] p-4">
      <div className="h-4 w-48 rounded bg-[--panel-soft]" />
      <div className="mt-3 h-3 w-full rounded bg-[--panel-soft]" />
      <div className="mt-2 h-3 w-2/3 rounded bg-[--panel-soft]" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="space-y-4 p-1">
      <LoadingSpinner label="Cargando contenido..." />
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </section>
  );
}
