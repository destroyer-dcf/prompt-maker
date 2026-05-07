type PromptStatsProps = {
  copyCount: number;
  cloneCount: number;
};

export function PromptStats({ copyCount, cloneCount }: PromptStatsProps) {
  const score = copyCount + cloneCount * 2;
  const isPopular = score >= 20;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border px-2 py-1">copies: {copyCount}</span>
      <span className="rounded-full border px-2 py-1">clones: {cloneCount}</span>
      {isPopular ? (
        <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-orange-700">
          Popular
        </span>
      ) : null}
    </div>
  );
}
