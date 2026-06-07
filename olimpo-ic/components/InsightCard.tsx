import type { InsightItem } from '@/types/analysis';

const styles: Record<InsightItem['type'], { bg: string; border: string; badge: string }> = {
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300',
  },
};

interface Props {
  insight: InsightItem;
}

export default function InsightCard({ insight }: Props) {
  const s = styles[insight.type];
  return (
    <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 flex-shrink-0">{insight.emoji}</span>
        <div>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${s.badge}`}>
            {insight.title}
          </span>
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}
