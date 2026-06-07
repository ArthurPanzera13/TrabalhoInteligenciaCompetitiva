interface Props {
  summary: {
    kiq1_top_media: string;
    kiq1_top_growth: string;
    kiq2_peak_month: string;
    region_top_city: string;
  };
  medias: Record<string, number>;
  crescimento: Record<string, number>;
}

function Card({
  emoji,
  label,
  value,
  sub,
  accent,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <p className={`font-semibold text-sm leading-snug ${accent ? 'text-[#F4A261]' : 'text-[#e2e8f0]'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#475569]">{sub}</p>}
    </div>
  );
}

export default function SummaryCards({ summary, medias, crescimento }: Props) {
  const topMediaVal = medias[summary.kiq1_top_media];
  const topGrowthVal = crescimento[summary.kiq1_top_growth];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        emoji="🏆"
        label="Maior interesse médio"
        value={summary.kiq1_top_media}
        sub={topMediaVal != null ? `${topMediaVal} pts de interesse médio` : undefined}
        accent
      />
      <Card
        emoji="📈"
        label="Maior crescimento"
        value={summary.kiq1_top_growth}
        sub={topGrowthVal != null ? `${topGrowthVal >= 0 ? '+' : ''}${topGrowthVal}% no período` : undefined}
      />
      <Card
        emoji="📅"
        label="Pico de demanda"
        value={summary.kiq2_peak_month}
        sub="Mês com maior interesse sazonal"
      />
      <Card
        emoji="📍"
        label="Cidade destaque em MG"
        value={summary.region_top_city}
        sub="Maior volume de buscas"
      />
    </div>
  );
}
