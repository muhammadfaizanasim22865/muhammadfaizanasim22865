// All analysis now runs entirely in-browser via Pyodide — no backend required.
export type { AnalyzeResponse, AnalyzeError } from "./pyodideAnalyzer";
export { analyzeCode, isError } from "./pyodideAnalyzer";
