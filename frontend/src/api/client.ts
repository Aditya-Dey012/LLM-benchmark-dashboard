import axios from "axios";
import {
  BenchmarkRun,
  BenchmarkSummary,
  BenchmarkCreateRequest,
  Stats,
} from "../types";

const http = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const benchmarkApi = {
  create: (data: BenchmarkCreateRequest) =>
    http.post<BenchmarkRun>("/api/benchmarks/", data).then((r) => r.data),

  list: () =>
    http.get<BenchmarkSummary[]>("/api/benchmarks/").then((r) => r.data),

  get: (id: string) =>
    http.get<BenchmarkRun>(`/api/benchmarks/${id}`).then((r) => r.data),

  cancel: (id: string) =>
    http.post<BenchmarkRun>(`/api/benchmarks/${id}/cancel`).then((r) => r.data),

  remove: (id: string) =>
    http.delete(`/api/benchmarks/${id}`).then((r) => r.data),
};

export const modelsApi = {
  available: () =>
    http
      .get<{ models: string[]; error: string | null }>("/api/models/available")
      .then((r) => r.data),

  health: () =>
    http
      .get<{ ollama_healthy: boolean; ollama_url: string }>("/api/models/health")
      .then((r) => r.data),
};

export const statsApi = {
  get: () => http.get<Stats>("/api/results/stats").then((r) => r.data),
};
