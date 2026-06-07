'use client';

const STEP_LABELS: Array<{ from: number; label: string }> = [
  { from: 0,  label: 'Conectando ao Google Trends' },
  { from: 15, label: 'Coletando dados de serviços (KIQ 1)' },
  { from: 45, label: 'Analisando sazonalidade (KIQ 2)' },
  { from: 65, label: 'Mapeando regiões de MG' },
  { from: 80, label: 'Gerando perspectivas analíticas' },
  { from: 95, label: 'Finalizando relatório' },
];

interface Props {
  pct: number;
  message: string;
}

export default function ProgressBar({ pct, message }: Props) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F4A261] animate-pulse" />
          <span className="text-sm font-medium text-[#e2e8f0]">{message}</span>
        </div>
        <span className="text-sm font-mono text-[#F4A261] font-bold">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #2E4057, #F4A261)',
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-3">
        {STEP_LABELS.map((step, i) => {
          const isDone = pct > step.from;
          const isCurrent = i === STEP_LABELS.findIndex((_, j) =>
            STEP_LABELS[j].from <= pct && (STEP_LABELS[j + 1]?.from ?? 101) > pct
          );
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-[#F4A261]'
                    : isCurrent
                    ? 'bg-[#F4A261] animate-pulse scale-125'
                    : 'bg-[#334155]'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
