import { Scale } from "lucide-react";

interface NavigationProps {
  onJudgeLoginClick: () => void;
}

export function Navigation({ onJudgeLoginClick }: NavigationProps) {
  return (
    <nav className="w-full border-b border-gray-300 bg-white shadow-sm">
      <div className="mx-auto max-w-[1440px] px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded">
              <Scale className="size-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900 tracking-tight">
                Bail Transparency Initiative
              </div>
              <div className="text-xs text-gray-600 tracking-wide">
                Commonwealth of Massachusetts
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-medium text-gray-900 pb-1.5 border-b-2 border-gray-900"
            >
              Public Dashboard
            </a>
            <button
              onClick={onJudgeLoginClick}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors pb-1.5"
            >
              Judge Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}