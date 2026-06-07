'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';

interface Props {
  sazonal: Record<string, number>;
  anual: Record<string, number>;
}

export default function SazonalidadeChart({ sazonal, anual }: Props) {
  const sazonalData = Object.entries(sazonal).map(([month, value]) => ({ month, value }));
  const anualData = Object.entries(anual)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, value]) => ({ year, value }));

  const maxVal = Math.max(...sazonalData.map(d => d.value));
  const minVal = Math.min(...sazonalData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Monthly seasonality */}
      <div>
        <p className="text-xs text-[#94a3b8] mb-2">Interesse médio por mês</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sazonalData} margin={{ top: 18, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2 text-xs">
                    <span className="text-white font-semibold">{payload[0].payload.month}: {payload[0].value}</span>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {sazonalData.map((entry, i) => {
                const color = entry.value === maxVal ? '#F4A261' : entry.value === minVal ? '#3B82F6' : '#475569';
                return <Cell key={i} fill={color} />;
              })}
              <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: '#94a3b8' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Annual evolution */}
      {anualData.length > 1 && (
        <div>
          <p className="text-xs text-[#94a3b8] mb-2">Evolução anual</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={anualData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4A261" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F4A261" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2 text-xs">
                      <span className="text-white font-semibold">{payload[0].payload.year}: {payload[0].value}</span>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#F4A261" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: '#F4A261', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
