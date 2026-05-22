import { NavLink } from "react-router-dom";
import { LayoutDashboard, Zap, List, Plus, Github } from "lucide-react";
import clsx from "clsx";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/benchmark/new", icon: Plus, label: "New Benchmark", exact: false },
  { to: "/benchmarks", icon: List, label: "All Runs", exact: false },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-gray-950 border-r border-gray-800/60">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-gray-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-bold text-white">LLM Benchmark</p>
          <p className="text-[10px] text-gray-500 font-medium">Dashboard v1.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
          Navigation
        </p>
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={clsx(
                    "transition-colors",
                    isActive ? "text-indigo-400" : "text-gray-600 group-hover:text-gray-300"
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800/60">
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-semibold text-gray-400">Powered by</p>
          <div className="flex flex-wrap gap-1.5">
            {["Ollama", "LangChain", "FastAPI"].map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <a
          href="https://github.com/Aditya-Dey012/LLM-benchmark-dashboard"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-[12px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          <Github size={13} />
          View on GitHub
        </a>
      </div>
    </aside>
  );
}
