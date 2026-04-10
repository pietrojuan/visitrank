import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { clienteAuthApi, fotoUrl } from '../services/api';

interface ImovelCliente {
  id: string; titulo: string; descricao?: string; bairro?: string; cidade?: string;
  preco?: number; metragem?: number; quartos?: number; banheiros?: number; vagas?: number;
  foto_ids: string[]; ja_avaliado: boolean;
  corretor_nome?: string; corretor_telefone?: string;
}

interface MinhaAvaliacao {
  id: string; imovel_id: string; imovel_titulo: string; imovel_preco?: number; bairro?: string; cidade?: string;
  media_itens: number; total_itens: number;
  interesse: 'SIM' | 'TALVEZ' | 'NAO'; comentario?: string; criado_em: string; foto_ids: string[];
}

interface AvaliacaoCompleta {
  avaliacao_existente: {
    interesse: string; comentario?: string;
    nota_localizacao?: number; nota_preco?: number; nota_estado?: number; nota_tamanho?: number; nota_conforto?: number;
  } | null;
  avaliacoes_existentes: { comodo_id: string; nota: number; comentario?: string }[];
  comodos: { id: string; nome: string }[];
}

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
const fmtData = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const INTERESSE_LABEL: Record<string, { label: string; color: string }> = {
  SIM:    { label: '✅ Tenho interesse',  color: 'text-green-700 bg-green-50 border-green-200' },
  TALVEZ: { label: '🤷 Talvez',           color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  NAO:    { label: '❌ Sem interesse',    color: 'text-red-600 bg-red-50 border-red-200' },
};


function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <span key={s} className={s <= value ? 'text-yellow-400' : 'text-slate-200'}>★</span>)}
    </span>
  );
}

