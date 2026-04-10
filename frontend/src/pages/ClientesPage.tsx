import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientesApi } from '../services/api';
import { Cliente } from '../types';
import { PageHeader, LoadingSpinner, EmptyState, Confirm } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const INTERESSE_LABEL: Record<string, { label: string; color: string }> = {
  SIM:    { label: 'Tem interesse',  color: 'text-green-600 bg-green-50' },
  TALVEZ: { label: 'Talvez',         color: 'text-yellow-600 bg-yellow-50' },
  NAO:    { label: 'Sem interesse',  color: 'text-red-500 bg-red-50' },
};

interface ImovelDisponivel { id: string; titulo: string; bairro?: string; cidade?: string; preco?: number; }
interface AvaliacaoFeita { id: string; nota_localizacao: number; nota_preco: number; nota_estado: number; nota_tamanho: number; nota_conforto: number; interesse: string; comentario?: string; criado_em: string; imovel_titulo: string; imovel_preco?: number; bairro?: string; cidade?: string; }
interface ClienteDetalhes { disponiveis: ImovelDisponivel[]; avaliacoes: AvaliacaoFeita[]; }

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5 text-xs">
      {[1,2,3,4,5].map(s => <span key={s} className={s <= value ? 'text-yellow-400' : 'text-slate-200'}>★</span>)}
    </span>
  );
}

function ClienteExpanded({ clienteId }: { clienteId: string }) {
  const [dados, setDados] = useState<ClienteDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientesApi.detalhes(clienteId).then(r => setDados(r.data)).finally(() => setLoading(false));
  }, [clienteId]);

  if (loading) return (
    <tr><td colSpan={4} className="px-5 py-4 bg-slate-50/70">
      <div className="flex justify-center"><div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
    </td></tr>
  );

  if (!dados) return null;

  return (
    <tr>
      <td colSpan={4} className="bg-slate-50/70 border-b border-slate-100">
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Imóveis disponíveis para avaliar */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
              🏠 Imóveis para Avaliar
              <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-mono normal-case">{dados.disponiveis.length}</span>
            </p>
            {dados.disponiveis.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum imóvel pendente de avaliação.</p>
            ) : (
              <div className="space-y-2">
                {dados.disponiveis.map(im => (
                  <div key={im.id} className="bg-white rounded-lg border border-slate-100 px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{im.titulo}</p>
                      {(im.bairro || im.cidade) && (
                        <p className="text-[11px] text-slate-400">{[im.bairro, im.cidade].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                    {im.preco && <p className="text-xs font-mono font-semibold text-brand-600 shrink-0">{fmt(im.preco)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avaliações já feitas */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
              ⭐ Avaliações Feitas
              <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-mono normal-case">{dados.avaliacoes.length}</span>
            </p>
            {dados.avaliacoes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma avaliação registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {dados.avaliacoes.map(av => {
                  const media = (av.nota_localizacao + av.nota_preco + av.nota_estado + av.nota_tamanho + av.nota_conforto) / 5;
                  const int = INTERESSE_LABEL[av.interesse];
                  return (
                    <div key={av.id} className="bg-white rounded-lg border border-slate-100 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{av.imovel_titulo}</p>
                          {(av.bairro || av.cidade) && (
                            <p className="text-[11px] text-slate-400">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${int.color}`}>{int.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Stars value={Math.round(media)} />
                        <span className="text-xs text-slate-500">Média {media.toFixed(1)}/5</span>
                        <span className="text-[11px] text-slate-300 ml-auto">{fmtData(av.criado_em)}</span>
                      </div>
                      {av.comentario && (
                        <p className="text-[11px] text-slate-500 mt-1.5 italic line-clamp-2">"{av.comentario}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </td>
    </tr>
  );
}

export default function ClientesPage() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => { setLoading(true); clientesApi.listar().then(r => setClientes(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clientes" subtitle={`${clientes.length} cadastrados`} action={<Link to="/clientes/novo" className="btn-primary">+ Novo Cliente</Link>} />
      <div className="mb-4"><input className="input max-w-sm" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Nome', 'Email', 'Telefone', ''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <React.Fragment key={c.id}>
                  <tr
                    onClick={() => toggle(c.id)}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${expanded === c.id ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs">{expanded === c.id ? '▲' : '▼'}</span>
                        {c.nome}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.email || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.telefone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3 justify-end items-center" onClick={e => e.stopPropagation()}>
                        {c.telefone && (
                          <a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            className="text-green-600 hover:text-green-800 text-xs font-medium" title="Abrir WhatsApp">
                            WhatsApp
                          </a>
                        )}
                        <Link to={`/clientes/${c.id}`} className="text-brand-600 hover:text-brand-800 text-xs font-medium">Editar</Link>
                        {isAdmin && (
                          <button onClick={() => setConfirm(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Excluir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === c.id && <ClienteExpanded clienteId={c.id} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Confirm open={!!confirm} title="Excluir Cliente"
        message="Esta ação é permanente. Todas as visitas e avaliações deste cliente serão apagadas do banco de dados."
        confirmLabel="Excluir tudo"
        onConfirm={async () => { if (confirm) { await clientesApi.excluir(confirm); setConfirm(null); load(); } }}
        onCancel={() => setConfirm(null)} />
    </div>
  );
}
