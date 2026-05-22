# LLM Benchmark Dashboard

> Compare local LLMs side-by-side — zero API cost, full observability.

A full-stack AI evaluation platform that benchmarks multiple local Large Language Models simultaneously. Submit a prompt, and the system runs it sequentially across **Gemma 2B, Phi-3 Mini, DeepSeek Coder 6.7B, Mistral 7B, and Llama 3.1 8B** via Ollama. Each response is automatically scored on relevancy, faithfulness, and hallucination rate. Results are visualised in a premium React dashboard with real-time progress tracking, charts, and LangSmith tracing.

---

## Screenshots

| Running State | Results |
|---|---|
| ![Running](public/Screenshot%202026-05-21%20170208.png) | ![Results](public/Screenshot%202026-05-21%20172230.png) |

| Model Cards + Charts | LangSmith Traces |
|---|---|
| ![Charts](public/Screenshot%202026-05-21%20172252.png) | ![LangSmith](public/Screenshot%202026-05-21%20172317.png) |

---

## Key Features

- **5-model sequential benchmarking** — Gemma 2B, Phi-3 Mini, DeepSeek Coder 6.7B, Mistral 7B, Llama 3.1 8B via Ollama
- **4 task types** — Q&A, Summarisation, Code Generation, RAG (with context)
- **Automatic evaluation** — Relevancy, Faithfulness, Hallucination Rate using `all-MiniLM-L6-v2` embeddings
- **Real-time progress** — Shows which model is currently running with pill indicators and live count
- **Stop/Cancel** — Cancel any running benchmark mid-run
- **LangSmith tracing** — Every model call traced to `smith.langchain.com` for full observability
- **Dark / Light mode** — Toggle with Sun/Moon icon in the header, persisted to localStorage
- **Structured logging** — `logs/app.log` (all logs) + `logs/errors.log` (errors only, in visual blocks)
- **Zero API cost** — All models run locally via Ollama
- **SQLite persistence** — All runs and results stored locally, no DB server needed
- **REST API** — Full CRUD API with Swagger docs at `/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, SQLAlchemy, SQLite |
| **LLM Runtime** | Ollama (local inference) |
| **Evaluation** | sentence-transformers `all-MiniLM-L6-v2` |
| **Tracing** | LangSmith (`@traceable`) |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS (dark glassmorphism + light mode) |
| **Charts** | Recharts |
| **State** | TanStack Query |

---

## Models

| Model | Size | Best at |
|---|---|---|
| `gemma:2b` | 1.7 GB | Fast baseline |
| `phi3:mini` | 2.2 GB | Instruction following, reasoning |
| `deepseek-coder:6.7b` | 3.8 GB | Code generation |
| `mistral:7b` | 4.4 GB | General Q&A |
| `llama3.1:8b` | 4.9 GB | General, strongest |

---

## Evaluation Metrics

| Metric | Description |
|---|---|
| **Relevancy Score** | Cosine similarity between prompt and response embeddings (0–1) |
| **Faithfulness Score** | Cosine similarity between context and response — RAG tasks only (0–1) |
| **Hallucination Rate** | `1 − Faithfulness` — lower is better (0–1) |
| **Latency (ms)** | Wall-clock time for the model to generate its response |
| **Token Count** | Prompt + completion tokens reported by Ollama |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running

### 1. Pull models

```bash
ollama pull gemma:2b
ollama pull phi3:mini
ollama pull deepseek-coder:6.7b
ollama pull mistral:7b
ollama pull llama3.1:8b
```

### 2. Clone and install

```bash
git clone https://github.com/Aditya-Dey012/LLM-benchmark-dashboard
cd llm-benchmark-dashboard

# Backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 3. Configure environment

```bash
# .env (already configured)
OLLAMA_BASE_URL=http://localhost:11434
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_key_here
LANGSMITH_PROJECT=llm-benchmark-dashboard
DATABASE_URL=sqlite:///./benchmark.db
```

### 4. Run

**Terminal 1 — Backend:**
```bash
python backend/run.py
# → http://localhost:8000  |  Swagger: http://localhost:8000/docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## Running a Benchmark

1. Open `http://localhost:5173`
2. Click **+ New Benchmark**
3. Fill in a name, select task type, enter your prompt
4. All 5 models are pre-selected — deselect any you want to skip
5. Click **Run Benchmark**
6. Watch real-time progress — each model pill turns blue (running) then green (done)
7. View scores, responses, and charts when complete

### RAG Benchmark

Select **RAG** as the task type, paste your context document, and the system also computes **Faithfulness** and **Hallucination Rate** per model.

---

## LangSmith Tracing

With `LANGSMITH_TRACING=true` and a valid API key, every benchmark run is traced to [smith.langchain.com](https://smith.langchain.com) under the `llm-benchmark-dashboard` project. Each trace shows:

```
benchmark-run
  ├── ollama-model-call  (gemma:2b)     38.88s
  ├── ollama-model-call  (phi3:mini)    69.90s
  ├── ollama-model-call  (deepseek...)  80.91s
  ├── ollama-model-call  (mistral:7b)   101.9s
  └── ollama-model-call  (llama3.1:8b)  492.49s
```

---

## Logs

```
logs/
├── app.log       ← all INFO+ logs with timestamps
└── errors.log    ← ERROR only, each wrapped in a visual block
```

Logs rotate at 5 MB, keeping the last 5 backups.

---

## Project Structure

```
llm-benchmark-dashboard/
├── .env
├── requirements.txt
├── logs/                         ← app.log + errors.log (auto-created)
├── public/                       ← screenshots
├── backend/
│   ├── run.py                    ← entry: python backend/run.py
│   └── app/
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       ├── database.py
│       ├── core/
│       │   ├── config.py
│       │   └── logging_config.py
│       ├── routers/              ← benchmarks · models · results
│       └── services/
│           ├── ollama_client.py
│           ├── evaluator.py
│           └── benchmark_runner.py
└── frontend/
    └── src/
        ├── App.tsx
        ├── context/ThemeContext.tsx
        ├── pages/                ← Dashboard · NewBenchmark · Benchmarks · RunDetail
        ├── components/           ← Sidebar · Header · ScoreBar · StatusBadge
        ├── api/client.ts
        └── types/index.ts
```

---

## Resume One-Liner

> Built a self-hosted LLM evaluation platform comparing Gemma 2B, Phi-3 Mini, DeepSeek Coder 6.7B, Mistral 7B, and Llama 3.1 8B on Q&A, summarisation, code generation, and RAG tasks — measuring relevancy, faithfulness, hallucination rate, and latency with zero API cost using Ollama, LangSmith, FastAPI, and React.

---

## Interview Talking Points

- **Why local models?** Cost control, data privacy, offline capability — no OpenAI/Anthropic key needed
- **Why sequential execution?** Ollama queues requests on CPU anyway; sequential gives accurate per-model latency without timeout race conditions
- **Why these metrics?** Relevancy measures on-topic quality; faithfulness and hallucination rate are critical for production RAG systems
- **LangSmith integration?** `@traceable` decorators on the runner expose every model call as a named span — pairs with MLflow for a complete MLOps observability story
- **Scalability:** Swapping in any Ollama-supported model takes one line of config
