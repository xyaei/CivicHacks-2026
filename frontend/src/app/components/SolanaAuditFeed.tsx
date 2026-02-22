import { Shield, Clock, CheckCircle } from 'lucide-react';

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
    <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col">
      <div className="border-b border-gray-300 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="size-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Solana Audit Feed</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Real-time blockchain verification of all bail decisions and court records
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {auditEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-sm border border-gray-300 hover:border-gray-400 hover:shadow-sm transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    {entry.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="size-3" />
                  {entry.timestamp}
                </div>
              </div>
              <code className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1.5 rounded-sm block border border-gray-200">
                {entry.hash}
              </code>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-300 px-5 py-3 bg-gray-50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Live Sync Active
          </p>
        </div>
      </div>
    </div>
  );
}
