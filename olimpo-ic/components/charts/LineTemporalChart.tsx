'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { TimelinePoint } from '@/types/analysis';

const COLORS = ['#3B82F6', '#F4A261', '#10B981', '#A855F7', '#EF4444'];

interface Props {
  timeline: TimelinePoint[];
  terms: string[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm shadow-xl">
      <p className="text-[#94a3b8] mb-2 text-xs">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#e2e8f0] text-xs">{p.name}:</span>
          <span className="font-semibold text-white text-xs">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LineTemporalChart({ timeline, terms }: Props) {
  const sampled = timeline.length > 60
    ? timeline.filter((_, i) => i % Math.ceil(timeline.length / 60) === 0)
    : timeline;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={sampled} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#1e293b' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(v) => <span style={{ color: '#e2e8f0' }}>{v}</span>}
        />
        {terms.map((term, i) => (
          <Line
            key={term}
            type="monotone"
            dataKey={term}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
