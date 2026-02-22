import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchDistribution, fetchDistributionByCategory, type DistributionByCategoryEntry } from "../api";

const COLORS = [
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
];

interface DistributionEntry {
  range: string;
  count: number;
}

interface BailDistributionProps {
  dateRange: string;
}

export function BailDistribution({ dateRange }: BailDistributionProps) {
  const [data, setData] = useState<DistributionEntry[]>([]);
  const [byCategory, setByCategory] = useState<DistributionByCategoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setData([]);
    setByCategory([]);
    Promise.all([
      fetchDistribution(dateRange),
      fetchDistributionByCategory(dateRange),
    ])
      .then(([d, cat]) => {
        setData(Array.isArray(d) ? d : []);
        setByCategory(Array.isArray(cat) ? cat : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load distribution"));
  }, [dateRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">
            {payload[0].payload.range}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Cases:{" "}
            <span className="font-semibold text-gray-900">
              {payload[0].value.toLocaleString()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const categoriesWithData = byCategory.filter((c) => c.count > 0);

  if (error) {
    return (
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-h-[400px] p-6 text-gray-500">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-h-[400px]">
        <div className="border-b border-gray-300 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Bail Distribution
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Number of cases by bail amount range
          </p>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm flex flex-col min-h-[320px]">
        <div className="border-b border-gray-300 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Bail Distribution (overall)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Number of cases by bail amount range
          </p>
        </div>
        <div className="flex-1 p-6 min-h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="range"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoriesWithData.length > 0 && (
        <div className="bg-white rounded-sm border border-gray-300 shadow-sm flex flex-col">
          <div className="border-b border-gray-300 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              By crime category
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Case counts by category
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={categoriesWithData}
                margin={{ top: 10, right: 10, left: 0, bottom: 80 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#374151" }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={120}
                  tick={{ fontSize: 10, fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]} minPointSize={4}>
                  {categoriesWithData.map((_, index) => (
                    <Cell key={categoriesWithData[index].category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
