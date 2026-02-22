import { useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar } from './components/FilterBar';
import { BailHeatmap } from './components/BailHeatmap';
import { BailDistribution } from './components/BailDistribution';
import { TimeToRelease } from './components/TimeToRelease';
import { SolanaAuditFeed } from './components/SolanaAuditFeed';
import { JudgeLogin } from './components/JudgeLogin';
import { JudgeDashboard } from './components/JudgeDashboard';
import Chat from './components/chat/Chat';
import { OutliersTable } from "./components/outliers/OutliersTable";

export default function App() {
  const [chargeType, setChargeType] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [viewMode, setViewMode] = useState<'bail' | 'disparity'>('bail');
  const [region, setRegion] = useState<'massachusetts' | 'boston'>('massachusetts');
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoggedIn) {
    return <JudgeDashboard onLogout={() => { setIsLoggedIn(false); setShowLogin(false); }} />;
  }

  if (showLogin) {
    return <JudgeLogin onBack={() => setShowLogin(false)} onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Navigation onJudgeLoginClick={() => setShowLogin(true)} />
      
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header with Search */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-6 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                    Public Bail Data Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Promoting fairness and transparency through open access to judicial data
                  </p>
                </div>
                
                {/* Search Bar */}
                <div className="w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search counties, charges, or data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            >
              <MetricsBar dateRange={dateRange} />
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              <FilterBar
                chargeType={chargeType}
                dateRange={dateRange}
                viewMode={viewMode}
                onChargeTypeChange={setChargeType}
                onDateRangeChange={setDateRange}
                onViewModeChange={setViewMode}
              />
            </motion.div>

            {/* Region Tabs */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center gap-0 border border-gray-300 rounded-sm overflow-hidden shadow-sm inline-flex">
                <button
                  onClick={() => setRegion('massachusetts')}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors border-r border-gray-300 ${
                    region === 'massachusetts'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Massachusetts
                </button>
                <button
                  onClick={() => setRegion('boston')}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                    region === 'boston'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Boston
                </button>
              </div>
            </motion.div>

            {/* Heatmap */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            >
              <BailHeatmap viewMode={viewMode} region={region} />
            </motion.div>

            {/* Charts Grid */}
            <motion.div 
              className="grid grid-cols-2 gap-6 min-h-[400px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            >
              <BailDistribution />
              <TimeToRelease />
            </motion.div>

            {/* Outliers Table */}
            <OutliersTable />

            {/* Chat AI Demo */}
            <motion.div
              className="mt-6 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            >
              <Chat />
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div 
            className="w-80"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <SolanaAuditFeed />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}