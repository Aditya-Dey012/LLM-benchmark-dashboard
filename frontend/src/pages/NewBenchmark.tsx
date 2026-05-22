import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { benchmarkApi, modelsApi } from "../api/client";
import { BenchmarkCreateRequest, TaskType } from "../types";
import { Play, Lightbulb, AlertCircle, ChevronDown } from "lucide-react";
import clsx from "clsx";

const TASK_TYPES: { value: TaskType; label: string; desc: string }[] = [
  { value: "qa", label: "Q&A", desc: "Question answering" },
  { value: "summarization", label: "Summarize", desc: "Text summarisation" },
  { value: "code_gen", label: "Code Gen", desc: "Code generation" },
  { value: "rag", label: "RAG", desc: "Retrieval-augmented generation" },
];

const SAMPLE_PROMPTS: Record<TaskType, { label: string; prompt: string; context?: string }[]> = {
  qa: [
    { label: "ML basics", prompt: "Explain the difference between supervised and unsupervised machine learning with examples." },
    { label: "REST APIs", prompt: "What are the key principles of RESTful API design?" },
    { label: "SOLID", prompt: "Explain the SOLID principles in software engineering." },
  ],
  summarization: [
    { label: "AI overview", prompt: "Summarise the key milestones in artificial intelligence development from 1950 to 2024 in 5 bullet points." },
    { label: "Blockchain", prompt: "Give a concise summary of how blockchain technology works and its main use cases." },
  ],
  code_gen: [
    { label: "Binary search", prompt: "Write a Python function that implements binary search on a sorted list. Include docstring and edge-case handling." },
    { label: "Fibonacci", prompt: "Implement a function to calculate the nth Fibonacci number using dynamic programming in Python." },
    { label: "Rate limiter", prompt: "Write a Python class for a token-bucket rate limiter that is thread-safe." },
  ],
  rag: [
    {
      label: "Company FAQ",
      prompt: "What is the company's refund policy and how long does it take?",
      context:
        "Acme Corp Refund Policy: Customers may request a full refund within 30 days of purchase. Refunds are processed within 5-7 business days back to the original payment method. Products must be unused and in original packaging. Digital products are non-refundable once downloaded.",
    },
    {
      label: "Tech spec Q",
      prompt: "What is the maximum operating temperature and power consumption of this device?",
      context:
        "Device Technical Specifications: Model X200. Processor: 4-core ARM Cortex-A55 at 2.0 GHz. RAM: 8 GB LPDDR4. Storage: 128 GB eMMC. Power consumption: 5W idle, 15W peak. Operating temperature: -10°C to 60°C. Dimensions: 150mm × 75mm × 8mm. Weight: 185g.",
    },
  ],
};

const DEFAULT_MODELS = ["gemma:2b", "phi3:mini", "deepseek-coder:6.7b", "mistral:7b", "llama3.1:8b"];

