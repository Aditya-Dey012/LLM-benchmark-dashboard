import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { benchmarkApi } from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import { Plus, Trash2, ArrowRight, List, Clock } from "lucide-react";
import { useState } from "react";

function fmtDate(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function taskLabel(t: string) {
  const map: Record<string, string> = {
    qa: "Q&A",
    summarization: "Summarization",
    code_gen: "Code Gen",
    rag: "RAG",
  };
  return map[t] ?? t;
}

const taskColors: Record<string, string> = {
  qa: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  summarization: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  code_gen: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  rag: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export default function Benchmarks() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: runs, isLoading } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: benchmarkApi.list,
    refetchInterval: 8_000,
  });

  const deleteMutation = useMutation({
    mutationFn: benchmarkApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["benchmarks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleting(null);
    },
  });

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this benchmark run and all its results?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">All Runs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {runs ? `${runs.length} benchmark run${runs.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <Link to="/benchmark/new" className="btn-primary">
          <Plus size={16} />
          New Benchmark
        </Link>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-gray-800/60 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_auto] items-center px-5 py-3 border-b border-gray-800/60 bg-gray-900/30">
          {["Name", "Task", "Models", "Results", "Created", ""].map((h, i) => (
            <span key={i} className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-800/40 animate-pulse" />
            ))}
          </div>
        ) : !runs || runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <List size={22} className="text-indigo-400" />
            </div>
            <p className="text-gray-400 font-medium">No benchmark runs yet</p>
            <p className="text-gray-600 text-sm mt-1 mb-5">Create your first benchmark to start comparing models</p>
            <Link to="/benchmark/new" className="btn-primary text-sm">
              <Plus size={15} /> Run First Benchmark
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/40">
            {runs.map((run) => (
              <Link
                key={run.id}
                to={`/benchmark/${run.id}`}
                className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-800/25 transition-colors group"
              >
                {/* Name */}
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                    {run.name}
                  </p>
                  <StatusBadge status={run.status} className="mt-1" />
                </div>

                {/* Task */}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border w-fit ${
                    taskColors[run.task_type] ?? "text-gray-400 bg-gray-800 border-gray-700"
                  }`}
                >
                  {taskLabel(run.task_type)}
                </span>

                {/* Models */}
                <div className="flex flex-wrap gap-1 pr-4">
                  {run.models.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {/* Result count */}
                <span className="text-sm text-gray-500 tabular-nums">
                  {run.result_count} / {run.models.length}
                </span>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock size={11} />
                  {fmtDate(run.created_at)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={(e) => confirmDelete(run.id, e)}
                    className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete run"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ArrowRight size={14} className="text-gray-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