function Carrossel({ fotoIds }: { fotoIds: string[] }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="relative w-full h-full">
      <img src={fotoUrl(fotoIds[atual])} alt="" className="w-full h-full object-cover" />
      {fotoIds.length > 1 && (
        <>
          <button onClick={() => setAtual(p => (p - 1 + fotoIds.length) % fotoIds.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-sm">‹</button>
          <button onClick={() => setAtual(p => (p + 1) % fotoIds.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-sm">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {fotoIds.map((_, i) => (
              <button key={i} onClick={() => setAtual(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === atual ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">{atual + 1}/{fotoIds.length}</div>
        </>
      )}
    </div>
  );
}

function Lightbox({ fotoIds, inicial, onClose }: { fotoIds: string[]; inicial: number; onClose: () => void }) {
  const [idx, setIdx] = useState(inicial);
  const prev = useCallback(() => setIdx(i => (i - 1 + fotoIds.length) % fotoIds.length), [fotoIds.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % fotoIds.length), [fotoIds.length]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [prev, next, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-2xl">✕</button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">{idx + 1} / {fotoIds.length}</span>
      {fotoIds.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl">‹</button>
          <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl">›</button>
        </>
      )}
      <img src={fotoUrl(fotoIds[idx])} alt="" className="max-h-[90vh] max-w-[90vw] object-contain select-none" onClick={e => e.stopPropagation()} />
      {fotoIds.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {fotoIds.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`} />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

function ModalVerImovel({ imovel, onClose }: { imovel: ImovelCliente; onClose: () => void }) {
  const [fotoAtual, setFotoAtual] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {lightbox !== null && <Lightbox fotoIds={imovel.foto_ids} inicial={lightbox} onClose={() => setLightbox(null)} />}
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-slate-900 truncate">{imovel.titulo}</h3>
            {(imovel.bairro || imovel.cidade) && (
              <p className="text-xs text-slate-400 mt-0.5">{[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl ml-3 shrink-0">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Carrossel */}
          {imovel.foto_ids.length > 0 && (
            <div className="relative bg-slate-100" style={{ height: '220px' }}>
              <img src={fotoUrl(imovel.foto_ids[fotoAtual])} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(fotoAtual)} />
              {imovel.foto_ids.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setFotoAtual(p => (p - 1 + imovel.foto_ids.length) % imovel.foto_ids.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center text-lg">‹</button>
                  <button onClick={e => { e.stopPropagation(); setFotoAtual(p => (p + 1) % imovel.foto_ids.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center text-lg">›</button>
                  <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">{fotoAtual + 1}/{imovel.foto_ids.length}</span>
                </>
              )}
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Preço e metragem */}
            <div className="flex items-center gap-4">
              {imovel.preco && <p className="font-mono font-bold text-brand-600 text-xl">{fmt(imovel.preco)}</p>}
              {imovel.metragem && <p className="text-sm text-slate-500">📐 {imovel.metragem}m²</p>}
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '🛏', val: imovel.quartos,   label: 'Quartos'   },
                { icon: '🚿', val: imovel.banheiros, label: 'Banheiros' },
                { icon: '🚗', val: imovel.vagas,     label: 'Vagas'     },
              ].map(item => item.val ? (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl mb-1">{item.icon}</p>
                  <p className="font-bold text-slate-800">{item.val}</p>
                  <p className="text-[11px] text-slate-400">{item.label}</p>
                </div>
              ) : null)}
            </div>

            {/* Descrição */}
            {imovel.descricao && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Descrição</p>
                <p className="text-sm text-slate-700 leading-relaxed">{imovel.descricao}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botão avaliar */}
        {!imovel.ja_avaliado && (
          <div className="px-5 py-4 border-t border-slate-100 shrink-0">
            <p className="text-xs text-slate-400 text-center mb-1">Feche para voltar à lista e avaliar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AbaImoveis({ imoveis, loading, onAvaliar }: { imoveis: ImovelCliente[]; loading: boolean; onAvaliar: (id: string) => void }) {
  const [verImovel, setVerImovel] = useState<ImovelCliente | null>(null);
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (imoveis.length === 0) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🏠</div>
      <p className="text-slate-600 font-medium">Nenhum imóvel disponível</p>
      <p className="text-slate-400 text-sm mt-1">Seu corretor ainda não liberou imóveis para avaliação.</p>
    </div>
  );

  return (
    <>
    {verImovel && <ModalVerImovel imovel={verImovel} onClose={() => setVerImovel(null)} />}
    <div className="space-y-4">
      {imoveis.map(im => (
        <div key={im.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {im.foto_ids.length > 0 && (
            <div className="relative h-52 bg-slate-100 overflow-hidden">
              <Carrossel fotoIds={im.foto_ids} />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display font-semibold text-slate-900">{im.titulo}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{[im.bairro, im.cidade].filter(Boolean).join(', ') || '—'}</p>
              </div>
              {im.preco && <p className="font-mono font-semibold text-brand-600 text-sm shrink-0 ml-2">{fmt(im.preco)}</p>}
            </div>
            {im.descricao && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{im.descricao}</p>}
            <div className="flex gap-3 text-xs text-slate-500 mb-4">
              {im.quartos   ? <span>🛏 {im.quartos} quarto{im.quartos > 1 ? 's' : ''}</span> : null}
              {im.banheiros ? <span>🚿 {im.banheiros} banh.</span> : null}
              {im.metragem  ? <span>📐 {im.metragem}m²</span> : null}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVerImovel(im)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">
                Ver detalhes
              </button>
              {im.ja_avaliado ? (
                <>
                  <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-3">
                    <span className="text-green-600 text-sm">✅</span>
                    <p className="text-green-700 text-sm font-medium">Avaliado</p>
                  </div>
                  <button onClick={() => onAvaliar(im.id)}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 text-sm transition-all"
                    title="Editar avaliação">
                    ✏️
                  </button>
                </>
              ) : (
                <button onClick={() => onAvaliar(im.id)}
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all active:scale-[0.98]">
                  Avaliar →
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}

const CRITERIOS = [
  { key: 'nota_localizacao', label: 'Localização' },
  { key: 'nota_preco',       label: 'Preço'        },
  { key: 'nota_estado',      label: 'Estado'       },
  { key: 'nota_tamanho',     label: 'Tamanho'      },
  { key: 'nota_conforto',    label: 'Conforto'     },
] as const;

function ModalAvaliacaoCompleta({ av, onClose }: { av: MinhaAvaliacao; onClose: () => void }) {
  const [dados, setDados] = useState<AvaliacaoCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const int = INTERESSE_LABEL[av.interesse];

  useEffect(() => {
    clienteAuthApi.detalheImovel(av.imovel_id)
      .then(r => setDados(r.data))
      .finally(() => setLoading(false));
  }, [av.imovel_id]);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-slate-900 truncate">{av.imovel_titulo}</h3>
            {(av.bairro || av.cidade) && <p className="text-xs text-slate-400 mt-0.5">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl ml-3 shrink-0">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Interesse */}
          <span className={`inline-flex text-xs font-medium px-3 py-1.5 rounded-full border ${int.color}`}>{int.label}</span>

          {/* Comentário geral */}
          {av.comentario && (
            <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-4 py-3">"{av.comentario}"</p>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : dados ? (
            <>
              {/* Critérios gerais */}
              {dados.avaliacao_existente && CRITERIOS.some(c => dados.avaliacao_existente![c.key]) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Critérios Gerais</p>
                  <div className="space-y-2">
                    {CRITERIOS.map(c => {
                      const nota = dados.avaliacao_existente![c.key];
                      if (!nota) return null;
                      return (
                        <div key={c.key} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{c.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <span key={s} className={s <= nota ? 'text-yellow-400' : 'text-slate-200'}>★</span>)}
                            </span>
                            <span className="text-xs text-slate-400 w-4">{nota}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Itens do imóvel */}
              {dados.avaliacoes_existentes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Itens do Imóvel</p>
                  <div className="space-y-2">
                    {dados.avaliacoes_existentes.map(ac => {
                      const comodo = dados.comodos.find(c => c.id === ac.comodo_id);
                      return (
                        <div key={ac.comodo_id}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{comodo?.nome || '—'}</span>
                            <div className="flex items-center gap-2">
                              <span className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => <span key={s} className={s <= ac.nota ? 'text-yellow-400' : 'text-slate-200'}>★</span>)}
                              </span>
                              <span className="text-xs text-slate-400 w-4">{ac.nota}</span>
                            </div>
                          </div>
                          {ac.comentario && <p className="text-xs text-slate-400 italic mt-0.5 ml-0.5">"{ac.comentario}"</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition-colors">Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AbaAvaliacoes({ onEditar }: { onEditar: (imovelId: string) => void }) {
  const [avaliacoes, setAvaliacoes] = useState<MinhaAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [verCompleta, setVerCompleta] = useState<MinhaAvaliacao | null>(null);

  useEffect(() => {
    clienteAuthApi.minhasAvaliacoes().then(r => setAvaliacoes(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (avaliacoes.length === 0) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">⭐</div>
      <p className="text-slate-600 font-medium">Nenhuma avaliação feita ainda</p>
      <p className="text-slate-400 text-sm mt-1">Suas avaliações aparecerão aqui.</p>
    </div>
  );

  return (
    <>
      {verCompleta && <ModalAvaliacaoCompleta av={verCompleta} onClose={() => setVerCompleta(null)} />}
      <div className="space-y-4">
        {avaliacoes.map(av => {
          const int = INTERESSE_LABEL[av.interesse];
          return (
            <div key={av.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {av.foto_ids?.length > 0 && (
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img src={fotoUrl(av.foto_ids[0])} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">{av.imovel_titulo}</h3>
                    {(av.bairro || av.cidade) && <p className="text-xs text-slate-400 mt-0.5">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>}
                    {av.imovel_preco && <p className="text-xs font-mono font-semibold text-brand-600 mt-1">{fmt(av.imovel_preco)}</p>}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">{fmtData(av.criado_em)}</span>
                </div>

                {/* Resumo */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${int.color}`}>{int.label}</span>
                  {av.total_itens > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Stars value={Math.round(Number(av.media_itens))} />
                      <span className="text-xs text-slate-500">{Number(av.media_itens).toFixed(1)}/5 · {av.total_itens} iten{av.total_itens > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {av.comentario && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 mb-3">"{av.comentario}"</p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setVerCompleta(av)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-200 text-brand-700 text-xs font-medium hover:bg-brand-50 transition-colors">
                    Ver completa →
                  </button>
                  <button onClick={() => onEditar(av.imovel_id)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 text-xs font-medium transition-colors">
                    ✏️ Editar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ClienteImoveisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [imoveis, setImoveis] = useState<ImovelCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const abaInicial = new URLSearchParams(location.search).get('aba') === 'avaliacoes' ? 'avaliacoes' : 'imoveis';
  const [aba, setAba] = useState<'imoveis' | 'avaliacoes'>(abaInicial);
  const cliente = JSON.parse(localStorage.getItem('vr_cliente') || '{}');
  const corretorTelefone: string | undefined = cliente.corretor_telefone;
  const corretorNome: string | undefined = cliente.corretor_nome;

  useEffect(() => {
    clienteAuthApi.meusImoveis().then(r => setImoveis(r.data)).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vr_cli_token');
    localStorage.removeItem('vr_cliente');
    navigate('/cliente/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-display font-bold text-sm">V</div>
            <div>
              <p className="font-display font-bold text-slate-900 text-sm">VisitRank</p>
              <p className="text-[10px] text-slate-400">Olá, {cliente.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {corretorTelefone && (
              <a
                href={`https://wa.me/55${corretorTelefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                title={`Falar com ${corretorNome || 'seu corretor'}`}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Corretor
              </a>
            )}
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 text-xs transition-colors">Sair ⏏</button>
          </div>
        </div>

        {/* Abas */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 border-t border-slate-100">
          {([['imoveis', '🏠 Imóveis'], ['avaliacoes', '⭐ Minhas Avaliações']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${aba === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {aba === 'imoveis' ? (
          <>
            <h2 className="font-display font-bold text-slate-900 text-lg mb-1">Imóveis para Avaliar</h2>
            <p className="text-sm text-slate-500 mb-6">Selecione um imóvel que você visitou para registrar sua avaliação.</p>
            <AbaImoveis imoveis={imoveis} loading={loading} onAvaliar={id => navigate(`/cliente/imoveis/${id}`)} />
          </>
        ) : (
          <>
            <h2 className="font-display font-bold text-slate-900 text-lg mb-1">Minhas Avaliações</h2>
            <p className="text-sm text-slate-500 mb-6">Avaliações que você já enviou.</p>
            <AbaAvaliacoes onEditar={id => navigate(`/cliente/imoveis/${id}`)} />
          </>
        )}
      </div>
    </div>
  );
}
