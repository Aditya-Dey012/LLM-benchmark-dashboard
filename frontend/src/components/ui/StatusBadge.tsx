import clsx from "clsx";
import { RunStatus } from "../../types";

const config: Record<RunStatus, { label: string; classes: string; dot: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-gray-500/15 text-gray-400 border-gray-500/25",
    dot: "bg-gray-400 animate-pulse",
  },
  running: {
    label: "Running",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    dot: "bg-blue-400 animate-ping",
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-500/15 text-red-400 border-red-500/25",
    dot: "bg-red-400",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    dot: "bg-orange-400",
  },
};

interface StatusBadgeProps {
  status: RunStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status] ?? config.pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        c.classes,
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
