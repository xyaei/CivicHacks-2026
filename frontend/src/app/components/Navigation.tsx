import { MessageCircle, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLanguage } from "../LanguageContext";
import { LANGUAGE_OPTIONS, type Language } from "../i18n";

interface NavigationProps {
  onJudgeLoginClick: () => void;
  onChatClick?: () => void;
}

const navLinkClass =
  "text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors pb-1.5";
const navLinkActiveClass = "text-gray-900 border-b-2 border-gray-900";

export function Navigation({ onJudgeLoginClick, onChatClick }: NavigationProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentLanguageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? language;

  return (
    <nav className="w-full border-b border-gray-300 bg-white shadow-sm">
      <div className="mx-auto max-w-[1440px] px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-sm bg-black" />
            <span className="text-xl font-semibold text-gray-900 tracking-tight">
              BailLens
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className={`${navLinkClass} ${navLinkActiveClass}`}>
              {t("nav_publicDashboard")}
            </a>
            {onChatClick && (
              <button
                type="button"
                onClick={onChatClick}
                className={`flex items-center gap-1.5 ${navLinkClass}`}
              >
                <MessageCircle className="size-4" />
                {t("nav_aiAssistant")}
              </button>
            )}
            <button
              type="button"
              onClick={onJudgeLoginClick}
              className={navLinkClass}
            >
              {t("nav_judgeLogin")}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ${navLinkClass}`}
                  title="Change language"
                  aria-label="Change language"
                >
                  <Globe className="size-4 shrink-0" />
                  <span>{currentLanguageLabel}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setLanguage(opt.value as Language)}
                    className={language === opt.value ? "bg-gray-100 font-medium" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
