'use client';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface Props {
  heatmap: Record<string, Record<string, number>>;
}

function valueToColor(v: number, min: number, max: number): string {
  if (max === min) return 'rgba(244,162,97,0.5)';
  const t = (v - min) / (max - min);
  // YlOrRd scale: yellow → orange → red
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(254 + (244 - 254) * s);
    const g = Math.round(240 + (162 - 240) * s);
    const b = Math.round(128 + (97 - 128) * s);
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.5) * 2;
    const r = Math.round(244 + (189 - 244) * s);
    const g = Math.round(162 + (0 - 162) * s);
    const b = Math.round(97 + (38 - 97) * s);
    return `rgb(${r},${g},${b})`;
  }
}

export default function HeatmapGrid({ heatmap }: Props) {
  const years = Object.keys(heatmap).sort();
  if (years.length === 0) return <p className="text-[#94a3b8] text-sm">Sem dados</p>;

  const allVals = years.flatMap(yr => MONTHS.map(mo => heatmap[yr]?.[mo] ?? 0)).filter(v => v > 0);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-separate border-spacing-1 w-full">
        <thead>
          <tr>
            <th className="text-[#94a3b8] font-normal text-left pr-2 py-1 w-10">Ano</th>
            {MONTHS.map(m => (
              <th key={m} className="text-[#94a3b8] font-normal text-center px-1 w-8">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map(yr => (
            <tr key={yr}>
              <td className="text-[#94a3b8] pr-2 py-0.5 font-mono text-xs">{yr}</td>
              {MONTHS.map(mo => {
                const v = heatmap[yr]?.[mo];
                const bg = v != null && v > 0 ? valueToColor(v, min, max) : 'transparent';
                const textColor = v != null && v > 0 && (v - min) / (max - min) > 0.5 ? '#1a1a1a' : '#e2e8f0';
                return (
                  <td
                    key={mo}
                    title={v != null ? `${yr} ${mo}: ${v}` : undefined}
                    className="text-center rounded py-1 px-1 transition-opacity hover:opacity-80"
                    style={{ background: bg, color: textColor, fontSize: 9, minWidth: 28 }}
                  >
                    {v != null && v > 0 ? v : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-[#94a3b8]">
        <span>Baixo</span>
        <div className="flex-1 h-2 rounded" style={{
          background: 'linear-gradient(to right, rgb(254,240,128), rgb(244,162,97), rgb(189,0,38))',
        }} />
        <span>Alto</span>
      </div>
    </div>
  );
}
