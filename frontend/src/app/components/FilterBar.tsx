import { Filter } from "lucide-react";

interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function FilterBar({
  dateRange,
  onDateRangeChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 mr-2">
          <Filter className="size-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">Filters</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date-range" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Date Range
          </label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm min-w-[160px]"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="2y">Last 2 Years</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
    </div>
  );
}
