'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import { exportJSON, exportCSV, copyReport } from '@/lib/export';

interface Props {
  result: AnalysisResult;
}

export default function ExportButtons({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyReport(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center py-4 border-t border-[#1e293b]">
      <span className="text-xs text-[#475569] mr-2">Exportar:</span>
      <button
        onClick={() => exportJSON(result)}
        className="flex items-center gap-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] px-3 py-2 rounded-lg transition-colors border border-[#334155]"
      >
        <span>📦</span> JSON
      </button>
      <button
        onClick={() => exportCSV(result)}
        className="flex items-center gap-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] px-3 py-2 rounded-lg transition-colors border border-[#334155]"
      >
        <span>📊</span> CSV
      </button>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all border ${
          copied
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#334155]'
        }`}
      >
        <span>{copied ? '✓' : '📋'}</span>
        {copied ? 'Copiado!' : 'Copiar Relatório'}
      </button>
    </div>
  );
}
