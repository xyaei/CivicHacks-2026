const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || "/api";

async function request(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSummary(dateRange: string) {
  return request(`/analytics/summary?date_range=${encodeURIComponent(dateRange)}`);
}

export async function fetchDistribution(dateRange: string) {
  return request(`/analytics/distribution?date_range=${encodeURIComponent(dateRange)}`);
}

export interface DistributionByCategoryEntry {
  category: string;
  count: number;
  histogram: { range: string; count: number }[];
}

export async function fetchDistributionByCategory(dateRange: string): Promise<DistributionByCategoryEntry[]> {
  const data = await request(`/analytics/distribution-by-category?date_range=${encodeURIComponent(dateRange)}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchJudges() {
  return request("/analytics/judges");
}

export async function fetchJudgeStats(judge: string) {
  return request(`/analytics/judge-stats?judge=${encodeURIComponent(judge)}`);
}

export async function fetchHeatmap(dateRange: string) {
  return request(`/analytics/heatmap?date_range=${encodeURIComponent(dateRange)}`);
}

export async function fetchChat(question: string): Promise<{ response: string }> {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question.slice(0, 300) }),
  });
}

export async function fetchOutlierBrief(
  judge: string,
  crime: string,
  judge_median: number,
  court_median: number
): Promise<{ ai_summary: string; ratio: number | string }> {
  const q = new URLSearchParams({
    judge,
    crime,
    judge_median: String(judge_median),
    court_median: String(court_median),
  });
  return request(`/analytics/outlier-brief?${q}`);
}

export async function fetchOutliers(): Promise<
  { judge: string; crime_committed: string; judge_median: number; court_median: number; status: string }[]
> {
  try {
    const data = await request("/analytics/outliers");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
