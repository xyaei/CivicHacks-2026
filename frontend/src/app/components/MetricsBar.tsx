import { TrendingDown, Clock, Database, Users } from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'neutral' | 'negative';
}

function MetricCard({ icon, label, value, change, changeType }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            changeType === 'positive' ? 'bg-blue-50 text-blue-700' :
            changeType === 'negative' ? 'bg-gray-100 text-gray-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</div>
    </div>
  );
}

interface MetricsBarProps {
  dateRange: string;
}

// Mock function to calculate total cases based on date range
const getTotalCases = (dateRange: string) => {
  switch (dateRange) {
    case '30d':
      return { value: '1,417', change: '+8.3%' };
    case '90d':
      return { value: '4,289', change: '+12.1%' };
    case '6m':
      return { value: '8,542', change: '+6.7%' };
    case '1y':
      return { value: '16,924', change: '+9.4%' };
    default:
      return { value: '1,417', change: '+8.3%' };
  }
};

export function MetricsBar({ dateRange }: MetricsBarProps) {
  const totalCases = getTotalCases(dateRange);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <MetricCard
        icon={<Database className="size-5 text-gray-700" />}
        label="Total Cases"
        value={totalCases.value}
        change={totalCases.change}
        changeType="neutral"
      />
      <MetricCard
        icon={<Users className="size-5 text-gray-700" />}
        label="Median Bail Amount"
        value="$12,450"
        change="-3.2%"
        changeType="positive"
      />
      <MetricCard
        icon={<Clock className="size-5 text-gray-700" />}
        label="Avg Release Time"
        value="16.2 hrs"
        change="-11.5%"
        changeType="positive"
      />
      <MetricCard
        icon={<TrendingDown className="size-5 text-gray-700" />}
        label="Disparity Index"
        value="0.18"
        change="Stable"
        changeType="neutral"
      />
    </div>
  );
}