import { AnalyzeResponse } from "@/services/api";

const complexityColor = (val: string) => {
  if (val.includes("n³") || val.includes("n^3")) return "text-red-400 bg-red-900/30 border-red-800";
  if (val.includes("n²") || val.includes("n^2")) return "text-orange-400 bg-orange-900/30 border-orange-800";
  if (val.includes("n log") || val.includes("n log")) return "text-yellow-400 bg-yellow-900/30 border-yellow-800";
  if (val.includes("log")) return "text-green-400 bg-green-900/30 border-green-800";
  if (val === "O(n)") return "text-blue-400 bg-blue-900/30 border-blue-800";
  return "text-emerald-400 bg-emerald-900/30 border-emerald-800";
};

const patternColor = (pat: string) => {
  const map: Record<string, string> = {
    "Brute Force": "bg-red-900/40 text-red-300 border-red-700",
    Hashing: "bg-purple-900/40 text-purple-300 border-purple-700",
    "Two Pointers": "bg-blue-900/40 text-blue-300 border-blue-700",
    "Sliding Window": "bg-cyan-900/40 text-cyan-300 border-cyan-700",
    "Binary Search": "bg-green-900/40 text-green-300 border-green-700",
    "DFS/BFS": "bg-yellow-900/40 text-yellow-300 border-yellow-700",
    Recursion: "bg-indigo-900/40 text-indigo-300 border-indigo-700",
    "Linear Scan": "bg-gray-800 text-gray-300 border-gray-600",
    Unknown: "bg-gray-800 text-gray-400 border-gray-600",
  };
  return map[pat] ?? "bg-gray-800 text-gray-300 border-gray-600";
};

interface Props {
  result: AnalyzeResponse;
}

export default function ResultsPanel({ result }: Props) {
  const timeClass = complexityColor(result.time_complexity);
  const spaceClass = complexityColor(result.space_complexity);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary card */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
          Analysis Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Time */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Time Complexity</span>
            <span className={`inline-block self-start rounded-md border px-3 py-1 text-lg font-bold font-mono ${timeClass}`}>
              {result.time_complexity}
            </span>
          </div>
          {/* Space */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Space Complexity</span>
            <span className={`inline-block self-start rounded-md border px-3 py-1 text-lg font-bold font-mono ${spaceClass}`}>
              {result.space_complexity}
            </span>
          </div>
          {/* Pattern */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Pattern Detected</span>
            <span className={`inline-block self-start rounded-md border px-3 py-1 text-sm font-semibold ${patternColor(result.pattern_detected)}`}>
              {result.pattern_detected}
            </span>
          </div>
        </div>
      </div>

      {/* Mistakes */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-900/60 text-red-400 text-xs">!</span>
          Mistakes
          <span className="ml-auto rounded-full bg-red-900/50 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-800">
            {result.mistakes.length}
          </span>
        </h2>
        {result.mistakes.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-800 bg-green-900/20 px-4 py-3 text-sm text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            No mistakes detected — great job!
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.mistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-red-900/60 bg-red-900/10 px-4 py-3 text-sm text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Suggestions */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900/60 text-indigo-400 text-xs">→</span>
          Suggestions
          <span className="ml-auto rounded-full bg-indigo-900/50 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-800">
            {result.suggestions.length}
          </span>
        </h2>
        <ul className="flex flex-col gap-2">
          {result.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-indigo-900/60 bg-indigo-900/10 px-4 py-3 text-sm text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.116.113.186.175A5.5 5.5 0 017.5 9.5c0 .337.07.65.186.907.43.896 1.329 1.57 2.314 1.904v-4.63A5.5 5.5 0 018.33 8.62z" />
                <path fillRule="evenodd" d="M9.555 1.166A1 1 0 0110.845 1.5l2.5 4.75a1 1 0 01-.895 1.45H8.55a1 1 0 01-.895-1.45l2.5-4.75a1 1 0 01-.6-.334zM10 4.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0V5a.5.5 0 01.5-.5z" clipRule="evenodd" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
