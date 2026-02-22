import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Download, Info, LogOut } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { fetchJudgeStats } from "../api";
import { useLanguage } from "../LanguageContext";

interface JudgeDashboardProps {
  judgeName: string;
  onLogout: () => void;
}

type JudgeStats = {
  bailComparison: { category: string; your: number; peers: number; courtAvg: number }[];
  trendData: { label: string; your: number; peers: number }[];
  judge: string;
};

function TooltipButton({ content, label }: { content: string; label: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Info className="size-3.5" />
        {label}
      </button>
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-sm shadow-lg z-10">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45" />
          {content}
        </div>
      )}
    </div>
  );
}

const DATE_RANGE_OPTIONS: { value: string; key: "last30d" | "last90d" | "last6m" | "last1y" | "last2y" | "all" }[] = [
  { value: "30d", key: "last30d" },
  { value: "90d", key: "last90d" },
  { value: "6m", key: "last6m" },
  { value: "1y", key: "last1y" },
  { value: "2y", key: "last2y" },
  { value: "all", key: "all" },
];
const PDF_MARGIN_MM = 14;

export function JudgeDashboard({ judgeName, onLogout }: JudgeDashboardProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<JudgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("1y");
  const [pdfExporting, setPdfExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange) ? t(DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)!.key) : dateRange;

  useEffect(() => {
    setLoading(true);
    fetchJudgeStats(judgeName, dateRange)
      .then((data) => setStats(data as JudgeStats))
      .catch(() => setStats({ bailComparison: [], trendData: [], judge: judgeName }))
      .finally(() => setLoading(false));
  }, [judgeName, dateRange]);

  const handleDownloadReport = async () => {
    const el = contentRef.current;
    if (!el) return;
    setPdfExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
        includeQueryParams: true,
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = PDF_MARGIN_MM;
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = dataUrl;
      });
      const contentW = pageW - margin * 2;
      const imgH = (img.naturalHeight * contentW) / img.naturalWidth;
      const scale = imgH > pageH - margin * 2 ? (pageH - margin * 2) / imgH : 1;
      const w = contentW * scale;
      const h = imgH * scale;
      pdf.addImage(dataUrl, "PNG", margin, margin, w, h);
      pdf.save(`BailLens-Judge-Report-${judgeName.replace(/\s+/g, "-")}.pdf`);
    } catch {
      alert("Could not generate PDF. Try again.");
    } finally {
      setPdfExporting(false);
    }
  };

  const bailComparisonData = stats?.bailComparison ?? [];
  const trendData = stats?.trendData ?? [];

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.category}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-700">Judge median: <span className="font-semibold">${Number(payload[0].value).toLocaleString()}</span></p>
            <p className="text-gray-700">Court median: <span className="font-semibold">${Number(payload[1]?.value ?? payload[0].payload.courtAvg).toLocaleString()}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">Month {payload[0].payload.label}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-700">Judge median: <span className="font-semibold">${Math.round(Number(payload[0].value)).toLocaleString()}</span></p>
            <p className="text-gray-700">Court median: <span className="font-semibold">${Math.round(Number(payload[1]?.value)).toLocaleString()}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <nav className="w-full border-b border-gray-300 bg-white shadow-sm">
        <div className="mx-auto max-w-[1440px] px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-sm bg-black" />
              <div>
                <div className="text-xl font-semibold text-gray-900 tracking-tight">{t("dashboard_myDashboard")}</div>
                <div className="text-xs text-gray-600 tracking-wide">{judgeName}</div>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              <LogOut className="size-4" />
              {t("dashboard_logout")}
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">Your stats vs court</h1>
          <p className="text-gray-600">Median bail by charge and over time. Data is from your cases only.</p>
        </motion.div>

        <motion.div className="mb-6 flex justify-end" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}>
          <button
            onClick={handleDownloadReport}
            disabled={pdfExporting || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-sm transition-colors shadow-sm"
          >
            <Download className="size-4" />
            {pdfExporting ? t("dashboard_generating") : t("dashboard_downloadPdf")}
          </button>
        </motion.div>

        <div ref={contentRef} className="bg-white rounded-sm shadow-sm border border-gray-200 max-w-4xl mx-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading dashboard…</div>
          ) : (
            <div className="p-8 md:p-10">
              {/* Report header: judge name + data period (shown in view and in PDF) */}
              <div className="mb-10 pb-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{judgeName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Data period: {dateRangeLabel}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  BailLens Judge Report — median bail by charge and over time
                </p>
              </div>

              {/* Median Bail by Charge */}
              <motion.div
                className="mb-10 bg-gray-50/80 border border-gray-200 rounded-sm p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 tracking-tight">Median bail by charge</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Your median vs court median by charge type</p>
                  </div>
                  <TooltipButton label={t("dashboard_whyMatters")} content="Comparing your median bail to the court median by charge helps identify consistency. Variations may reflect case mix or local practice." />
                </div>
                <div>
                  {bailComparisonData.length === 0 ? (
                    <p className="text-sm text-gray-500 py-8 text-center">No charge-level data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={bailComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 10, fill: "#374151", fontWeight: 500 }}
                          axisLine={{ stroke: "#d1d5db" }}
                          tickLine={{ stroke: "#d1d5db" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                          axisLine={{ stroke: "#d1d5db" }}
                          tickLine={{ stroke: "#d1d5db" }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                        <Bar dataKey="your" fill="#3b82f6" name="Judge median" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="courtAvg" fill="#94a3b8" name="Court median" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {bailComparisonData.length > 0 && (
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-blue-500" />
                        <span className="text-xs text-gray-600">Judge median</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-slate-400" />
                        <span className="text-xs text-gray-600">Court median</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bail amount trend by month */}
              <motion.div
                className="bg-gray-50/80 border border-gray-200 rounded-sm p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 tracking-tight">Bail amount trend (by month)</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Your median bail vs court median per month</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="judge-trend-range" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Period
                    </label>
                    <select
                      id="judge-trend-range"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.key)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <TooltipButton label={t("dashboard_whyMatters")} content="This trend shows how your median bail and the court median change month over month. Use it to see alignment and variation over time." />
                </div>
                <div>
                  {trendData.length === 0 ? (
                    <p className="text-sm text-gray-500 py-10 text-center">No trend data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                          axisLine={{ stroke: "#d1d5db" }}
                          tickLine={{ stroke: "#d1d5db" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                          axisLine={{ stroke: "#d1d5db" }}
                          tickLine={{ stroke: "#d1d5db" }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip content={<CustomLineTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="your"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#fff" }}
                          name="Judge median"
                        />
                        <Line
                          type="monotone"
                          dataKey="peers"
                          stroke="#94a3b8"
                          strokeWidth={3}
                          dot={{ fill: "#94a3b8", r: 4, strokeWidth: 2, stroke: "#fff" }}
                          strokeDasharray="5 5"
                          name="Court median"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {trendData.length > 0 && (
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-blue-500" />
                        <span className="text-xs text-gray-600">Judge median</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-slate-400" style={{ borderStyle: "dashed", borderWidth: 1 }} />
                        <span className="text-xs text-gray-600">Court median</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-sm p-6">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">About this dashboard</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                This dashboard is for your professional development. Comparisons are anonymized and aggregated. Differences often reflect case mix and local factors. Use these insights as one tool among many for your growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
