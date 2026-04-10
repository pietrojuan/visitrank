import React, { useEffect, useState } from 'react';
import { rankingApi } from '../services/api';
import { RankingImovel } from '../types';
import { PageHeader, LoadingSpinner, EmptyState, ClassifBadge, ScoreBar, n } from '../components/ui';

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const pct = (v: unknown) => `${(n(v) * 100).toFixed(0)}%`;
const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingImovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { rankingApi.getRanking().then(r => setRanking(r.data)).finally(() => setLoading(false)); }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ranking de Imóveis" subtitle="Ordenado pelo VisitRank Score" />
      <div className="card p-4 mb-5 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span><strong className="text-slate-700">VisitRank</strong> = 0,6×Score + 0,3×Interesse + 0,1×log(n)</span>
        <span><strong className="text-slate-700">Score</strong> = Bayesiano com mínimo 10 avaliações</span>
      </div>

      {loading ? <LoadingSpinner /> : ranking.length === 0 ? <EmptyState message="Nenhum imóvel com avaliações ainda." /> : (
        <div className="space-y-3">
          {ranking.map((im, idx) => (
            <div key={im.id} className="card overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpanded(expanded === im.id ? null : im.id)}>
                <div className="text-center w-10 shrink-0">
                  {idx < 3 ? <span className="text-2xl">{MEDAL[idx]}</span> : <span className="font-display font-bold text-slate-300 text-sm">#{idx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-semibold text-slate-900 text-sm">{im.titulo}</h3>
                    <ClassifBadge c={im.classificacao} />
                  </div>
                  <p className="text-xs text-slate-400">{[im.bairro, im.cidade].filter(Boolean).join(', ') || '—'} · {fmt(im.preco)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-brand-600 text-lg leading-none">{n(im.visitrank_score).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{im.total_avaliacoes} aval.</p>
                </div>
                <span className="text-slate-300 text-xs">{expanded === im.id ? '▲' : '▼'}</span>
              </div>

              {expanded === im.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Scores</p>
                      <div><p className="text-xs text-slate-500 mb-1">Score Médio</p><ScoreBar value={n(im.score_medio)} /></div>
                      <div><p className="text-xs text-slate-500 mb-1">Score Ajustado</p><ScoreBar value={n(im.score_ajustado)} color="green" /></div>
                      <div><p className="text-xs text-slate-500 mb-1">VisitRank Score</p><ScoreBar value={n(im.visitrank_score)} /></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Índices</p>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Interesse</span><span className="font-mono font-semibold text-green-600">{pct(im.indice_interesse)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Rejeição</span><span className="font-mono font-semibold text-red-500">{pct(im.indice_rejeicao)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Atratividade</span><span className="font-mono font-semibold text-brand-600">{n(im.atratividade).toFixed(2)}</span></div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Detalhes</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ icon: '🛏', val: im.quartos, label: 'Quartos' }, { icon: '🚿', val: im.banheiros, label: 'Banh.' }, { icon: '🚗', val: im.vagas, label: 'Vagas' }].map(item => (
                          <div key={item.label} className="bg-white rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-sm">{item.icon}</p>
                            <p className="font-mono font-semibold text-slate-700 text-xs">{item.val ?? '—'}</p>
                            <p className="text-[10px] text-slate-400">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      {im.metragem && <p className="text-xs text-slate-400 mt-2">{im.metragem} m²</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
