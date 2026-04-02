"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const DEFAULT_CODE = `def two_sum(arr, target):
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] + arr[j] == target:
                return [i, j]
`;

// Configure Monaco loader to use local files (no CDN needed)
// Must be done before any editor is mounted
if (typeof window !== "undefined") {
  import("@monaco-editor/react").then(({ loader }) => {
    loader.config({ paths: { vs: "/monaco-editor/min/vs" } });
  });
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center bg-[#1e1e1e] rounded-lg text-gray-500 text-sm">
      Loading editor…
    </div>
  ),
});

interface Props {
  onAnalyze: (code: string) => void;
  loading: boolean;
}

export default function CodeEditor({ onAnalyze, loading }: Props) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-gray-700 shadow-xl">
        {/* Editor title bar */}
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-gray-700">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-3 text-xs text-gray-400 font-mono">solution.py</span>
        </div>

        {mounted ? (
          <MonacoEditor
            height="340px"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            }}
          />
        ) : (
          <div className="flex h-[340px] items-center justify-center bg-[#1e1e1e] text-gray-500 text-sm">
            Loading editor…
          </div>
        )}
      </div>

      <button
        onClick={() => onAnalyze(code)}
        disabled={loading || !code.trim()}
        className="self-end flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyzing…
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .292 2.798-1.132 2.798H3.93c-1.424 0-2.132-1.798-1.132-2.798L4.2 15.3" />
            </svg>
            Analyze Code
          </>
        )}
      </button>
    </div>
  );
}

