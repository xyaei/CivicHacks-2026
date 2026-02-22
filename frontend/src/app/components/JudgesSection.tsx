import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { fetchJudges, fetchJudgeStats, fetchOutlierBrief, playTts } from "../api";

type JudgeStats = {
  bailComparison: { category: string; your: number; peers: number; courtAvg: number }[];
  judge: string;
};

export function JudgesSection() {
  const [judges, setJudges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefSpeaking, setBriefSpeaking] = useState(false);

  useEffect(() => {
    setError(null);
    fetchJudges()
      .then((list) => setJudges(Array.isArray(list) ? list : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load judges"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setStats(null);
      setExpandedCategory(null);
      setBrief(null);
      return;
    }
    setStats(null);
    setExpandedCategory(null);
    setBrief(null);
    fetchJudgeStats(selected)
      .then(setStats)
      .catch(() => setStats({ bailComparison: [], judge: selected }));
  }, [selected]);

  const requestBrief = (category: string, your: number, courtAvg: number) => {
    if (!selected) return;
    setExpandedCategory(category);
    setBrief(null);
    fetchOutlierBrief(selected, category, your, courtAvg)
      .then((r) => setBrief(r.ai_summary ?? ""))
      .catch(() => setBrief("Could not load brief."));
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Judges</h3>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Judges</h3>
        <p className="text-sm text-amber-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      <div className="border-b border-gray-300 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Judges</h3>
        <p className="text-sm text-gray-600 mt-1">Select a judge to view bail comparison and AI brief</p>
      </div>
      <div className="p-6 flex flex-col gap-6">
        <div className="min-w-[200px] max-w-xs">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Judge</label>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-sm text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">— Select —</option>
            {judges.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
        {stats && (
          <div className="w-full min-w-0">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bail by charge (median)</label>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-1 pr-4">Charge</th>
                    <th className="py-1 pr-2">Judge</th>
                    <th className="py-1 pr-2">Court avg</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bailComparison.map((row) => (
                    <tr key={row.category} className="border-b border-gray-100">
                      <td className="py-1.5 pr-4 text-gray-900 max-w-[200px] truncate" title={row.category}>{row.category}</td>
                      <td className="py-1.5 pr-2">${row.your.toLocaleString()}</td>
                      <td className="py-1.5 pr-2">${row.courtAvg.toLocaleString()}</td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => requestBrief(row.category, row.your, row.courtAvg)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          AI brief
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {expandedCategory && (
              <div className="mt-3 rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1">{brief === null ? "Loading…" : brief}</span>
                  {brief !== null && brief !== "Could not load brief." && brief.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (briefSpeaking) return;
                        setBriefSpeaking(true);
                        playTts(brief).finally(() => setBriefSpeaking(false));
                      }}
                      disabled={briefSpeaking}
                      className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                      title="Read aloud"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
