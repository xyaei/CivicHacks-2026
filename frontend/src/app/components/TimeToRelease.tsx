import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Aug', hours: 18.2 },
  { month: 'Sep', hours: 16.8 },
  { month: 'Oct', hours: 19.4 },
  { month: 'Nov', hours: 17.2 },
  { month: 'Dec', hours: 15.6 },
  { month: 'Jan', hours: 16.9 },
  { month: 'Feb', hours: 14.8 },
];

export function TimeToRelease() {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-sm shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.month} 2026</p>
          <p className="text-xs text-gray-600 mt-1">
            Average: <span className="font-semibold text-gray-900">{payload[0].value} hours</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-sm border border-gray-300 shadow-sm h-full flex flex-col min-h-[400px]">
      <div className="border-b border-gray-300 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Time to Release Trend</h3>
        <p className="text-sm text-gray-600 mt-1">
          Average hours from bail posting to release
        </p>
      </div>
      <div className="flex-1 p-6 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
              label={{ 
                value: 'Hours', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: '#374151', fontSize: 11, fontWeight: 500 } 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="hours" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}