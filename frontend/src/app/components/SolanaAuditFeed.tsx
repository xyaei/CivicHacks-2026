import { Shield, Clock } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  hash: string;
  type: string;
}

const auditEntries: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2 min ago',
    hash: '7x9K4mP...nQ2vL8',
    type: 'Bail Decision',
  },
  {
    id: '2',
    timestamp: '8 min ago',
    hash: '3pL6wN...jR4tY9',
    type: 'Release Record',
  },
  {
    id: '3',
    timestamp: '15 min ago',
    hash: 'kT8mF2...xW9pQ1',
    type: 'Bail Decision',
  },
  {
    id: '4',
    timestamp: '23 min ago',
    hash: '9nQ5vL...pK7mR3',
    type: 'Court Update',
  },
  {
    id: '5',
    timestamp: '31 min ago',
    hash: '2wR8pJ...tN6qL4',
    type: 'Bail Decision',
  },
  {
    id: '6',
    timestamp: '42 min ago',
    hash: '5mT3nK...vP9wR2',
    type: 'Release Record',
  },
  {
    id: '7',
    timestamp: '1 hr ago',
    hash: '8pL4wQ...jN7mT5',
    type: 'Bail Decision',
  },
  {
    id: '8',
    timestamp: '1 hr ago',
    hash: 'nK6vR9...pL3wT8',
    type: 'Court Update',
  },
  {
    id: '9',
    timestamp: '1 hr ago',
    hash: 'mP5tK8...wL4nR7',
    type: 'Bail Decision',
  },
];

export function SolanaAuditFeed() {
  return (
    <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-w-0">
      <div className="border-b border-gray-300 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-gray-900" />
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Solana Audit Feed</h3>
        </div>
        <p className="text-xs text-gray-500 leading-snug mt-1">
          Blockchain verification of bail decisions
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        <div className="space-y-2">
          {auditEntries.slice(0, 6).map((entry) => (
            <div
              key={entry.id}
              className="p-2 rounded border border-gray-200 hover:border-gray-300 transition-colors bg-gray-50/50"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-xs font-medium text-gray-700 truncate">{entry.type}</span>
                <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <Clock className="size-3" />
                  {entry.timestamp}
                </span>
              </div>
              <code className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate">
                {entry.hash}
              </code>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-300 px-3 py-2 bg-gray-50">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Live</p>
        </div>
      </div>
    </div>
  );
}
