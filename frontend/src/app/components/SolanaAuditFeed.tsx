import React, { useEffect, useState } from "react";
import { Shield, Clock, ExternalLink, Wallet, CheckCircle } from "lucide-react";
import {
  fetchRecentRecordIds,
  fetchVerifyRecord,
  fetchTransactionForRecord,
  fetchFundStatus,
  RECENT_RECORDS_LIMIT,
  type FundStatus,
  type VerifyRecordResult,
} from "../api";
import { useLanguage } from "../LanguageContext";

const EXPLORER_BASE = "https://explorer.solana.com/tx";

function explorerUrl(signature: string): string {
  return `${EXPLORER_BASE}/${signature}?cluster=devnet`;
}

/** Sidebar entry: full verify result or placeholder when not on chain */
type VerifiedEntry = Pick<VerifyRecordResult, "record_id"> & Partial<Pick<VerifyRecordResult, "signature" | "timestamp" | "authority">>;

function FundStatRow({ label, value, muted }: { label: string; value: string | null; muted?: boolean }) {
  const valueNode = value != null ? <span className={muted ? "text-gray-500" : "font-medium text-gray-900"}>{value}</span> : <span className="font-medium text-gray-900">—</span>;
  return (
    <div className="flex justify-between gap-2">
      <span className={muted ? "text-gray-500" : "text-gray-600"}>{label}</span>
      {valueNode}
    </div>
  );
}

export function SolanaAuditFeed() {
  const { t } = useLanguage();
  const [verified, setVerified] = useState<VerifiedEntry[]>([]);
  const [fundStatus, setFundStatus] = useState<FundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifiedEntry | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    Promise.all([fetchRecentRecordIds(RECENT_RECORDS_LIMIT), fetchFundStatus()])
      .then(async ([ids, fund]) => {
        if (cancelled) return;
        setFundStatus(fund);
        
        if (!ids.length) {
          setVerified([]);
          return;
        }
        
        // For each record, get both verify data AND transaction
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const [verifyData, txData] = await Promise.all([
                fetchVerifyRecord(id),
                fetchTransactionForRecord(id).catch(() => null) // Don't fail if tx missing
              ]);
              
              // Use transaction signature if available, otherwise use hash from verifyData
              const signature = txData?.transaction || verifyData.signature;
              
              // Log to help debug
              if (txData?.transaction) {
                console.log(`Record ${id} has real transaction:`, txData.transaction);
              } else {
                console.log(`Record ${id} using hash fallback:`, verifyData.signature);
              }
              
              return {
                record_id: verifyData.record_id,
                signature: signature,
                timestamp: verifyData.timestamp,
                authority: verifyData.authority,
              };
            } catch {
              return { record_id: id } as VerifiedEntry;
            }
          })
        );
        
        if (cancelled) return;
        setVerified(results);
      })
      .catch(() => {
        if (!cancelled) setVerified([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVerify = async () => {
    const id = verifyId.trim();
    if (!id) return;
    
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    
    try {
      // Get on-chain verification data (hash, timestamp, authority)
      const verifyData = await fetchVerifyRecord(id);
      
      // Try to get the actual transaction signature from MongoDB
      let transactionSignature = "";
      let usedFallback = false;
      
      try {
        const txData = await fetchTransactionForRecord(id);
        transactionSignature = txData.transaction; // This is the REAL Solana transaction signature
        console.log("Got real transaction for", id, ":", transactionSignature);
      } catch {
        usedFallback = true;
      }

      setVerifyResult({
        record_id: verifyData.record_id,
        signature: transactionSignature,
        timestamp: verifyData.timestamp,
        authority: verifyData.authority,
      });
      
      // Show warning if using fallback
      if (usedFallback) {
        console.warn("Showing hash instead of transaction - check MongoDB for solana_tx field");
      }
      
      setVerifyId("");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Verify failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      {/* Fund status card */}
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm overflow-hidden">
        <div className="border-b border-gray-300 px-3 py-2.5 flex items-center gap-2">
          <Wallet className="size-4 text-gray-900" />
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
            Fund Status
          </h3>
        </div>
        <div className="px-3 py-2.5 text-sm">
          {fundStatus == null ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-1.5">
              <FundStatRow label="Balance" value={fundStatus.balance_sol != null ? `${fundStatus.balance_sol} SOL` : null} />
              <FundStatRow label="Cases funded" value={fundStatus.cases_funded != null ? String(fundStatus.cases_funded) : null} />
              {fundStatus.total_contributed != null && (
                <FundStatRow label="Contributed" value={`${fundStatus.total_contributed} SOL`} muted />
              )}
              {fundStatus.total_disbursed != null && (
                <FundStatRow label="Disbursed" value={`${fundStatus.total_disbursed} SOL`} muted />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Last 10 verified records */}
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-w-0">
        <div className="border-b border-gray-300 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-gray-900" />
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              {t("solana_auditFeed")}
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-snug mt-1">
            Last 10 verified records (Explorer links)
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0" style={{ minHeight: 200 }}>
          {loading ? (
            <p className="text-xs text-gray-500 py-2">Loading…</p>
          ) : verified.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No record IDs from data</p>
          ) : (
            <div className="space-y-2">
              {verified.slice(0, RECENT_RECORDS_LIMIT).map((entry) => (
                <div
                  key={entry.record_id}
                  className="p-2 rounded border border-gray-200 hover:border-gray-300 transition-colors bg-gray-50/50"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {entry.record_id}
                    </span>
                    {entry.signature ? (
                      <a
                        href={explorerUrl(entry.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-amber-600 shrink-0">Not on chain</span>
                    )}
                  </div>
                  {entry.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Clock className="size-3" />
                      {entry.timestamp}
                    </div>
                  )}
                  {entry.signature ? (
                    <code 
                      className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate" 
                      title={entry.signature}
                    >
                      {entry.signature}
                    </code>
                  ) : (
                    <p className="text-xs text-gray-400">Use “Verify on Blockchain” below to check</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verify on Blockchain */}
      <div className="bg-white rounded-sm border border-gray-300 shadow-sm overflow-hidden">
        <div className="border-b border-gray-300 px-3 py-2.5 flex items-center gap-2">
          <CheckCircle className="size-4 text-gray-900" />
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
            Verify on Blockchain
          </h3>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          <input
            type="text"
            placeholder="Record ID (e.g. MA-12650277)"
            value={verifyId}
            onChange={(e) => setVerifyId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifyLoading || !verifyId.trim()}
            className="w-full py-1.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
          >
            {verifyLoading ? "…" : t("solana_verify")}
          </button>
          {verifyError && (
            <p className="text-xs text-red-600">{verifyError}</p>
          )}
          {verifyResult && (
            <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-medium text-gray-700">{verifyResult.record_id}</span>
                {verifyResult.signature && (
                  <a
                    href={explorerUrl(verifyResult.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    Explorer <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              {verifyResult.timestamp && (
                <div className="text-gray-500 mb-1">
                  <Clock className="size-3 inline mr-1" />
                  {verifyResult.timestamp}
                </div>
              )}
              {verifyResult.signature && (
                <code 
                  className="block truncate text-gray-600 font-mono" 
                  title={verifyResult.signature}
                >
                  {verifyResult.signature}
                </code>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
