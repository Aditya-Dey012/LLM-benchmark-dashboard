import { useQuery } from "@tanstack/react-query";
import { modelsApi } from "../../api/client";
import { Circle, Cpu, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Header() {
  const { data: health } = useQuery({
    queryKey: ["ollama-health"],
    queryFn: modelsApi.health,
    refetchInterval: 15_000,
  });

  const online = health?.ollama_healthy ?? false;
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Cpu size={13} />
        <span>Local LLM Evaluation Platform</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-all duration-200"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Ollama status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            online
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
              : "bg-red-500/10 text-red-400 border-red-500/25"
          }`}
        >
          <Circle
            size={7}
            className={online ? "fill-emerald-400 text-emerald-400" : "fill-red-400 text-red-400"}
          />
          Ollama {online ? "Online" : "Offline"}
        </div>
      </div>
    </header>
  );
}
