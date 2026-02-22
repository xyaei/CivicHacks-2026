import { useState } from 'react';
import { motion } from 'motion/react';
import { Scale, Download, Info, TrendingDown, Users, BarChart3, LogOut, Search } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface JudgeDashboardProps {
  onLogout: () => void;
}

type TimePeriod = 'day' | 'week' | '1month' | '3month' | 'ytd' | '1year' | 'all';

// Mock data
const bailComparisonData = [
  { category: 'Misdemeanor', your: 4200, peers: 3800, courtAvg: 4100 },
  { category: 'Felony', your: 15000, peers: 14200, courtAvg: 14800 },
  { category: 'Drug Offense', your: 8500, peers: 7900, courtAvg: 8200 },
  { category: 'Property Crime', your: 6800, peers: 6500, courtAvg: 6700 },
];

// Generate trend data based on time period
const generateTrendData = (period: TimePeriod) => {
  switch (period) {
    case 'day':
      // Last 30 days
      return Array.from({ length: 30 }, (_, i) => ({
        label: `Day ${i + 1}`,
        your: 9500 + Math.random() * 2000 - 1000,
        peers: 10300 + Math.random() * 2000 - 1000,
      }));
    
    case 'week':
      // Last 12 weeks
      return Array.from({ length: 12 }, (_, i) => ({
        label: `Week ${i + 1}`,
        your: 9500 + Math.random() * 3000 - 1500,
        peers: 10300 + Math.random() * 3000 - 1500,
      }));
    
    case '1month':
      // Last 12 months
      return [
        { label: 'Mar', your: 12500, peers: 11800 },
        { label: 'Apr', your: 13200, peers: 12100 },
        { label: 'May', your: 11800, peers: 11500 },
        { label: 'Jun', your: 12900, peers: 12300 },
        { label: 'Jul', your: 12100, peers: 11900 },
        { label: 'Aug', your: 11500, peers: 11600 },
        { label: 'Sep', your: 11200, peers: 11400 },
        { label: 'Oct', your: 10800, peers: 11200 },
        { label: 'Nov', your: 10500, peers: 11000 },
        { label: 'Dec', your: 10200, peers: 10800 },
        { label: 'Jan', your: 9800, peers: 10500 },
        { label: 'Feb', your: 9500, peers: 10300 },
      ];
    
    case '3month':
      // Last 4 quarters
      return [
        { label: 'Q2 2025', your: 12500, peers: 11800 },
        { label: 'Q3 2025', your: 11600, peers: 11633 },
        { label: 'Q4 2025', your: 10500, peers: 11000 },
        { label: 'Q1 2026', your: 9767, peers: 10267 },
      ];
    
    case 'ytd':
      // Year to date (Jan, Feb)
      return [
        { label: 'Jan', your: 9800, peers: 10500 },
        { label: 'Feb', your: 9500, peers: 10300 },
      ];
    
    case '1year':
      // Same as 1 month for this demo
      return [
        { label: 'Mar', your: 12500, peers: 11800 },
        { label: 'Apr', your: 13200, peers: 12100 },
        { label: 'May', your: 11800, peers: 11500 },
        { label: 'Jun', your: 12900, peers: 12300 },
        { label: 'Jul', your: 12100, peers: 11900 },
        { label: 'Aug', your: 11500, peers: 11600 },
        { label: 'Sep', your: 11200, peers: 11400 },
        { label: 'Oct', your: 10800, peers: 11200 },
        { label: 'Nov', your: 10500, peers: 11000 },
        { label: 'Dec', your: 10200, peers: 10800 },
        { label: 'Jan', your: 9800, peers: 10500 },
        { label: 'Feb', your: 9500, peers: 10300 },
      ];
    
    case 'all':
      // Last 3 years by quarter
      return [
        { label: 'Q1 2024', your: 14200, peers: 13800 },
        { label: 'Q2 2024', your: 13800, peers: 13500 },
        { label: 'Q3 2024', your: 13200, peers: 12900 },
        { label: 'Q4 2024', your: 12800, peers: 12400 },
        { label: 'Q1 2025', your: 12600, peers: 12200 },
        { label: 'Q2 2025', your: 12500, peers: 11800 },
        { label: 'Q3 2025', your: 11600, peers: 11633 },
        { label: 'Q4 2025', your: 10500, peers: 11000 },
        { label: 'Q1 2026', your: 9767, peers: 10267 },
      ];
    
    default:
      return [];
  }
};

