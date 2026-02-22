import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { range: '$0-2K', count: 145 },
  { range: '$2K-5K', count: 312 },
  { range: '$5K-10K', count: 428 },
  { range: '$10K-25K', count: 289 },
  { range: '$25K-50K', count: 156 },
  { range: '$50K+', count: 87 },
];

const COLORS = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];

export function BailDistribution() {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.range}</p>
          <p className="text-xs text-gray-600 mt-1">
            Cases: <span className="font-semibold text-gray-900">{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-h-[400px]">
      <div className="border-b border-gray-300 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Bail Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">
          Number of cases by bail amount range
        </p>
      </div>
      <div className="flex-1 p-6 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="range" 
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
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}