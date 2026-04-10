import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { rankingApi, avaliacoesApi } from '../services/api';
import { DashboardData, Avaliacao } from '../types';
import { PageHeader, LoadingSpinner, StatCard, ClassifBadge, ScoreBar, n } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const INTERESSE_LABEL: Record<string, { label: string; color: string }> = {
  SIM:    { label: 'Tem interesse',    color: 'text-green-600 bg-green-50' },
  TALVEZ: { label: 'Talvez',           color: 'text-yellow-600 bg-yellow-50' },
  NAO:    { label: 'Sem interesse',    color: 'text-red-500 bg-red-50' },
};

const CRITERIOS = [
  { key: 'nota_localizacao', label: 'Localização', icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',       icon: '💰' },
  { key: 'nota_estado',      label: 'Conservação', icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',     icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',    icon: '🛋️'  },
] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= value ? 'text-yellow-400' : 'text-slate-200'}>★</span>
      ))}
    </span>
  );
}

interface Comodo { nome: string; nota: number; comentario?: string; }

function AvaliacaoModal({ av, onClose }: { av: Avaliacao; onClose: () => void }) {
  const media = (av.nota_localizacao + av.nota_preco + av.nota_estado + av.nota_tamanho + av.nota_conforto) / 5;
  const int = INTERESSE_LABEL[av.interesse];
  const [comodos, setComodos] = useState<Comodo[]>([]);
  const [loadingComodos, setLoadingComodos] = useState(true);

  useEffect(() => {
    avaliacoesApi.buscar(av.id)
      .then(r => setComodos(r.data.comodos || []))
      .finally(() => setLoadingComodos(false));
  }, [av.id]);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">{av.imovel_titulo}</h3>
              {(av.bairro || av.cidade) && (
                <p className="text-xs text-slate-400 mt-0.5">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>
              )}
              {av.imovel_preco && <p className="text-xs font-mono font-semibold text-brand-600 mt-1">{fmt(av.imovel_preco)}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none shrink-0">✕</button>
          </div>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${int.color}`}>{int.label}</span>
            <span className="text-xs text-slate-400">Média geral: <strong className="text-slate-700">{media.toFixed(1)}/5</strong></span>
          </div>
        </div>

        {/* Corpo com scroll */}
        <div className="p-5 space-y-5 overflow-y-auto">

          {/* Critérios fixos */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Critérios Gerais</p>
            <div className="grid gap-2.5">
              {CRITERIOS.map(c => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{c.icon} {c.label}</span>
                  <div className="flex items-center gap-2">
                    <Stars value={av[c.key]} />
                    <span className="text-xs text-slate-400 w-5 text-right">{av[c.key]}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cômodos */}
          {loadingComodos ? (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comodos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Itens do Imóvel</p>
              <div className="grid gap-2.5">
                {comodos.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">🏠 {c.nome}</span>
                      <div className="flex items-center gap-2">
                        <Stars value={c.nota} />
                        <span className="text-xs text-slate-400 w-5 text-right">{c.nota}/5</span>
                      </div>
                    </div>
                    {c.comentario && (
                      <p className="text-xs text-slate-400 italic mt-0.5 pl-5">"{c.comentario}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentário geral */}
          {av.comentario && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Comentário</p>
              <p className="text-sm text-slate-700 leading-relaxed">{av.comentario}</p>
            </div>
          )}

          {/* Rodapé com info */}
          <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-400">
            <p>👤 Cliente: <span className="text-slate-600">{av.cliente_nome}</span>{av.cliente_email && ` · ${av.cliente_email}`}</p>
            <p>🧑‍💼 Corretor: <span className="text-slate-600">{av.corretor_nome}</span></p>
            <p>📅 Visita: <span className="text-slate-600">{fmtData(av.data_visita)}</span></p>
            <p>⭐ Avaliado em: <span className="text-slate-600">{fmtData(av.criado_em)}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full py-3.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AvaliacoesTab() {
  const { isAdmin } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Avaliacao | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Avaliacao | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busca, setBusca] = useState('');

  const load = () => {
    setLoading(true);
    avaliacoesApi.listar().then(r => setAvaliacoes(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await avaliacoesApi.excluir(deleteConfirm.id);
      setDeleteConfirm(null);
      load();
    } finally { setDeleting(false); }
  };

  const filtradas = avaliacoes.filter(a =>
    a.imovel_titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.cliente_nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-4">
        <input className="input max-w-sm" placeholder="Buscar por imóvel ou cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtradas.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-slate-500 text-sm">{busca ? 'Nenhuma avaliação encontrada.' : 'Nenhuma avaliação registrada ainda.'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Imóvel', 'Cliente', 'Corretor', 'Média', 'Interesse', 'Data', ...(isAdmin ? [''] : [])].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtradas.map(av => {
                  const media = (av.nota_localizacao + av.nota_preco + av.nota_estado + av.nota_tamanho + av.nota_conforto) / 5;
                  const int = INTERESSE_LABEL[av.interesse];
                  return (
                    <tr key={av.id} onClick={() => setSelecionada(av)}
                      className="hover:bg-brand-50/40 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px]">
                        <p className="truncate">{av.imovel_titulo}</p>
                        {(av.bairro || av.cidade) && (
                          <p className="text-[11px] text-slate-400 truncate">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{av.cliente_nome}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden lg:table-cell">{av.corretor_nome}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-700">{media.toFixed(1)}</span>
                          <Stars value={Math.round(media)} />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${int.color}`}>{int.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtData(av.criado_em)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setDeleteConfirm(av)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Excluir avaliação">
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selecionada && <AvaliacaoModal av={selecionada} onClose={() => setSelecionada(null)} />}

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">🗑️</div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Excluir Avaliação</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Imóvel: <strong className="text-slate-700">{deleteConfirm.imovel_titulo}</strong><br />
                Cliente: <strong className="text-slate-700">{deleteConfirm.cliente_nome}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-3">Esta avaliação também será removida do portal do cliente. A ação não pode ser desfeita.</p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'geral' | 'avaliacoes'>('geral');

  useEffect(() => {
    rankingApi.getDashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-sm text-slate-500">Erro ao carregar dashboard.</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Visão geral do desempenho da imobiliária" />

      {/* Abas */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {([['geral', 'Visão Geral'], ['avaliacoes', 'Avaliações']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${aba === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
            {key === 'avaliacoes' && data.total_avaliacoes > 0 && (
              <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-mono">{data.total_avaliacoes}</span>
            )}
          </button>
        ))}
      </div>

      {aba === 'geral' ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            <StatCard title="Imóveis" value={data.total_imoveis} icon="🏠" />
            <StatCard title="Visitas" value={data.total_visitas} icon="📅" />
            <StatCard title="Avaliações" value={data.total_avaliacoes} icon="⭐" />
            <StatCard title="Score Médio" value={data.total_avaliacoes > 0 ? `${n(data.media_geral).toFixed(1)}/5` : '—'} icon="📊" color="emerald" />
            <StatCard title="Interesse Real" value={data.total_avaliacoes > 0 ? `${(n(data.taxa_interesse_real) * 100).toFixed(0)}%` : '—'} icon="💰" color="green" />
            <StatCard title="Visitas Pendentes" value={data.visitas_pendentes} icon="⏳" color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-display font-semibold text-slate-800 text-sm mb-4">Visitas por Mês</h3>
              <div className="h-48">
                <Bar
                  data={{
                    labels: data.visitas_por_mes.map(v => v.mes),
                    datasets: [{ data: data.visitas_por_mes.map(v => Number(v.total)), backgroundColor: 'rgba(98,114,241,0.15)', borderColor: '#6272f1', borderWidth: 2, borderRadius: 6 }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } } } }}
                />
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-display font-semibold text-slate-800 text-sm mb-1">Interesse dos Clientes</h3>
              <p className="text-xs text-slate-400 mb-3">{data.total_avaliacoes} avaliações no total</p>
              {data.total_avaliacoes === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-300 text-sm">Sem dados ainda</div>
              ) : (
                <>
                  <div className="h-36">
                    <Doughnut
                      data={{
                        labels: ['Tem Interesse', 'Talvez', 'Sem Interesse'],
                        datasets: [{
                          data: [n(data.total_sim), n(data.total_talvez), n(data.total_nao)],
                          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                          borderWidth: 0,
                        }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 8 } } } }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                    <div><p className="text-sm font-bold text-green-600">{data.total_sim}</p><p className="text-[10px] text-slate-400">Sim</p></div>
                    <div><p className="text-sm font-bold text-yellow-500">{data.total_talvez}</p><p className="text-[10px] text-slate-400">Talvez</p></div>
                    <div><p className="text-sm font-bold text-red-500">{data.total_nao}</p><p className="text-[10px] text-slate-400">Não</p></div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-4">Top 5 — VisitRank Score</h3>
            {data.ranking_top5.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sem dados de ranking ainda.</p>
            ) : (
              <div className="space-y-3">
                {data.ranking_top5.map((im, idx) => (
                  <div key={im.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                    <span className="font-display font-bold text-slate-300 text-lg w-6">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{im.titulo}</p>
                        <ClassifBadge c={im.classificacao} />
                      </div>
                      <ScoreBar value={n(im.visitrank_score)} max={5} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold text-brand-600 text-sm">{n(im.visitrank_score).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{im.total_avaliacoes} aval.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <AvaliacoesTab />
      )}
    </div>
  );
}
