import { useState } from 'react';
import { motion } from 'motion/react';
import { Navigation } from './components/Navigation';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar } from './components/FilterBar';
import { BailHeatmap } from './components/BailHeatmap';
import { BailDistribution } from './components/BailDistribution';
import { JudgesSection } from './components/JudgesSection';
import { GeminiChat } from './components/GeminiChat';
import { SolanaAuditFeed } from './components/SolanaAuditFeed';
import { JudgeLogin } from './components/JudgeLogin';
import { JudgeDashboard } from './components/JudgeDashboard';

const FADE_IN = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" as const } };

function FadeIn({ delay = 0, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div className={className} {...FADE_IN} transition={{ ...FADE_IN.transition, delay }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const [dateRange, setDateRange] = useState("all");
  const [region, setRegion] = useState<"massachusetts" | "boston">("massachusetts");
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInJudge, setLoggedInJudge] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(false);
    setLoggedInJudge("");
  };
  const handleLogin = (name: string) => {
    setLoggedInJudge(name);
    setIsLoggedIn(true);
  };

  if (isLoggedIn && loggedInJudge) {
    return <JudgeDashboard judgeName={loggedInJudge} onLogout={handleLogout} />;
  }
  if (showLogin) {
    return <JudgeLogin onBack={() => setShowLogin(false)} onLogin={handleLogin} />;
  }

  const regionTab = (r: "massachusetts" | "boston") =>
    region === r ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50';

  return (
    <motion.div
      className="min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Navigation onJudgeLoginClick={() => setShowLogin(true)} onChatClick={() => setChatOpen(true)} />
      <GeminiChat open={chatOpen} onOpenChange={setChatOpen} />

      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-6">
          <div className="flex-1">
            <FadeIn delay={0.1} className="mb-6">
              <div className="mb-4">
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                  Public Bail Data Dashboard
                </h1>
                <p className="text-gray-600">
                  Promoting fairness and transparency through open access to judicial data
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <FilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />
            </FadeIn>

            <FadeIn delay={0.2}>
              <MetricsBar dateRange={dateRange} />
            </FadeIn>

            <FadeIn delay={0.25} className="mb-6">
              <div className="inline-flex overflow-hidden rounded-sm border border-gray-300 shadow-sm">
                <button
                  onClick={() => setRegion('massachusetts')}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors border-r border-gray-300 ${regionTab('massachusetts')}`}
                >
                  Massachusetts
                </button>
                <button
                  onClick={() => setRegion('boston')}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors ${regionTab('boston')}`}
                >
                  Boston
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} className="mb-6">
              <BailHeatmap region={region} dateRange={dateRange} />
            </FadeIn>

            <FadeIn delay={0.35} className="min-h-[400px]">
              <BailDistribution dateRange={dateRange} />
            </FadeIn>

            <FadeIn delay={0.4} className="mt-6">
              <JudgesSection />
            </FadeIn>
          </div>

          <FadeIn delay={0.2} className="shrink-0">
            <SolanaAuditFeed />
          </FadeIn>
        </div>
      </div>
    </motion.div>
  );
}