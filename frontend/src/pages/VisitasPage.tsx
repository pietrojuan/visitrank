import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { visitasApi } from '../services/api';
import { Visita } from '../types';
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

type Filtro = 'todos' | 'agendada' | 'realizada' | 'cancelada' | 'sem_avaliacao';
type OrdemData = 'desc' | 'asc';

interface VisitaComAvaliacao extends Visita { avaliada: boolean; }

const PAGE_SIZE = 15;

// Prioridade de status para ordenação padrão (não realizadas primeiro)
const STATUS_PRIO: Record<string, number> = {
  agendada: 1,
  realizada: 2,
  cancelada: 3,
};

export default function VisitasPage() {
  const { isAdmin } = useAuth();
  const [visitas, setVisitas] = useState<VisitaComAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [search, setSearch] = useState('');
  const [ordemData, setOrdemData] = useState<OrdemData>('desc');
  const [pagina, setPagina] = useState(1);
  const [confirm, setConfirm] = useState<{ id: string; status: string; titulo: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; titulo: string; cliente: string } | null>(null);

  const load = () => { setLoading(true); visitasApi.listar().then(r => setVisitas(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleStatus = async (id: string, status: string) => {
    await visitasApi.atualizarStatus(id, status); setConfirm(null); load();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await visitasApi.excluir(deleteConfirm.id);
    setDeleteConfirm(null);
    load();
  };

  const semAvaliacao = visitas.filter(v => !v.avaliada && v.status === 'realizada').length;

  // Filtered + searched + sorted list
  const processed = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = visitas.filter(v => {
      // Status filter
      if (filtro === 'sem_avaliacao') { if (v.avaliada || v.status !== 'realizada') return false; }
      else if (filtro !== 'todos') { if (v.status !== filtro) return false; }
      // Text search
      if (q) {
        const haystack = [v.imovel_titulo, v.cliente_nome, v.corretor_nome].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      // Default: não-realizadas primeiro, depois por data
      const prioDiff = (STATUS_PRIO[a.status] ?? 9) - (STATUS_PRIO[b.status] ?? 9);
      if (prioDiff !== 0) return prioDiff;
      const da = new Date(a.data_visita).getTime();
      const db = new Date(b.data_visita).getTime();
      return ordemData === 'desc' ? db - da : da - db;
    });

    return list;
  }, [visitas, filtro, search, ordemData]);

  // Reset page when filters change
  useEffect(() => { setPagina(1); }, [filtro, search, ordemData]);

  const totalPaginas = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const canceladas = visitas.filter(v => v.status === 'cancelada');

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos',                  label: 'Todos' },
    { key: 'agendada',               label: 'Agendadas' },
    { key: 'realizada',              label: 'Realizadas' },
    { key: 'cancelada',              label: 'Canceladas' },
    { key: 'sem_avaliacao',          label: `⏳ Sem Avaliação${semAvaliacao > 0 ? ` (${semAvaliacao})` : ''}` },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Visitas" subtitle={`${visitas.length} registradas`} action={<Link to="/visitas/agendar" className="btn-primary">+ Agendar Visita</Link>} />

      {/* Filtros de status */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtro === f.key
                ? f.key === 'sem_avaliacao' ? 'bg-orange-500 text-white'
                  : 'bg-brand-600 text-white'
                : f.key === 'sem_avaliacao' && semAvaliacao > 0
                  ? 'bg-orange-50 border border-orange-300 text-orange-600 hover:bg-orange-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Busca + ordenação */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="input flex-1 max-w-sm"
          placeholder="Buscar por imóvel, cliente ou corretor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => setOrdemData(o => o === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors whitespace-nowrap"
          title="Ordenar por data"
        >
          <span>📅 Data</span>
          <span className="text-slate-400">{ordemData === 'desc' ? '↓' : '↑'}</span>
        </button>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1">✕</button>
        )}
      </div>

      {filtro === 'cancelada' && canceladas.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
          <span>🗓</span> Visitas canceladas são removidas automaticamente após <strong>7 dias</strong>.
        </div>
      )}

      {loading ? <LoadingSpinner /> : processed.length === 0 ? <EmptyState message="Nenhuma visita encontrada." /> : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  {['Imóvel', 'Cliente', 'Corretor', 'Data/Hora', 'Status', 'Avaliação', 'Ações'].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(v => (
                    <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${!v.avaliada && v.status === 'realizada' ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">{v.imovel_titulo}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{v.cliente_nome}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden lg:table-cell">{v.corretor_nome}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmt(v.data_visita)}</td>
                      <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {v.avaliada
                          ? <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Avaliada</span>
                          : v.status === 'realizada'
                            ? <span className="text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">⏳ Pendente</span>
                            : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {v.status === 'agendada' && <>
                            <button onClick={() => setConfirm({ id: v.id, status: 'realizada', titulo: v.imovel_titulo || '' })} className="text-green-600 hover:text-green-800 text-xs font-medium">✓ Realizada</button>
                            <button onClick={() => setConfirm({ id: v.id, status: 'cancelada', titulo: v.imovel_titulo || '' })} className="text-red-500 hover:text-red-700 text-xs font-medium">Cancelar</button>
                          </>}
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm({ id: v.id, titulo: v.imovel_titulo || '', cliente: v.cliente_nome || '' })}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Excluir visita">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-400">
                {(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, processed.length)} de {processed.length} visitas
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors">
                  ‹
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === '...'
                    ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-300 text-xs">…</span>
                    : <button key={p} onClick={() => setPagina(p as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${pagina === p ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {p}
                      </button>
                  )}
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors">
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm status */}
      {confirm && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden">
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 ${confirm.status === 'realizada' ? 'bg-green-50' : 'bg-red-50'}`}>
                {confirm.status === 'realizada' ? '✅' : '❌'}
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">
                {confirm.status === 'realizada' ? 'Marcar como Realizada' : 'Cancelar Visita'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Imóvel: <strong className="text-slate-700">{confirm.titulo}</strong><br />
                {confirm.status === 'realizada'
                  ? 'Confirma que esta visita foi realizada?'
                  : 'Tem certeza que deseja cancelar esta visita?'}
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
                Voltar
              </button>
              <button onClick={() => handleStatus(confirm.id, confirm.status)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${confirm.status === 'realizada' ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}>
                {confirm.status === 'realizada' ? 'Confirmar' : 'Cancelar Visita'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm delete visita */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">🗑️</div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Excluir Visita</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Imóvel: <strong className="text-slate-700">{deleteConfirm.titulo}</strong><br />
                Cliente: <strong className="text-slate-700">{deleteConfirm.cliente}</strong><br />
                <span className="text-xs mt-1 block">A avaliação desta visita também será apagada.</span>
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
