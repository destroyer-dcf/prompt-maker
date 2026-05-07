"use client";

type RatingStarsProps = {
  value: number | null;
  disabled?: boolean;
  onChange: (next: number | null) => void;
};

export function RatingStars({ value, disabled = false, onChange }: RatingStarsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((item) => {
        const active = value !== null && item <= value;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            disabled={disabled}
            className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
              active
                ? "border-[--brand] bg-[--brand-soft] text-[--brand]"
                : "border-[--line] text-[--ink-soft] hover:bg-[--panel-soft]"
            } disabled:opacity-50`}
          >
            {item}*
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={disabled || value === null}
        className="rounded-md border px-2 py-1 text-xs font-medium text-[--ink-soft] hover:bg-[--panel-soft] disabled:opacity-50"
      >
        Clear
      </button>
    </div>
  );
}
