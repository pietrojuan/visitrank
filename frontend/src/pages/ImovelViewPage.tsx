import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { imoveisApi, fotoUrl } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { Imovel } from '../types';

interface Foto   { id: string; ordem: number; }
interface Comodo { id: string; nome: string; ordem: number; }

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;

export default function ImovelViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [imovel,  setImovel]  = useState<Imovel | null>(null);
  const [fotos,   setFotos]   = useState<Foto[]>([]);
  const [comodos, setComodos] = useState<Comodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const lightboxPrev = useCallback(() => setLightbox(i => i !== null ? (i - 1 + fotos.length) % fotos.length : null), [fotos.length]);
  const lightboxNext = useCallback(() => setLightbox(i => i !== null ? (i + 1) % fotos.length : null), [fotos.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') lightboxPrev();
      else if (e.key === 'ArrowRight') lightboxNext();
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightbox, lightboxPrev, lightboxNext]);

  useEffect(() => {
    Promise.all([
      imoveisApi.buscar(id!),
      imoveisApi.listarFotos(id!),
      imoveisApi.listarComodos(id!),
    ]).then(([im, ft, co]) => {
      setImovel(im.data);
      setFotos(ft.data);
      setComodos(co.data);
    }).catch(() => navigate('/imoveis'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!imovel) return null;

  return (
    <>
    {lightbox !== null && createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
        <button onClick={() => setLightbox(null)}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-2xl transition-colors">✕</button>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">{lightbox + 1} / {fotos.length}</span>

        {fotos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); lightboxPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl transition-colors">‹</button>
            <button onClick={e => { e.stopPropagation(); lightboxNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl transition-colors">›</button>
          </>
        )}

        <img
          src={fotoUrl(fotos[lightbox].id)}
          alt=""
          className="max-h-[90vh] max-w-[90vw] object-contain select-none"
          onClick={e => e.stopPropagation()}
        />

        {fotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {fotos.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                className={`h-1.5 rounded-full transition-all ${i === lightbox ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>,
      document.body
    )}
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">{imovel.titulo}</h1>
          {(imovel.bairro || imovel.cidade) && (
            <p className="text-sm text-slate-500 mt-0.5">{[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/imoveis/${id}`} className="btn-secondary text-xs">✏️ Editar</Link>
          <button onClick={() => navigate('/imoveis')} className="btn-secondary text-xs">← Voltar</button>
        </div>
      </div>

      {/* Carrossel de fotos */}
      {fotos.length > 0 && (
        <div className="card overflow-hidden mb-5">
          <div className="relative bg-slate-100" style={{ height: '320px' }}>
            <img src={fotoUrl(fotos[fotoAtual].id)} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(fotoAtual)} />
            {fotos.length > 1 && (
              <>
                <button onClick={() => setFotoAtual(p => (p - 1 + fotos.length) % fotos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-xl transition-all">‹</button>
                <button onClick={() => setFotoAtual(p => (p + 1) % fotos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-xl transition-all">›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={() => setFotoAtual(i)}
                      className={`h-1.5 rounded-full transition-all ${i === fotoAtual ? 'bg-white w-6' : 'bg-white/50 w-1.5'}`} />
                  ))}
                </div>
                <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full">{fotoAtual + 1}/{fotos.length}</span>
              </>
            )}
          </div>
          {/* Miniaturas */}
          {fotos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {fotos.map((f, i) => (
                <button key={f.id} onClick={() => setFotoAtual(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === fotoAtual ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={fotoUrl(f.id)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Informações principais */}
        <div className="card p-5 md:col-span-2 space-y-4">
          <h3 className="font-display font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Informações do Imóvel</h3>

          <div className="grid grid-cols-2 gap-4">
            {fmt(imovel.preco) && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Preço</p>
                <p className="font-mono font-bold text-brand-600 text-lg">{fmt(imovel.preco)}</p>
              </div>
            )}
            {imovel.metragem && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Metragem</p>
                <p className="font-semibold text-slate-800">{imovel.metragem} m²</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🛏', val: imovel.quartos,   label: 'Quartos'  },
              { icon: '🚿', val: imovel.banheiros, label: 'Banheiros'},
              { icon: '🚗', val: imovel.vagas,     label: 'Vagas'    },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="font-display font-bold text-slate-800 text-lg">{item.val ?? '—'}</p>
                <p className="text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>

          {imovel.descricao && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Descrição</p>
              <p className="text-sm text-slate-700 leading-relaxed">{imovel.descricao}</p>
            </div>
          )}
        </div>

        {/* Lateral */}
        <div className="space-y-4">
          {/* Localização */}
          <div className="card p-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">📍 Localização</h3>
            <div className="space-y-1.5 text-sm text-slate-600">
              {imovel.bairro && <p><span className="text-slate-400 text-xs">Bairro:</span> {imovel.bairro}</p>}
              {imovel.cidade && <p><span className="text-slate-400 text-xs">Cidade:</span> {imovel.cidade}</p>}
              {!imovel.bairro && !imovel.cidade && <p className="text-slate-400 text-xs italic">Não informada</p>}
            </div>
          </div>

          {/* Cômodos */}
          {comodos.length > 0 && (
            <div className="card p-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">🏠 Cômodos</h3>
              <div className="space-y-1.5">
                {comodos.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    {c.nome}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Obs internas */}
          {(imovel as unknown as { observacao?: string }).observacao && (
            <div className="card p-4 border-l-4 border-yellow-400">
              <h3 className="font-display font-semibold text-slate-800 text-sm mb-2">🔒 Obs. Internas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{(imovel as unknown as { observacao?: string }).observacao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
