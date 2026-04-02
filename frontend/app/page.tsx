"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CodeEditor from "@/components/CodeEditor";
import ResultsPanel from "@/components/ResultsPanel";
import { analyzeCode, isError, AnalyzeResponse } from "@/services/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (code: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzeCode(code);
      if (isError(data)) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not connect to the analysis server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Analyze Your DSA Solution
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            Paste your Python DSA code below and click{" "}
            <span className="text-indigo-400 font-medium">Analyze Code</span>.
            The engine uses Python&apos;s{" "}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs font-mono text-indigo-300">
              ast
            </code>{" "}
            module to detect complexity, patterns, and common mistakes — no AI, no API keys.
          </p>
        </div>

        {/* Editor */}
        <section className="mb-8">
          <CodeEditor onAnalyze={handleAnalyze} loading={loading} />
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-800 bg-red-900/20 px-5 py-4 text-sm text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && <ResultsPanel result={result} />}
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        DSA Mistake Analyzer · Rule-based AST analysis · No AI or API keys required
      </footer>
    </div>
  );
}

