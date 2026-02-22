import { Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function FilterBar({
  dateRange,
  onDateRangeChange,
}: FilterBarProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 mr-2">
          <Filter className="size-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">{t("filterBar_dateRange")}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date-range" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {t("filterBar_dateRange")}
          </label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm min-w-[160px]"
          >
            <option value="30d">{t("last30d")}</option>
            <option value="90d">{t("last90d")}</option>
            <option value="6m">{t("last6m")}</option>
            <option value="1y">{t("last1y")}</option>
            <option value="2y">{t("last2y")}</option>
            <option value="all">{t("all")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
