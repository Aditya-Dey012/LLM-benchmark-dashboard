import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { statsApi, benchmarkApi } from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import { Activity, CheckCircle, Cpu, TrendingUp, Plus, Clock, ArrowRight } from "lucide-react";

const MODEL_COLORS: Record<string, string> = {
  "gemma:2b": "#06b6d4",
  "llama3.1:8b": "#818cf8",
  "mistral:7b": "#a78bfa",
};
const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

function getColor(model: string, i: number) {
  return MODEL_COLORS[model] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

function fmt(n: number) {
  return n.toLocaleString();
}

const CustomTooltip = ({ active, payload, label }: any) => {
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

const LatencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          Avg latency: <span className="font-bold">{(p.value / 1000).toFixed(1)}s</span>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
    refetchInterval: 10_000,
  });

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: benchmarkApi.list,
    refetchInterval: 10_000,
  });

  const statCards = [
    {
      label: "Total Runs",
      value: stats ? fmt(stats.total_runs) : "—",
      icon: Activity,
      color: "indigo",
      bg: "from-indigo-500/10 to-violet-500/10",
      border: "border-indigo-500/20",
      iconColor: "text-indigo-400",
    },
    {
      label: "Completed",
      value: stats ? fmt(stats.completed_runs) : "—",
      icon: CheckCircle,
      color: "emerald",
      bg: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label: "Model Evals",
      value: stats ? fmt(stats.total_results) : "—",
      icon: Cpu,
      color: "cyan",
      bg: "from-cyan-500/10 to-sky-500/10",
      border: "border-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      label: "Avg Relevancy",
      value:
        stats && stats.model_scores.length
          ? `${Math.round(
              (stats.model_scores.reduce((a, m) => a + m.avg_relevancy, 0) /
                stats.model_scores.length) *
                100
            )}%`
          : "—",
      icon: TrendingUp,
      color: "violet",
      bg: "from-violet-500/10 to-purple-500/10",
      border: "border-violet-500/20",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Compare local LLMs side-by-side</p>
        </div>
        <Link to="/benchmark/new" className="btn-primary">
          <Plus size={16} />
          New Benchmark
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, border, iconColor }) => (
          <div
            key={label}
            className={`glass card-hover rounded-2xl p-5 bg-gradient-to-br ${bg} border ${border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center ${iconColor}`}>
                <Icon size={15} />
              </div>
            </div>
            {statsLoading ? (
              <div className="h-8 w-16 rounded-lg bg-gray-800 animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      {stats && stats.model_scores.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Relevancy Chart */}
          <div className="glass rounded-2xl p-6 border border-gray-800/60">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-indigo-400" />
              <h2 className="section-title">Avg Relevancy Score</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.model_scores} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" vertical={false} />
                <XAxis
                  dataKey="model"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="avg_relevancy" name="Relevancy" radius={[6, 6, 0, 0]}>
                  {stats.model_scores.map((entry, i) => (
                    <Cell key={entry.model} fill={getColor(entry.model, i)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Latency Chart */}
          <div className="glass rounded-2xl p-6 border border-gray-800/60">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={16} className="text-cyan-400" />
              <h2 className="section-title">Avg Latency</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.model_scores} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" vertical={false} />
                <XAxis
                  dataKey="model"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}s`}
                />
                <Tooltip content={<LatencyTooltip />} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
                <Bar dataKey="avg_latency" name="Latency" radius={[6, 6, 0, 0]}>
                  {stats.model_scores.map((entry, i) => (
                    <Cell key={entry.model} fill={getColor(entry.model, i)} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      <div className="glass rounded-2xl border border-gray-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" />
            <h2 className="section-title">Recent Runs</h2>
          </div>
          <Link to="/benchmarks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {runsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : !runs || runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Activity size={24} className="text-indigo-400" />
            </div>
            <p className="text-gray-400 font-medium">No benchmark runs yet</p>
            <p className="text-gray-600 text-sm mt-1 mb-4">Run your first benchmark to see results here</p>
            <Link to="/benchmark/new" className="btn-primary text-xs">
              <Plus size={14} /> Run First Benchmark
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/40">
            {runs.slice(0, 6).map((run) => (
              <Link
                key={run.id}
                to={`/benchmark/${run.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/30 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <StatusBadge status={run.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                      {run.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {run.models.join(" · ")} ·{" "}
                      <span className="capitalize">{run.task_type}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-600">
                    {new Date(run.created_at).toLocaleDateString()}
                  </span>
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
