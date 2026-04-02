export interface AnalyzeRequest {
  code: string;
}

export interface AnalyzeResponse {
  time_complexity: string;
  space_complexity: string;
  pattern_detected: string;
  mistakes: string[];
  suggestions: string[];
}

export interface AnalyzeError {
  error: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function analyzeCode(
  code: string
): Promise<AnalyzeResponse | AnalyzeError> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  return data;
}

export function isError(
  result: AnalyzeResponse | AnalyzeError
): result is AnalyzeError {
  return "error" in result;
}
