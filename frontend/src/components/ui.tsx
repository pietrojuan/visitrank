import React from 'react';
import { createPortal } from 'react-dom';
import { Classificacao } from '../types';

export const n = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export const PageHeader = ({ title, subtitle, action }: { title:string; subtitle?:string; action?:React.ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div><h1 className="text-xl font-display font-bold text-slate-900">{title}</h1>{subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
    {action && <div>{action}</div>}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const EmptyState = ({ message = 'Nenhum item encontrado.' }: { message?: string }) => (
  <div className="text-center py-16 text-slate-400 text-sm">{message}</div>
);

export const ErrorMsg = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{message}</div>
);

export const SuccessMsg = ({ message }: { message: string }) => (
  <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{message}</div>
);

const statusStyles: Record<string, string> = {
  agendada: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  realizada: 'bg-green-50 text-green-700 border border-green-200',
  cancelada: 'bg-red-50 text-red-700 border border-red-200',
  aguardando: 'bg-purple-50 text-purple-700 border border-purple-200',
};
const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  aguardando: '⏳ Aguardando',
};
export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>{statusLabels[status] || status}</span>
);

const classifStyles: Record<Classificacao, string> = {
  altamente_atrativo: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  competitivo: 'bg-blue-50 text-blue-700 border border-blue-200',
  precisa_melhorar: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  baixa_atratividade: 'bg-red-50 text-red-700 border border-red-200',
};
const classifLabels: Record<Classificacao, string> = {
  altamente_atrativo: '⭐ Altamente Atrativo',
  competitivo: '📈 Competitivo',
  precisa_melhorar: '⚠️ Precisa Melhorar',
  baixa_atratividade: '📉 Baixa Atratividade',
};
export const ClassifBadge = ({ c }: { c: Classificacao }) => (
  <span className={`badge ${classifStyles[c]}`}>{classifLabels[c]}</span>
);

export const ScoreBar = ({ value, max = 5, color = 'brand' }: { value: number; max?: number; color?: string }) => {
  const pct = Math.min(100, (value / max) * 100);
  const bar = color === 'green' ? 'bg-emerald-500' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
};

const statColorMap: Record<string, string> = {
  brand:   'text-brand-600',
  emerald: 'text-emerald-600',
  green:   'text-green-600',
  red:     'text-red-500',
  slate:   'text-slate-700',
};

export const StatCard = ({ title, value, icon, color = 'brand' }: { title:string; value:string|number; icon?:string; color?:string }) => (
  <div className="card p-5 animate-fade-in flex flex-col justify-between min-h-[100px]">
    <div className="flex items-center justify-between gap-1 mb-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{title}</p>
      {icon && <span className="text-base shrink-0">{icon}</span>}
    </div>
    <p className={`text-2xl font-mono font-semibold ${statColorMap[color] ?? 'text-brand-600'}`}>{value}</p>
  </div>
);

export const Confirm = ({ open, title, message, onConfirm, onCancel, icon = '🗑️', confirmLabel = 'Confirmar' }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  icon?: string; confirmLabel?: string;
}) => {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">{icon}</div>
          <h3 className="font-display font-bold text-slate-900 text-lg mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100">
          <button onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
