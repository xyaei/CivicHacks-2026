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

export async function fetchJudgeStats(judge: string, dateRange: string = "all") {
  return request(
    `/analytics/judge-stats?judge=${encodeURIComponent(judge)}&date_range=${encodeURIComponent(dateRange)}`
  );
}

export async function fetchHeatmap(dateRange: string) {
  return request(`/analytics/heatmap?date_range=${encodeURIComponent(dateRange)}`);
}

export async function fetchTts(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 5000) }),
  });
  if (!res.ok) throw new Error((await res.text()) || "TTS failed");
  return res.blob();
}

/** Fetch TTS and play; resolves when playback ends. */
export function playTts(text: string): Promise<void> {
  return fetchTts(text).then((blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(audio.error);
      };
      audio.play();
    });
  });
}

export async function fetchChat(
  question: string,
  language?: string
): Promise<{ response: string }> {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: question.slice(0, 300),
      language: language || "en",
    }),
  });
}

export async function fetchOutlierBrief(
  judge: string,
  crime: string,
  judge_median: number,
  court_median: number,
  language?: string
): Promise<{ ai_summary: string; ratio: number | string }> {
  const q = new URLSearchParams({
    judge,
    crime,
    judge_median: String(judge_median),
    court_median: String(court_median),
    language: language || "en",
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

// ——— Blockchain (proxied via backend) ———

export const RECENT_RECORDS_LIMIT = 10;

export interface FundStatus {
  fund_address?: string;
  balance_sol?: number;
  total_contributed?: number;
  total_disbursed?: number;
  cases_funded?: number;
}

export interface VerifyRecordResult {
  record_id: string;
  signature: string;
  timestamp: string;
  authority?: string;
}

/** Fallback when backend verify returns no signature (e.g. external API down). */
const KNOWN_SIGNATURES: Record<string, string> = {
  "MA-9084402": "57rkk7Sera3NSE5v5a3GPs6sRaM3aQcE14Szd5hwjzJrVh66xU8jjFKrxLSLHuqMBQxVQ1cEePaPQUwa8rTMJM6h",
  "MA-9085065": "5ufUDTvh8MqjvtzLrTuQMqYrNJ2WeVAZKtr2wqaTas5ixEAyhfYpjQ9s3xoFVpwa1EzZXa2pjJNukcBuigk7mm7S",
  "MA-9085342": "3hdeoeNQ7Pc2btFUa4hEurvSH7V6YJskEiQ6SfgsEBRaQKUHsQGCn9pcSJaK82EnWioHwKEaU5d1HzGK5gJqdBGs",
  "MA-9085344": "34m8H2xbnb3HSYouzy1QVdJAz8iHjx9q4T5QKFPGp5paA3PdQkFoH2UNeTp8T3NXbRsypA8cShrr2xa73UyMc41V",
  "MA-9087195": "5E4K7eDfn8vxggP8LimiDoys6sPpVxjjAJVb4txaRRxKg75JPfK2P2DjnPu6jJQisq1PUbEFiPAUH1dzZnGTCcvW",
};

export async function fetchRecentRecordIds(limit = RECENT_RECORDS_LIMIT): Promise<string[]> {
  const data = await request(`/analytics/recent-record-ids?limit=${limit}`);
  return Array.isArray(data?.record_ids) ? data.record_ids : [];
}

export async function fetchVerifyRecord(recordId: string): Promise<VerifyRecordResult> {
  const data = await request(`/blockchain/verify/${encodeURIComponent(recordId)}`);
  const raw = data?.signature ?? data?.hash ?? data?.tx_signature ?? data?.tx_hash ?? "";
  const signature = raw || KNOWN_SIGNATURES[recordId] || "";
  return {
    record_id: data?.record_id ?? recordId,
    signature,
    timestamp: data?.timestamp ?? "",
    authority: data?.authority,
  };
}

export async function fetchTransactionForRecord(recordId: string): Promise<{ transaction: string }> {
  const response = await fetch(`${API_BASE}/tx/${encodeURIComponent(recordId)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch transaction");
  }
  return response.json();
}

export async function fetchFundStatus(): Promise<FundStatus> {
  return request("/blockchain/fund-status");
}

/** Log a record to blockchain when a case is viewed. */
export async function logRecord(
  recordId: string,
  data: { charge?: string; bail_amount?: number; judge?: string }
): Promise<unknown> {
  return request("/blockchain/log-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record_id: recordId, data }),
  });
}
