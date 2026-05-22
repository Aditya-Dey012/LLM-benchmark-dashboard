import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { benchmarkApi } from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import ScoreBar from "../components/ui/ScoreBar";
import { ModelResult } from "../types";
import {
  ArrowLeft,
  Clock,
  Hash,
  AlertTriangle,
  Cpu,
  MessageSquare,
  StopCircle,
} from "lucide-react";
import clsx from "clsx";

const MODEL_COLORS = ["#818cf8", "#06b6d4", "#a78bfa", "#10b981", "#f59e0b"];

function MetricCard({
  label,
  value,
  unit = "",
  icon: Icon,
  colorClass = "text-indigo-400",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <div className="glass rounded-xl p-4 border border-gray-800/60 text-center">
      <Icon size={16} className={clsx("mx-auto mb-2", colorClass)} />
      <p className="text-xl font-bold text-white tabular-nums">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function ModelCard({
  result,
  index,
}: {
  result: ModelResult;
  index: number;
}) {
  const color = MODEL_COLORS[index % MODEL_COLORS.length];

  if (result.error) {
    return (
      <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <h3 className="text-sm font-bold text-white">{result.model_name}</h3>
          <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle size={12} /> Error
          </span>
        </div>
        <p className="text-xs font-mono text-red-400 bg-red-500/10 rounded-lg p-3">
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass card-hover rounded-2xl border border-gray-800/60 p-5 flex flex-col gap-4"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      {/* Model name + latency */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <h3 className="text-sm font-bold text-white">{result.model_name}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <Clock size={11} />
          {(result.latency_ms / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800/50 rounded-lg py-2">
          <p className="text-[11px] text-gray-600">Latency</p>
          <p className="text-sm font-semibold text-gray-300 tabular-nums">
            {(result.latency_ms / 1000).toFixed(2)}s
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg py-2">
          <p className="text-[11px] text-gray-600">Tokens</p>
          <p className="text-sm font-semibold text-gray-300 tabular-nums">{result.tokens_used}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg py-2">
          <p className="text-[11px] text-gray-600">Relevancy</p>
          <p className="text-sm font-semibold text-emerald-400 tabular-nums">
            {result.relevancy_score !== null
              ? `${Math.round((result.relevancy_score ?? 0) * 100)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5">
        <ScoreBar label="Relevancy" value={result.relevancy_score} />
        {result.faithfulness_score !== null && (
          <ScoreBar label="Faithfulness" value={result.faithfulness_score} />
        )}
        {result.hallucination_rate !== null && (
          <ScoreBar label="Hallucination Rate" value={result.hallucination_rate} inverse />
        )}
      </div>

      {/* Response */}
      <div>
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Response
        </p>
        <div className="bg-gray-900/70 rounded-xl p-4 max-h-52 overflow-y-auto">
          <p className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
            {result.response || "No response"}
          </p>
        </div>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: ["benchmark", id],
    queryFn: () => benchmarkApi.get(id!),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 3_000 : false;
    },
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => benchmarkApi.cancel(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["benchmark", id], updated);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5 animate-pulse">
        <div className="h-8 w-64 rounded-xl bg-gray-800" />
        <div className="h-32 rounded-2xl bg-gray-800/50" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-800/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg font-semibold">Benchmark not found</p>
        <Link to="/benchmarks" className="btn-secondary mt-4">
          <ArrowLeft size={14} /> Back to runs
        </Link>
      </div>
    );
  }

  // Build chart data
  const chartData = run.results
    .filter((r) => !r.error)
    .map((r) => ({
      model: r.model_name,
      Relevancy: r.relevancy_score ?? 0,
      Faithfulness: r.faithfulness_score ?? undefined,
      "Hallucination Rate": r.hallucination_rate ?? undefined,
    }));

  const latencyData = run.results
    .filter((r) => !r.error)
    .map((r) => ({
      model: r.model_name,
      "Latency (s)": parseFloat((r.latency_ms / 1000).toFixed(2)),
    }));

  const isInProgress = run.status === "pending" || run.status === "running";
  const duration =
    run.completed_at
      ? `${((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000).toFixed(1)}s`
      : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Breadcrumb + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/benchmarks" className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{run.name}</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(run.created_at).toLocaleString()} · {run.task_type.toUpperCase()}
            </p>
          </div>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {/* Running indicator */}
      {isInProgress && (
        <div className="glass rounded-xl border border-blue-500/25 bg-blue-500/5 px-5 py-4 space-y-3">
          {/* Top row */}
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping flex-shrink-0" />
            <p className="text-sm text-blue-300 font-medium">
              {run.status === "pending"
                ? "Queued — starting benchmark…"
                : run.current_model
                ? `Running ${run.current_model}…`
                : "Starting…"}
            </p>
            <span className="text-xs text-blue-500">
              {run.results.length}/{run.models.length} done
            </span>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-red-500/10 text-red-400 border border-red-500/25
                         hover:bg-red-500/20 hover:text-red-300 transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopCircle size={13} />
              {cancelMutation.isPending ? "Stopping…" : "Stop"}
            </button>
          </div>

          {/* Model progress pills */}
          {run.status === "running" && (
            <div className="flex flex-wrap gap-2">
              {run.models.map((m) => {
                const done = run.results.some((r) => r.model_name === m);
                const active = run.current_model === m;
                return (
                  <span
                    key={m}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      done
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                        : active
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse"
                        : "bg-gray-800/50 text-gray-600 border-gray-700/50"
                    }`}
                  >
                    {done ? "✓ " : active ? "⟳ " : ""}{m}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Prompt card */}
      <div className="glass rounded-2xl border border-gray-800/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <MessageSquare size={14} />
          Prompt
        </div>
        <p className="text-sm text-gray-200 font-mono bg-gray-900/60 rounded-xl p-4 leading-relaxed">
          {run.prompt}
        </p>
        {run.context && (
          <>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Context (RAG)</p>
            <p className="text-xs text-gray-400 font-mono bg-gray-900/60 rounded-xl p-3 max-h-28 overflow-y-auto leading-relaxed">
              {run.context}
            </p>
          </>
        )}
        {duration && (
          <div className="flex items-center gap-4 pt-1">
            <MetricCard label="Total Time" value={duration} icon={Clock} colorClass="text-cyan-400" />
            <MetricCard label="Models Tested" value={run.results.filter((r) => !r.error).length} icon={Cpu} colorClass="text-indigo-400" />
            <MetricCard label="Total Tokens" value={run.results.reduce((a, r) => a + r.tokens_used, 0)} icon={Hash} colorClass="text-violet-400" />
          </div>
        )}
      </div>

      {/* Model comparison grid */}
      {run.results.length > 0 && (
        <>
          <div>
            <h2 className="section-title mb-4">Model Responses</h2>
            <div
              className={clsx(
                "grid gap-4",
                run.results.length === 1
                  ? "grid-cols-1 max-w-lg"
                  : run.results.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {run.results.map((result, i) => (
                <ModelCard key={result.id} result={result} index={i} />
              ))}
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 border border-gray-800/60">
                <h2 className="section-title mb-5">Score Comparison</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barGap={4} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" vertical={false} />
                    <XAxis dataKey="model" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 1]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                    <Bar dataKey="Relevancy" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    {chartData[0]?.Faithfulness !== undefined && (
                      <Bar dataKey="Faithfulness" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                    {chartData[0]?.["Hallucination Rate"] !== undefined && (
                      <Bar dataKey="Hallucination Rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass rounded-2xl p-6 border border-gray-800/60">
                <h2 className="section-title mb-5">Latency Comparison</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={latencyData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" vertical={false} />
                    <XAxis dataKey="model" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}s`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(6,182,212,0.05)" }} />
                    <Bar dataKey="Latency (s)" fill="#06b6d4" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state while running */}
      {run.results.length === 0 && isInProgress && (
        <div className="glass rounded-2xl border border-gray-800/60 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex gap-1.5 mb-4">
            {run.models.map((_, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-gray-400 font-medium">Running models in parallel…</p>
          <p className="text-gray-600 text-sm mt-1">
            Querying {run.models.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
