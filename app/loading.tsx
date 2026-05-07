import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function RootLoading() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <LoadingSpinner size="lg" label="Preparando la aplicación..." />
    </main>
  );
}
