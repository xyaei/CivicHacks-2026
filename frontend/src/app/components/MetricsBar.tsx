import { useEffect, useState } from "react";
import { DollarSign, Scale, Database, Users } from "lucide-react";
import { fetchSummary } from "../api";

function MetricCard({
  icon,
  label,
  value,
  valueClassName = "text-2xl font-semibold text-gray-900 mb-1",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-center w-9 h-9 rounded bg-gray-100">
        {icon}
      </div>
      <div className={valueClassName}>{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-600">{label}</div>
    </div>
  );
}

interface MetricsBarProps {
  dateRange: string;
}

export function MetricsBar({ dateRange }: MetricsBarProps) {
  const [summary, setSummary] = useState<{
    total_cases?: number;
    median_bond?: number;
    mean_bond?: number;
    most_common_crime?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetchSummary(dateRange)
      .then(setSummary)
      .catch((e: Error) => setError(e.message || "Failed to load metrics"));
  }, [dateRange]);

  if (error) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-4 bg-amber-50 border border-amber-200 rounded-sm p-4 text-amber-800 text-sm">
          {error}. (Start the backend with <code className="bg-amber-100 px-1">uvicorn app.main:app --reload</code> in the backend folder.)
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm h-[100px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalCases = summary.total_cases ?? 0;
  const medianBond = summary.median_bond ?? 0;
  const meanBond = summary.mean_bond ?? 0;
  const mostCommonCrime = summary.most_common_crime?.trim() || "—";
  const crimeDisplay = mostCommonCrime.length > 40 ? mostCommonCrime.slice(0, 37) + "…" : mostCommonCrime;

  return (
    <div className="mb-6 grid grid-cols-4 gap-4">
      <MetricCard icon={<Database className="size-5 text-gray-700" />} label="Total Cases" value={totalCases.toLocaleString()} />
      <MetricCard icon={<Users className="size-5 text-gray-700" />} label="Median Bail Amount" value={`$${medianBond.toLocaleString()}`} />
      <MetricCard icon={<DollarSign className="size-5 text-gray-700" />} label="Mean Bail Amount" value={`$${meanBond.toLocaleString()}`} valueClassName="text-sm font-semibold text-gray-900 mb-1" />
      <MetricCard icon={<Scale className="size-5 text-gray-700" />} label="Most Common Crime" value={crimeDisplay} valueClassName="text-sm font-semibold text-gray-900 mb-1 leading-tight" />
    </div>
  );
}
