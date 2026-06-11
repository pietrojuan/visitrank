import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { moderacaoApi } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui';

interface ComodoAvaliado { comodo_nome: string; nota: number; comentario?: string; }

interface AvaliacaoPendente {
  id: string; interesse: string; comentario?: string; criado_em: string;
  imovel_titulo: string; bairro?: string; cidade?: string;
  cliente_nome: string; cliente_email: string; corretor_nome: string;
  nota_localizacao: number; nota_preco: number; nota_estado: number;
  nota_tamanho: number; nota_conforto: number;
  comodos_avaliados: ComodoAvaliado[];
}

const INTERESSE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SIM:    { label: '✅ Tem interesse',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  TALVEZ: { label: '🤷 Talvez',         color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  NAO:    { label: '❌ Sem interesse',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
};

const CRITERIOS = [
  { key: 'nota_localizacao', label: 'Localização', icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',       icon: '💰' },
  { key: 'nota_estado',      label: 'Conservação', icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',     icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',    icon: '🛋️' },
] as const;

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-base ${i < value ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
      ))}
    </span>
  );
}

function MediaCircle({ value }: { value: number }) {
  const color = value >= 4 ? 'text-green-600 bg-green-50 border-green-200'
    : value >= 3 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${color}`}>
      <span className="text-sm font-bold leading-none">{value.toFixed(1)}</span>
      <span className="text-[9px] opacity-60">/ 5</span>
    </div>
  );
}

function ModalDetalhes({ av, processando, onClose, onModerar }: {
  av: AvaliacaoPendente;
  processando: boolean;
  onClose: () => void;
  onModerar: (id: string, acao: 'aprovada' | 'rejeitada') => void;
}) {
  const media = (av.nota_localizacao + av.nota_preco + av.nota_estado + av.nota_tamanho + av.nota_conforto) / 5;
  const int = INTERESSE_LABEL[av.interesse];
  const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-900 truncate">{av.imovel_titulo}</h3>
              {(av.bairro || av.cidade) && (
                <p className="text-xs text-slate-400 mt-0.5">📍 {[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl shrink-0">✕</button>
          </div>

          {/* Cliente + Corretor + Data */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              👤 {av.cliente_nome}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              🧑‍💼 {av.corretor_nome}
            </span>
            <span className="text-xs text-slate-400">{fmtData(av.criado_em)}</span>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Interesse + média */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${int.bg} ${int.color}`}>
              {int.label}
            </span>
            <MediaCircle value={media} />
          </div>

          {/* Comentário geral */}
          {av.comentario && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Comentário</p>
              <p className="text-sm text-slate-700 italic leading-relaxed">"{av.comentario}"</p>
            </div>
          )}

          {/* Critérios gerais */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Critérios Gerais</p>
            <div className="space-y-2.5">
              {CRITERIOS.map(c => {
                const nota = av[c.key as keyof AvaliacaoPendente] as number;
                return (
                  <div key={c.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{c.icon} {c.label}</span>
                    <div className="flex items-center gap-2">
                      <Stars value={nota} />
                      <span className="text-xs text-slate-400 w-5 text-right">{nota}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cômodos avaliados */}
          {av.comodos_avaliados?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Itens do Imóvel</p>
              <div className="space-y-3">
                {av.comodos_avaliados.map((cm, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">🏠 {cm.comodo_nome}</p>
                      <div className="flex items-center gap-1.5">
                        <Stars value={cm.nota} />
                        <span className="text-xs text-slate-400">{cm.nota}</span>
                      </div>
                    </div>
                    {cm.comentario && (
                      <p className="text-xs text-slate-500 italic mt-1">"{cm.comentario}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => onModerar(av.id, 'rejeitada')}
            disabled={processando}
            className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
            ✕ Rejeitar
          </button>
          <button
            onClick={() => onModerar(av.id, 'aprovada')}
            disabled={processando}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-500 transition-colors disabled:opacity-50">
            ✓ Aprovar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ModeracaoPage() {
  const [pendentes, setPendentes] = useState<AvaliacaoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<AvaliacaoPendente | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    moderacaoApi.pendentes().then(r => setPendentes(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleModerar = async (id: string, acao: 'aprovada' | 'rejeitada') => {
    setProcessando(id);
    try {
      await moderacaoApi.moderar(id, acao);
      setSelecionada(null);
      load();
    } finally { setProcessando(null); }
  };

  const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Moderação"
        subtitle={loading ? '...' : `${pendentes.length} ${pendentes.length !== 1 ? 'avaliações' : 'avaliação'} aguardando revisão`}
      />

      {loading ? <LoadingSpinner /> : pendentes.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-slate-700 font-semibold">Tudo em dia!</p>
          <p className="text-slate-400 text-sm mt-1">Nenhuma avaliação pendente de revisão.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.map(av => {
            const media = (av.nota_localizacao + av.nota_preco + av.nota_estado + av.nota_tamanho + av.nota_conforto) / 5;
            const int = INTERESSE_LABEL[av.interesse];
            return (
              <div key={av.id} className="card p-4 hover:shadow-md transition-shadow">
                {/* Título + média */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-slate-900 truncate">{av.imovel_titulo}</p>
                    {(av.bairro || av.cidade) && (
                      <p className="text-xs text-slate-400 mt-0.5">📍 {[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5">
                      👤 {av.cliente_nome} · 🧑‍💼 {av.corretor_nome}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtData(av.criado_em)}</p>
                  </div>
                  <MediaCircle value={media} />
                </div>

                {/* Interesse + stars rápidas */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${int.bg} ${int.color}`}>
                    {int.label}
                  </span>
                  <Stars value={Math.round(media)} />
                </div>

                {/* Comentário preview */}
                {av.comentario && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                    "{av.comentario}"
                  </p>
                )}

                {/* Ações */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setSelecionada(av)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
                    🔍 Ver completa
                  </button>
                  <button
                    onClick={() => handleModerar(av.id, 'rejeitada')}
                    disabled={processando === av.id}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                    ✕ Rejeitar
                  </button>
                  <button
                    onClick={() => handleModerar(av.id, 'aprovada')}
                    disabled={processando === av.id}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-colors disabled:opacity-50">
                    ✓ Aprovar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selecionada && (
        <ModalDetalhes
          av={selecionada}
          processando={!!processando}
          onClose={() => setSelecionada(null)}
          onModerar={handleModerar}
        />
      )}
    </div>
  );
}
