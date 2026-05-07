"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createVariant,
  deleteVariant,
  promoteVariant,
  rateVariant,
  updateVariant,
} from "@/actions/variants";
import { PromptVariantForm } from "@/components/prompts/PromptVariantForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RatingStars } from "@/components/shared/RatingStars";

type VariantItem = {
  id: string;
  label: string;
  content: string;
  notes: string | null;
  rating: number | null;
  updatedAt: string;
};

type PromptVariantsProps = {
  promptId: string;
  variants: VariantItem[];
  maxVariants?: number;
};

export function PromptVariants({
  promptId,
  variants,
  maxVariants = 5,
}: PromptVariantsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(variants[0]?.id ?? "new");
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (variants.length >= maxVariants) {
      toast.error(`Maximo ${maxVariants} variantes por prompt`);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createVariant(promptId, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Variante creada");
      form.reset();
      setActiveTab(result.data.variantId);
      refresh();
    });
  }

  function handleUpdate(variantId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateVariant(variantId, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Variante actualizada");
      refresh();
    });
  }

  function handleDelete(variantId: string) {
    startTransition(async () => {
      const result = await deleteVariant(variantId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Variante eliminada");
      setActiveTab("new");
      refresh();
    });
  }

  function handlePromote(variantId: string) {
    startTransition(async () => {
      const result = await promoteVariant(variantId, true);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Variante promovida al prompt principal");
      setActiveTab("new");
      refresh();
    });
  }

  function handleRate(variantId: string, rating: number | null) {
    startTransition(async () => {
      const result = await rateVariant(variantId, rating);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(rating === null ? "Rating limpiado" : `Rating ${rating}/5 guardado`);
      refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-[--panel] p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Variantes A/B</h2>
          <p className="text-sm text-[--ink-soft]">
            {variants.length}/{maxVariants} variantes
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => setActiveTab(variant.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              activeTab === variant.id
                ? "border-[--brand] bg-[--brand-soft] text-[--brand]"
                : "hover:bg-[--panel-soft]"
            }`}
          >
            {variant.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setActiveTab("new")}
          disabled={variants.length >= maxVariants}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft] disabled:opacity-50"
        >
          + Nueva variante
        </button>
      </div>

      {activeTab === "new" ? (
        <PromptVariantForm
          formIdPrefix="variant-new"
          submitLabel="Crear variante"
          pendingLabel="Guardando..."
          pending={pending}
          disabled={variants.length >= maxVariants}
          onSubmit={handleCreate}
        />
      ) : null}

      {variants.map((variant) => (
        <article key={variant.id} className={activeTab === variant.id ? "space-y-3" : "hidden"}>
          <div className="rounded-xl border bg-[--panel-soft] p-3 text-xs text-[--ink-soft]">
            Ultima actualizacion: {new Date(variant.updatedAt).toLocaleString("es-ES")}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Rating</p>
            <RatingStars
              value={variant.rating}
              disabled={pending}
              onChange={(next) => handleRate(variant.id, next)}
            />
          </div>

          <PromptVariantForm
            formIdPrefix={`variant-${variant.id}`}
            submitLabel="Guardar cambios"
            pendingLabel="Guardando..."
            pending={pending}
            initial={{
              label: variant.label,
              content: variant.content,
              notes: variant.notes ?? "",
            }}
            onSubmit={(event) => handleUpdate(variant.id, event)}
            actions={
              <>
                <ConfirmDialog
                  label="Promover a principal"
                  pendingLabel="Promoviendo..."
                  confirmMessage="Promover esta variante al prompt principal? Se guarda snapshot en historial."
                  onConfirm={async () => {
                    handlePromote(variant.id);
                  }}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft] disabled:opacity-60"
                />
                <ConfirmDialog
                  label="Eliminar"
                  pendingLabel="Eliminando..."
                  confirmMessage="Eliminar esta variante?"
                  onConfirm={async () => {
                    handleDelete(variant.id);
                  }}
                  className="rounded-xl border px-3 py-2 text-sm font-medium text-[--danger] hover:bg-[--panel-soft] disabled:opacity-60"
                />
              </>
            }
          />
        </article>
      ))}
    </section>
  );
}
