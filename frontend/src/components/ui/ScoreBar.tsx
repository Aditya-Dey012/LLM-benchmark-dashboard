import clsx from "clsx";

interface ScoreBarProps {
  label: string;
  value: number | null;
  inverse?: boolean;
  className?: string;
}

function scoreColor(value: number, inverse: boolean) {
  const v = inverse ? 1 - value : value;
  if (v >= 0.7) return "from-emerald-500 to-emerald-400";
  if (v >= 0.4) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

function scoreTextColor(value: number, inverse: boolean) {
  const v = inverse ? 1 - value : value;
  if (v >= 0.7) return "text-emerald-400";
  if (v >= 0.4) return "text-amber-400";
  return "text-red-400";
}

export default function ScoreBar({
  label,
  value,
  inverse = false,
  className,
}: ScoreBarProps) {
  if (value === null || value === undefined) {
    return (
      <div className={clsx("space-y-1.5", className)}>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-600">N/A</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800" />
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));

  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={clsx("font-semibold tabular-nums", scoreTextColor(value, inverse))}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            scoreColor(value, inverse)
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
