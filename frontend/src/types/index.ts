export type TaskType = "qa" | "summarization" | "code_gen" | "rag";
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ModelResult {
  id: string;
  run_id: string;
  model_name: string;
  response: string;
  latency_ms: number;
  tokens_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  relevancy_score: number | null;
  faithfulness_score: number | null;
  hallucination_rate: number | null;
  cosine_score: number | null;
  error: string | null;
  created_at: string;
}

export interface BenchmarkRun {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  context?: string;
  task_type: TaskType;
  models: string[];
  status: RunStatus;
  current_model?: string | null;
  created_at: string;
  completed_at?: string;
  results: ModelResult[];
}

export interface BenchmarkSummary {
  id: string;
  name: string;
  task_type: TaskType;
  models: string[];
  status: RunStatus;
  created_at: string;
  completed_at?: string;
  result_count: number;
}

export interface ModelScore {
  model: string;
  avg_relevancy: number;
  avg_latency: number;
  count: number;
}

export interface Stats {
  total_runs: number;
  completed_runs: number;
  total_results: number;
  model_scores: ModelScore[];
}

export interface BenchmarkCreateRequest {
  name: string;
  description?: string;
  prompt: string;
  context?: string;
  task_type: TaskType;
  models: string[];
}
