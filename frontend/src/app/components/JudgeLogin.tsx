import React, { useState, useEffect } from "react";
import { fetchJudges } from "../api";
import { useLanguage } from "../LanguageContext";

const JUDGE_LIST_MAX_HEIGHT = "20rem"; // max-h-80

function putKevinFirst(names: string[]): string[] {
  const list = [...names];
  const i = list.findIndex((j) => j.toLowerCase().includes("kevin"));
  if (i > 0) {
    const [kevin] = list.splice(i, 1);
    list.unshift(kevin);
  } else if (i !== 0) {
    list.unshift("Kevin");
  }
  return list;
}

interface JudgeLoginProps {
  onBack: () => void;
  onLogin: (judgeName: string) => void;
}

export function JudgeLogin({ onBack, onLogin }: JudgeLoginProps) {
  const { t } = useLanguage();
  const [judges, setJudges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherName, setOtherName] = useState("");

  useEffect(() => {
    fetchJudges()
      .then((list) => setJudges(putKevinFirst(Array.isArray(list) ? list : [])))
      .catch(() => setJudges(["Kevin"]))
      .finally(() => setLoading(false));
  }, []);

  const handleOtherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = otherName.trim();
    if (name) onLogin(name);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-lg mb-3" />
          <h1 className="text-xl font-semibold text-gray-900 mb-0.5">{t("judgeLogin_title")}</h1>
          <p className="text-xs text-gray-600">{t("judgeLogin_who")}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4">
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-8">{t("judgeLogin_loading")}</p>
            ) : judges.length === 0 ? (
              <p className="text-sm text-amber-600 text-center py-8">{t("judgeLogin_noJudges")}</p>
            ) : (
              <div className="overflow-y-auto rounded-lg border border-gray-200" style={{ maxHeight: JUDGE_LIST_MAX_HEIGHT }}>
                {judges.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onLogin(name)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {judges.length > 0 && (
              <p className="text-center text-xs text-gray-500 mt-3">
                {judges.length} {judges.length !== 1 ? t("judgeLogin_judgesCountPlural") : t("judgeLogin_judgesCount")} · {t("judgeLogin_kevinFirst")}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">{t("judgeLogin_notInList")}</p>
              <form onSubmit={handleOtherSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder={t("judgeLogin_placeholder")}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
                <button
                  type="submit"
                  disabled={!otherName.trim()}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  {t("judgeLogin_go")}
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {t("judgeLogin_confidential")}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>{t("judgeLogin_back")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
