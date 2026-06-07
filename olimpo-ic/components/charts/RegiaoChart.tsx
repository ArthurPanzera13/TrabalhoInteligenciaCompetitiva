'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts';

interface Props {
  regioes: Record<string, number>;
  topCity: string;
}

export default function RegiaoChart({ regioes, topCity }: Props) {
  const data = Object.entries(regioes)
    .sort(([, a], [, b]) => a - b)
    .map(([city, value]) => ({ city, value }));

  const barHeight = 32;
  const height = Math.max(200, data.length * barHeight + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 50, left: 8, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#1e293b' }}
        />
        <YAxis
          type="category"
          dataKey="city"
          tick={{ fontSize: 11, fill: '#e2e8f0' }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { city: string; value: number };
            return (
              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-xs shadow-xl">
                <p className="text-[#94a3b8] mb-1">{d.city}</p>
                <p className="text-white font-semibold">Índice: {d.value}/100</p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.city === topCity ? '#F4A261' : '#3B82F6'}
              fillOpacity={entry.city === topCity ? 1 : 0.75}
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 10, fill: '#94a3b8' }}
            formatter={(v: unknown) => String(v)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
