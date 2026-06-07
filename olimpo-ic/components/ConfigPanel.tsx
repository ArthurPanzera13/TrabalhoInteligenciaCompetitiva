'use client';

import { useState } from 'react';
import type { AnalysisConfig } from '@/types/analysis';

const GEO_OPTIONS = [
  { value: 'BR-MG', label: 'Minas Gerais (BR-MG)' },
  { value: 'BR-SP', label: 'São Paulo (BR-SP)' },
  { value: 'BR-RJ', label: 'Rio de Janeiro (BR-RJ)' },
  { value: 'BR',    label: 'Brasil inteiro' },
];

const TIMEFRAME_OPTIONS = [
  { value: '3m',  label: 'Últimos 3 meses' },
  { value: '6m',  label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: '5y',  label: 'Últimos 5 anos' },
];

interface Props {
  config: AnalysisConfig;
  onChange: (c: AnalysisConfig) => void;
}

function TermList({
  label,
  terms,
  onChange,
  max = 5,
  min = 2,
}: {
  label: string;
  terms: string[];
  onChange: (t: string[]) => void;
  max?: number;
  min?: number;
}) {
  const [draft, setDraft] = useState('');

  const addTerm = () => {
    const v = draft.trim();
    if (v && !terms.includes(v) && terms.length < max) {
      onChange([...terms, v]);
      setDraft('');
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">{label}</label>
      <div className="space-y-1">
        {terms.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 group">
            <span className="flex-1 text-xs bg-[#0f172a] border border-[#1e293b] rounded px-2.5 py-1.5 text-[#e2e8f0] truncate">
              {t}
            </span>
            {terms.length > min && (
              <button
                onClick={() => onChange(terms.filter((_, j) => j !== i))}
                className="text-[#475569] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100 text-sm px-1"
                aria-label="Remover"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {terms.length < max && (
        <div className="flex gap-1.5">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTerm()}
            placeholder="+ Adicionar termo..."
            className="flex-1 text-xs bg-[#0f172a] border border-[#1e293b] rounded px-2.5 py-1.5 text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#F4A261] transition-colors"
          />
          <button
            onClick={addTerm}
            disabled={!draft.trim()}
            className="text-xs bg-[#F4A261] text-gray-900 px-3 py-1.5 rounded font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            +
          </button>
        </div>
      )}
      <p className="text-xs text-[#475569]">{terms.length}/{max} termos</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xs bg-[#0f172a] border border-[#1e293b] rounded px-2.5 py-1.5 text-[#e2e8f0] focus:outline-none focus:border-[#F4A261] transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <span className="text-xs font-bold text-[#F4A261] uppercase tracking-widest">{children}</span>
      <div className="flex-1 border-t border-[#1e293b]" />
    </div>
  );
}

export default function ConfigPanel({ config, onChange }: Props) {
  const set = <K extends keyof AnalysisConfig>(key: K, value: AnalysisConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="p-4 space-y-1 text-sm">
      <p className="text-xs text-[#475569] mb-4">Configure os parâmetros antes de executar a análise.</p>

      {/* KIQ 1 */}
      <SectionHeader>KIQ 1 — Comparativo</SectionHeader>
      <div className="space-y-3">
        <TermList
          label="Termos de Busca"
          terms={config.kiq1_termos}
          onChange={t => set('kiq1_termos', t)}
          max={5}
          min={2}
        />
        <SelectField
          label="Região"
          value={config.kiq1_geo}
          options={GEO_OPTIONS}
          onChange={v => set('kiq1_geo', v)}
        />
        <SelectField
          label="Período"
          value={config.kiq1_timeframe}
          options={TIMEFRAME_OPTIONS}
          onChange={v => set('kiq1_timeframe', v)}
        />
      </div>

      {/* KIQ 2 */}
      <SectionHeader>KIQ 2 — Sazonalidade</SectionHeader>
      <div className="space-y-3">
        <TermList
          label="Termos de Busca"
          terms={config.kiq2_termos}
          onChange={t => set('kiq2_termos', t)}
          max={5}
          min={1}
        />
        <SelectField
          label="Região"
          value={config.kiq2_geo}
          options={GEO_OPTIONS}
          onChange={v => set('kiq2_geo', v)}
        />
        <SelectField
          label="Período"
          value={config.kiq2_timeframe}
          options={TIMEFRAME_OPTIONS}
          onChange={v => set('kiq2_timeframe', v)}
        />
      </div>

      {/* Regional */}
      <SectionHeader>Consulta Regional</SectionHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Termo</label>
          <input
            value={config.region_termo}
            onChange={e => set('region_termo', e.target.value)}
            className="w-full text-xs bg-[#0f172a] border border-[#1e293b] rounded px-2.5 py-1.5 text-[#e2e8f0] focus:outline-none focus:border-[#F4A261] transition-colors"
          />
        </div>
        <SelectField
          label="Estado"
          value={config.region_geo}
          options={GEO_OPTIONS}
          onChange={v => set('region_geo', v)}
        />
      </div>
    </div>
  );
}