const releaseRatesData = [
  { timeframe: 'Within 24h', your: 68, peers: 72, courtAvg: 70 },
  { timeframe: 'Within 48h', your: 85, peers: 87, courtAvg: 86 },
  { timeframe: 'Within 72h', your: 94, peers: 95, courtAvg: 94 },
];

const disparityData = [
  { demographic: 'Overall Index', your: 0.12, peers: 0.15, benchmark: 0.10 },
  { demographic: 'By Income Level', your: 0.18, peers: 0.22, benchmark: 0.15 },
  { demographic: 'By Geography', your: 0.09, peers: 0.12, benchmark: 0.08 },
];

const peerComparisons = [
  { id: 'A', avgBail: 9200, releaseRate: 88, disparityIndex: 0.14, trend: 'improving' },
  { id: 'B', avgBail: 11500, releaseRate: 84, disparityIndex: 0.16, trend: 'stable' },
  { id: 'C', avgBail: 10800, releaseRate: 86, disparityIndex: 0.11, trend: 'improving' },
];

function TooltipButton({ content }: { content: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Info className="size-3.5" />
        Why this matters
      </button>
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-sm shadow-lg z-10">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
}

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: '1month', label: '1M' },
    { value: '3month', label: '3M' },
    { value: 'ytd', label: 'YTD' },
    { value: '1year', label: '1Y' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="flex items-center gap-0 border border-gray-300 rounded-sm overflow-hidden shadow-sm">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-300 last:border-r-0 ${
            selected === period.value
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export function JudgeDashboard({ onLogout }: JudgeDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1month');
  const [searchQuery, setSearchQuery] = useState('');
  const trendData = generateTrendData(timePeriod);

  const handleDownloadReport = () => {
    console.log('Downloading PDF report...');
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.category}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-700">Your Average: <span className="font-semibold">${payload[0].value.toLocaleString()}</span></p>
            <p className="text-gray-700">Peer Median: <span className="font-semibold">${payload[1].value.toLocaleString()}</span></p>
            <p className="text-gray-700">Court Average: <span className="font-semibold">${payload[2].value.toLocaleString()}</span></p>
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
          <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.label}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-700">Your Average: <span className="font-semibold">${Math.round(payload[0].value).toLocaleString()}</span></p>
            <p className="text-gray-700">Peer Median: <span className="font-semibold">${Math.round(payload[1].value).toLocaleString()}</span></p>
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
      {/* Header */}
      <nav className="w-full border-b border-gray-300 bg-white shadow-sm">
        <div className="mx-auto max-w-[1440px] px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded">
                <Scale className="size-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900 tracking-tight">
                  Professional Development Dashboard
                </div>
                <div className="text-xs text-gray-600 tracking-wide">
                  Confidential Analytics • For Your Growth Only
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-8 py-8">
        {/* Page Header with Search */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                Your Stats vs Court Peers
              </h1>
              <p className="text-gray-600">
                These insights are designed to support your professional development and continuous improvement. 
                All peer data is anonymized and aggregated.
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search metrics, trends, or data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Download Button */}
        <motion.div 
          className="mb-6 flex justify-end"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-sm transition-colors shadow-sm"
          >
            <Download className="size-4" />
            Download PDF Report
          </button>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          {/* Median Bail Comparison - Spans 2 columns */}
          <div className="col-span-2 bg-white border border-gray-300 rounded-sm shadow-sm">
            <div className="border-b border-gray-300 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                    Median Bail Comparison
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Your average bail amounts compared to peer medians by charge type
                  </p>
                </div>
                <TooltipButton content="Understanding how your bail decisions compare to peers helps identify opportunities for consistency and fairness. Variations may reflect different case complexities or defendant circumstances." />
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bailComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="your" fill="#3b82f6" name="Your Average" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="peers" fill="#94a3b8" name="Peer Median" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="courtAvg" fill="#cbd5e1" name="Court Average" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Your Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-slate-400"></div>
                  <span className="text-xs text-gray-600">Peer Median</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-slate-300"></div>
                  <span className="text-xs text-gray-600">Court Average</span>
                </div>
              </div>
            </div>
          </div>

          {/* Release Rates */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
            <div className="border-b border-gray-300 px-6 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                    Release Rates
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Percentage of defendants released
                  </p>
                </div>
              </div>
              <TooltipButton content="Faster release times can improve outcomes for defendants while maintaining public safety. These metrics help identify opportunities to streamline processes." />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {releaseRatesData.map((item) => (
                  <div key={item.timeframe}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.timeframe}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.your}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.your}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Peer Median: {item.peers}%</span>
                      <span className="text-xs text-gray-500">Court Avg: {item.courtAvg}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Second Row */}
        <motion.div 
          className="grid grid-cols-3 gap-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
        >
          {/* Bail Amount Trend with Time Period Selector */}
          <div className="col-span-2 bg-white border border-gray-300 rounded-sm shadow-sm">
            <div className="border-b border-gray-300 px-6 py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                    Bail Amount Trend
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Your average bail decisions over time compared to peer median
                  </p>
                </div>
                <TooltipButton content="This trend helps you see how your decisions have evolved over time. Positive trends may reflect improved consistency or changing case patterns. Use this to identify learning opportunities." />
              </div>
              <TimePeriodSelector selected={timePeriod} onChange={setTimePeriod} />
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    interval={timePeriod === 'day' ? 4 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip content={<CustomLineTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="your" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    name="Your Average"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peers" 
                    stroke="#94a3b8" 
                    strokeWidth={3}
                    dot={{ fill: '#94a3b8', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    strokeDasharray="5 5"
                    name="Peer Median"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Your Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-slate-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 4px, transparent 4px, transparent 8px)' }}></div>
                  <span className="text-xs text-gray-600">Peer Median</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disparity Metrics */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
            <div className="border-b border-gray-300 px-6 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                    Equity Metrics
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Statistical variance analysis
                  </p>
                </div>
              </div>
              <TooltipButton content="Lower index values indicate more consistent treatment across different groups. These metrics help ensure fairness and identify areas where additional training or review may be beneficial." />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {disparityData.map((item) => (
                  <div key={item.demographic}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.demographic}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.your.toFixed(2)}</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.your / 0.3) * 100}%` }}
                      ></div>
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-gray-700"
                        style={{ left: `${(item.benchmark / 0.3) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Peer Median: {item.peers.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">Benchmark: {item.benchmark.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Lower values indicate more consistent outcomes. The benchmark represents statistical best practices.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Anonymous Peer Comparisons */}
        <motion.div 
          className="bg-white border border-gray-300 rounded-sm shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
          <div className="border-b border-gray-300 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Anonymous Peer Context
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sample of anonymized peer judges with similar caseloads for context
                </p>
              </div>
              <TooltipButton content="These anonymous peer comparisons provide context without identifying individual judges. They help you understand the range of decision-making approaches among colleagues with similar responsibilities." />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {peerComparisons.map((peer) => (
                <div key={peer.id} className="border border-gray-300 rounded-sm p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {peer.id}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Judge {peer.id}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      peer.trend === 'improving' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {peer.trend === 'improving' ? 'Improving' : 'Stable'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Avg Bail Amount</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${peer.avgBail.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Release Rate (48h)</div>
                      <div className="text-lg font-semibold text-gray-900">{peer.releaseRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Equity Index</div>
                      <div className="text-lg font-semibold text-gray-900">{peer.disparityIndex.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-sm p-6">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                About This Dashboard
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                This confidential dashboard is designed exclusively for your professional development. All comparisons 
                are anonymized and aggregated. The goal is to support continuous learning and improvement in judicial 
                decision-making, not to evaluate or monitor performance. Differences in statistics often reflect varying 
                case complexities, defendant circumstances, and local factors. Use these insights as one tool among many 
                in your ongoing professional growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}