import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import NewBenchmark from "./pages/NewBenchmark";
import Benchmarks from "./pages/Benchmarks";
import RunDetail from "./pages/RunDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, retry: 1 },
  },
});

export default function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-gray-950">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6 animate-fade-in">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/benchmark/new" element={<NewBenchmark />} />
                <Route path="/benchmarks" element={<Benchmarks />} />
                <Route path="/benchmark/:id" element={<RunDetail />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
