import React, { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface Comodo { id: string; nome: string; }
interface NotaComodo { comodo_id: string; nota: number; comentario: string; }

const CRITERIOS_FIXOS = [
  { key: 'nota_localizacao', label: 'Localização',           icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',                 icon: '💰' },
  { key: 'nota_estado',      label: 'Estado de Conservação', icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',               icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',              icon: '🛋️' },
] as const;

type Step = 'loading' | 'form' | 'success' | 'error' | 'ja_avaliada';

export default function AvaliacaoPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep]               = useState<Step>('loading');
  const [imovelTitulo, setImovelTitulo] = useState('');
  const [comodos, setComodos]         = useState<Comodo[]>([]);
  const [notasFixas, setNotasFixas]   = useState<Record<string, number>>({});
  const [notasComodo, setNotasComodo] = useState<Record<string, NotaComodo>>({});
  const [interesse, setInteresse]     = useState<'SIM' | 'TALVEZ' | 'NAO' | ''>('');
  const [comentario, setComentario]   = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (!token) { setStep('error'); return; }
    publicApi.getVisita(token)
      .then(r => {
        setImovelTitulo(r.data.imovel_titulo || '');
        setComodos(r.data.comodos || []);
        setStep('form');
      })
      .catch(err => {
        const msg = err?.response?.data?.erro || '';
        setStep(msg.includes('já avaliada') ? 'ja_avaliada' : 'error');
      });
  }, [token]);

  const setNota = (comodoId: string, nota: number) =>
    setNotasComodo(p => ({ ...p, [comodoId]: { ...p[comodoId], comodo_id: comodoId, nota, comentario: p[comodoId]?.comentario || '' } }));

  const setComentarioComodo = (comodoId: string, c: string) =>
    setNotasComodo(p => ({ ...p, [comodoId]: { ...p[comodoId], comodo_id: comodoId, nota: p[comodoId]?.nota || 0, comentario: c } }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!interesse) return;
    setLoading(true);
    try {
      await publicApi.avaliar(token!, {
        ...notasFixas,
        interesse,
        comentario,
        avaliacoes: Object.values(notasComodo).filter(n => n.nota > 0),
      });
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || '';
      setStep(msg.includes('já avaliada') ? 'ja_avaliada' : 'error');
    } finally { setLoading(false); }
  };

  const todosFixosPreenchidos = CRITERIOS_FIXOS.every(c => (notasFixas[c.key] || 0) > 0);
  const todosComodoPreenchidos = comodos.every(c => (notasComodo[c.id]?.nota || 0) > 0);
  const allDone = todosFixosPreenchidos && todosComodoPreenchidos;

  if (step === 'loading') return <div className="min-h-screen bg-surface-50 flex items-center justify-center"><LoadingSpinner /></div>;
  if (step === 'error') return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-4">😕</div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Link inválido</h2>
        <p className="text-slate-500 text-sm">Este link não foi encontrado ou expirou.</p></div>
    </div>
  );
  if (step === 'ja_avaliada') return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-4">✅</div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Já avaliado!</h2>
        <p className="text-slate-500 text-sm">Esta visita já foi avaliada. Obrigado!</p></div>
    </div>
  );
  if (step === 'success') return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-surface-950 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-5">🎉</div>
        <h2 className="font-display font-bold text-white text-2xl mb-3">Obrigado!</h2>
        <p className="text-slate-300 text-sm">Sua avaliação foi registrada com sucesso.</p>
        <p className="text-slate-500 text-xs mt-2">Dados protegidos conforme a LGPD.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-surface-950 to-surface-900 py-8 px-4">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 shadow-lg mb-3">
            <span className="text-white text-lg font-display font-bold">V</span>
          </div>
          <h1 className="text-white font-display font-bold text-xl">Avalie sua visita</h1>
          {imovelTitulo && <p className="text-slate-400 text-sm mt-1 truncate px-8">🏠 {imovelTitulo}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 5 Critérios Fixos ── */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-5">
            <p className="text-white font-display font-semibold text-sm">Critérios Gerais</p>
            {CRITERIOS_FIXOS.map(c => (
              <div key={c.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{c.icon}</span>
                  <p className="text-white font-semibold text-sm">{c.label}</p>
                  {(notasFixas[c.key] || 0) > 0 && (
                    <span className="ml-auto text-yellow-400 text-xs font-mono">{notasFixas[c.key]}/5</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button"
                      onClick={() => setNotasFixas(p => ({ ...p, [c.key]: star }))}
                      className={`text-2xl transition-all hover:scale-110 ${star <= (notasFixas[c.key] || 0) ? 'text-yellow-400' : 'text-white/20'}`}>★</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Cômodos customizados ── */}
          {comodos.length > 0 && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-5">
              <p className="text-white font-display font-semibold text-sm">Itens do Imóvel</p>
              {comodos.map(c => {
                const av = notasComodo[c.id];
                return (
                  <div key={c.id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold text-sm">{c.nome}</p>
                      {(av?.nota || 0) > 0 && <span className="text-yellow-400 text-xs font-mono">{av.nota}/5</span>}
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setNota(c.id, star)}
                          className={`text-2xl transition-all hover:scale-110 ${star <= (av?.nota || 0) ? 'text-yellow-400' : 'text-white/20'}`}>★</button>
                      ))}
                    </div>
                    <input value={av?.comentario || ''} onChange={e => setComentarioComodo(c.id, e.target.value)}
                      placeholder="Comentário (opcional)..."
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Interesse + Comentário geral ── */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-white font-display font-semibold text-sm mb-3">🤔 Você tem interesse neste imóvel?</p>
              <div className="grid grid-cols-3 gap-2">
                {([['SIM', '✅ Sim'], ['TALVEZ', '🤷 Talvez'], ['NAO', '❌ Não']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setInteresse(val)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${interesse === val ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Comentário geral (opcional)</label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none h-20"
                placeholder="Deixe um comentário..." />
            </div>
          </div>

          {(!allDone || !interesse) && (
            <p className="text-yellow-400/80 text-xs text-center">
              {!todosFixosPreenchidos ? 'Avalie todos os critérios gerais.' : ''}
              {!todosComodoPreenchidos ? ' Avalie todos os itens do imóvel.' : ''}
              {!interesse ? ' Indique seu interesse.' : ''}
            </p>
          )}

          <button type="submit" disabled={loading || !allDone || !interesse}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>

          <p className="text-center text-slate-600 text-xs pb-4">🔒 Dados protegidos pela LGPD</p>
        </form>
      </div>
    </div>
  );
}
