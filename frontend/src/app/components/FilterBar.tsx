import { Filter } from "lucide-react";

interface FilterBarProps {
  chargeType: string;
  dateRange: string;
  viewMode: 'bail' | 'disparity';
  onChargeTypeChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onViewModeChange: (value: 'bail' | 'disparity') => void;
}

export function FilterBar({
  chargeType,
  dateRange,
  viewMode,
  onChargeTypeChange,
  onDateRangeChange,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 mr-2">
          <Filter className="size-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">Filters</span>
        </div>
        
        <div className="flex-1 flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="charge-type" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Charge Type
            </label>
            <select
              id="charge-type"
              value={chargeType}
              onChange={(e) => onChargeTypeChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm min-w-[160px]"
            >
              <option value="all">All Charges</option>
              <option value="felony">Felony</option>
              <option value="misdemeanor">Misdemeanor</option>
              <option value="drug">Drug Offenses</option>
              <option value="property">Property Crimes</option>
            </select>
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
            </select>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">View Mode</label>
          <div className="flex items-center gap-0 border border-gray-300 rounded-sm overflow-hidden shadow-sm">
            <button
              onClick={() => onViewModeChange('bail')}
              className={`px-5 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                viewMode === 'bail'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Bail Amounts
            </button>
            <button
              onClick={() => onViewModeChange('disparity')}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                viewMode === 'disparity'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Disparity Index
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
