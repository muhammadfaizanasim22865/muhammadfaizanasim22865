export default function Header() {
  return (
    <header className="w-full border-b border-gray-700 bg-gray-900 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            DSA
          </span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              DSA Mistake Analyzer
            </h1>
            <p className="text-xs text-gray-400">
              Rule-based Python code analysis · No AI · Pure AST
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block rounded-full bg-indigo-900/60 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-700">
          v1.0.0
        </span>
      </div>
    </header>
  );
}
