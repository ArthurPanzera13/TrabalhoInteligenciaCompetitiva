'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: Record<string, number>;
  type: 'media' | 'crescimento';
}

function shortLabel(term: string): string {
  const words = term.split(' ');
  if (words.length === 1) return term.slice(0, 12);
  return words.map(w => w[0]?.toUpperCase() ?? '').join('') || term.slice(0, 8);
}

export default function ComparativoBarras({ data, type }: Props) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: shortLabel(name),
    fullName: name,
    value,
  }));

  const isGrowth = type === 'crescimento';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#1e293b' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => isGrowth ? `${v}%` : String(v)}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0];
            return (
              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-xs shadow-xl">
                <p className="text-[#94a3b8] mb-1">{(d.payload as { fullName: string }).fullName}</p>
                <p className="text-white font-semibold">
                  {isGrowth ? `${(d.value as number) >= 0 ? '+' : ''}${d.value}%` : `${d.value} pts`}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
          {chartData.map((entry, i) => {
            const color = isGrowth
              ? entry.value >= 0 ? '#10B981' : '#EF4444'
              : ['#3B82F6', '#F4A261', '#10B981', '#A855F7', '#EF4444'][i % 5];
            return <Cell key={`cell-${i}`} fill={color} fillOpacity={0.85} />;
          })}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 10, fill: '#94a3b8' }}
            formatter={(v: unknown) => {
              const n = Number(v);
              return isGrowth ? `${n >= 0 ? '+' : ''}${n}%` : String(n);
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
