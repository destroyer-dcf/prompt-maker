import type { Metadata } from "next";

import { ImportExportManager } from "@/components/settings/ImportExportManager";

export const metadata: Metadata = {
  title: "Import / Export",
  description: "Exporta e importa prompts y plantillas con preview y control de conflictos.",
};

export default function ImportExportPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Import / Export</h1>
        <p className="mt-1 text-sm text-[--ink-soft]">
          Exporta tus datos o importa prompts masivamente con preview y manejo de conflictos.
        </p>
      </div>

      <ImportExportManager />
    </section>
  );
}