export default function NewBenchmark() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BenchmarkCreateRequest>({
    name: "",
    description: "",
    prompt: "",
    context: "",
    task_type: "qa",
    models: ["gemma:2b", "phi3:mini", "deepseek-coder:6.7b", "mistral:7b", "llama3.1:8b"],
  });
  const [error, setError] = useState("");

  const { data: modelsData } = useQuery({
    queryKey: ["available-models"],
    queryFn: modelsApi.available,
  });

  const availableModels =
    modelsData?.models && modelsData.models.length > 0
      ? modelsData.models
      : DEFAULT_MODELS;

  const mutation = useMutation({
    mutationFn: benchmarkApi.create,
    onSuccess: (run) => navigate(`/benchmark/${run.id}`),
    onError: (e: any) =>
      setError(e?.response?.data?.detail ?? "Failed to start benchmark"),
  });

  const set = (k: keyof BenchmarkCreateRequest, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleModel = (model: string) => {
    set(
      "models",
      form.models.includes(model)
        ? form.models.filter((m) => m !== model)
        : [...form.models, model]
    );
  };

  const applySample = (s: { prompt: string; context?: string }) => {
    set("prompt", s.prompt);
    set("context", s.context ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.prompt.trim()) { setError("Prompt is required"); return; }
    if (form.models.length === 0) { setError("Select at least one model"); return; }
    mutation.mutate(form);
  };

  const samples = SAMPLE_PROMPTS[form.task_type];

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold gradient-text">New Benchmark</h1>
        <p className="text-gray-500 text-sm mt-1">
          Run your prompt against multiple local LLMs simultaneously
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name + Description */}
        <div className="glass rounded-2xl p-6 border border-gray-800/60 space-y-4">
          <h2 className="section-title">Basic Info</h2>
          <div>
            <label className="label-base">Benchmark Name *</label>
            <input
              className="input-base"
              placeholder="e.g. Python Q&A Test — May 2025"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Description (optional)</label>
            <input
              className="input-base"
              placeholder="What are you testing?"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>

        {/* Task Type */}
        <div className="glass rounded-2xl p-6 border border-gray-800/60 space-y-4">
          <h2 className="section-title">Task Type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TASK_TYPES.map(({ value, label, desc }) => (
              <button
                type="button"
                key={value}
                onClick={() => set("task_type", value)}
                className={clsx(
                  "flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-sm font-medium transition-all duration-150",
                  form.task_type === value
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-gray-800/40 text-gray-500 border-gray-700/50 hover:text-gray-300 hover:bg-gray-800"
                )}
              >
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-70 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="glass rounded-2xl p-6 border border-gray-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Prompt</h2>
            <details className="relative group">
              <summary className="flex items-center gap-1.5 text-xs text-amber-400 cursor-pointer list-none hover:text-amber-300 transition-colors">
                <Lightbulb size={13} />
                Sample prompts
                <ChevronDown size={12} />
              </summary>
              <div className="absolute right-0 top-7 z-10 glass rounded-xl border border-gray-700 p-2 space-y-1 w-80 shadow-2xl">
                {samples.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => applySample(s)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-indigo-500/15 hover:text-indigo-300 transition-colors"
                  >
                    <span className="font-medium text-indigo-400">{s.label}</span>
                    <p className="text-gray-500 mt-0.5 line-clamp-2">{s.prompt}</p>
                  </button>
                ))}
              </div>
            </details>
          </div>

          <textarea
            className="input-base font-mono resize-none min-h-[120px]"
            placeholder="Enter your prompt here…"
            value={form.prompt}
            onChange={(e) => set("prompt", e.target.value)}
            rows={5}
          />

          {form.task_type === "rag" && (
            <div>
              <label className="label-base">Context (for RAG evaluation)</label>
              <textarea
                className="input-base font-mono resize-none"
                placeholder="Paste the source document or context that the model should use to answer the prompt…"
                value={form.context ?? ""}
                onChange={(e) => set("context", e.target.value)}
                rows={6}
              />
              <p className="text-xs text-gray-600 mt-1.5">
                Faithfulness and hallucination scores are computed when context is provided.
              </p>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="glass rounded-2xl p-6 border border-gray-800/60 space-y-4">
          <div>
            <h2 className="section-title">Models to Test</h2>
            <p className="text-xs text-gray-500 mt-1">
              Selected models run in parallel. Only models pulled in Ollama will succeed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableModels.map((model, i) => {
              const selected = form.models.includes(model);
              const colors = [
                "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
                "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
                "border-violet-500/40 bg-violet-500/15 text-violet-300",
                "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
              ];
              const activeColor = colors[i % colors.length];
              return (
                <button
                  type="button"
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
                    selected
                      ? activeColor
                      : "border-gray-700 bg-gray-800/40 text-gray-500 hover:text-gray-300"
                  )}
                >
                  {selected && <span className="mr-1.5">✓</span>}
                  {model}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <p className="text-xs text-gray-600 mr-auto">
            {form.models.length} model{form.models.length !== 1 ? "s" : ""} selected
          </p>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary px-8"
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play size={16} />
                Run Benchmark
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
