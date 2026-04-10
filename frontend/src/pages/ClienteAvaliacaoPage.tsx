import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteAuthApi, fotoUrl } from '../services/api';

interface Comodo { id: string; nome: string; }
interface NotaComodo { comodo_id: string; nota: number; comentario: string; }

const CRITERIOS_FIXOS = [
  { key: 'nota_localizacao', label: 'Localização',           icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',                 icon: '💰' },
  { key: 'nota_estado',      label: 'Estado de Conservação', icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',               icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',              icon: '🛋️' },
] as const;

export default function ClienteAvaliacaoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [imovel,    setImovel]    = useState<Record<string, unknown> | null>(null);
  const [comodos,   setComodos]   = useState<Comodo[]>([]);
  const [fotoIds,   setFotoIds]   = useState<string[]>([]);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [erro,      setErro]      = useState('');
  const [sucesso,   setSucesso]   = useState(false);
  const [editando,  setEditando]  = useState(false);

  const [notasFixas,  setNotasFixas]  = useState<Record<string, number>>({});
  const [notasComodo, setNotasComodo] = useState<Record<string, NotaComodo>>({});
  const [interesse,   setInteresse]   = useState<'SIM' | 'TALVEZ' | 'NAO' | ''>('');
  const [comentario,  setComentario]  = useState('');

  useEffect(() => {
    clienteAuthApi.detalheImovel(id!).then(r => {
      setImovel(r.data.imovel);
      setComodos(r.data.comodos || []);
      fetch(`/api/imoveis/${id}/fotos`).then(res => res.json()).then((ft: { id: string }[]) => {
        setFotoIds(ft.map(f => f.id));
      });
      // Preenche avaliações existentes
      const av = r.data.avaliacao_existente;
      if (av) {
        setEditando(true);
        setInteresse(av.interesse || '');
        setComentario(av.comentario || '');
        const nf: Record<string, number> = {};
        for (const c of CRITERIOS_FIXOS) {
          if (av[c.key]) nf[c.key] = av[c.key];
        }
        setNotasFixas(nf);
      }
      const notasExist: Record<string, NotaComodo> = {};
      for (const n of (r.data.avaliacoes_existentes || [])) {
        notasExist[n.comodo_id] = { comodo_id: n.comodo_id, nota: n.nota, comentario: n.comentario || '' };
      }
      setNotasComodo(notasExist);
    }).catch(() => navigate('/cliente/imoveis'))
      .finally(() => setLoading(false));
  }, [id]);

  const setNota = (comodoId: string, nota: number) =>
    setNotasComodo(p => ({ ...p, [comodoId]: { ...p[comodoId], comodo_id: comodoId, nota, comentario: p[comodoId]?.comentario || '' } }));

  const setComentarioComodo = (comodoId: string, c: string) =>
    setNotasComodo(p => ({ ...p, [comodoId]: { ...p[comodoId], comodo_id: comodoId, nota: p[comodoId]?.nota || 0, comentario: c } }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!interesse) { setErro('Selecione seu interesse pelo imóvel.'); return; }
    if (!CRITERIOS_FIXOS.every(c => (notasFixas[c.key] || 0) > 0)) { setErro('Avalie todos os critérios gerais.'); return; }
    if (comodos.length > 0) {
      const faltando = comodos.filter(c => !(notasComodo[c.id]?.nota > 0));
      if (faltando.length > 0) { setErro(`Avalie todos os itens: ${faltando.map(c => c.nome).join(', ')}`); return; }
    }
    setSending(true); setErro('');
    try {
      await clienteAuthApi.avaliar(id!, {
        interesse,
        comentario,
        notas_fixas: notasFixas,
        avaliacoes: Object.values(notasComodo).filter(n => n.nota > 0),
      });
      setSucesso(true);
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao enviar avaliação.');
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (sucesso) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-surface-950 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-5">{editando ? '✏️' : '🎉'}</div>
        <h2 className="font-display font-bold text-white text-2xl mb-3">
          {editando ? 'Avaliação atualizada!' : 'Avaliação enviada!'}
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          {editando ? 'Suas alterações foram salvas com sucesso.' : 'Obrigado por avaliar este imóvel.'}
        </p>
        <button onClick={() => navigate(editando ? '/cliente/imoveis?aba=avaliacoes' : '/cliente/imoveis')} className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm">
          {editando ? 'Voltar às avaliações' : 'Ver outros imóveis'}
        </button>
      </div>
    </div>
  );

  const titulo    = String(imovel?.titulo || '');
  const descricao = String(imovel?.descricao || '');
  const todosFixos = CRITERIOS_FIXOS.every(c => (notasFixas[c.key] || 0) > 0);
  const todosComodos = comodos.length === 0 || comodos.every(c => notasComodo[c.id]?.nota > 0);

  return (
    <div className="min-h-screen bg-surface-50 pb-8">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/cliente/imoveis')} className="text-slate-400 hover:text-slate-700 transition-colors">←</button>
          <p className="font-display font-semibold text-slate-900 text-sm truncate">{titulo}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Carrossel */}
        {fotoIds.length > 0 && (
          <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-100">
            <img src={fotoUrl(fotoIds[fotoAtual])} alt="" className="w-full h-full object-cover" />
            {fotoIds.length > 1 && (
              <>
                <button onClick={() => setFotoAtual(p => (p - 1 + fotoIds.length) % fotoIds.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">‹</button>
                <button onClick={() => setFotoAtual(p => (p + 1) % fotoIds.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {fotoIds.map((_, i) => (
                    <button key={i} onClick={() => setFotoAtual(i)}
                      className={`h-1.5 rounded-full transition-all ${i === fotoAtual ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`} />
                  ))}
                </div>
                <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">{fotoAtual + 1}/{fotoIds.length}</span>
              </>
            )}
          </div>
        )}

        {descricao && <p className="text-sm text-slate-600">{descricao}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Critérios fixos ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-slate-900 mb-4">Critérios Gerais</h3>
            <div className="space-y-5">
              {CRITERIOS_FIXOS.map(c => {
                const nota = notasFixas[c.key] || 0;
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-800 text-sm">{c.icon} {c.label}</p>
                      {nota > 0 && <span className="text-yellow-500 text-xs font-mono">{nota}/5</span>}
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button"
                          onClick={() => setNotasFixas(p => ({ ...p, [c.key]: star }))}
                          className={`text-3xl transition-all hover:scale-110 ${star <= nota ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Cômodos customizados ── */}
          {comodos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-5">Itens do Imóvel</h3>
              <div className="space-y-6">
                {comodos.map(c => {
                  const av = notasComodo[c.id];
                  return (
                    <div key={c.id} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-800 text-sm">{c.nome}</p>
                        {av?.nota > 0 && <span className="text-yellow-500 text-xs font-mono">{av.nota}/5</span>}
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setNota(c.id, star)}
                            className={`text-3xl transition-all hover:scale-110 ${star <= (av?.nota || 0) ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>
                        ))}
                      </div>
                      <textarea value={av?.comentario || ''} onChange={e => setComentarioComodo(c.id, e.target.value)}
                        placeholder="Comentário sobre este item (opcional)..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none h-14 placeholder:text-slate-300" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Interesse + Comentário geral ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-slate-900 mb-3">Você tem interesse neste imóvel?</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([['SIM', '✅ Sim'], ['TALVEZ', '🤷 Talvez'], ['NAO', '❌ Não']] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setInteresse(val)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${interesse === val ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)}
              placeholder="Comentário geral sobre o imóvel (opcional)..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none h-20 placeholder:text-slate-300" />
          </div>

          {(!todosFixos || !todosComodos || !interesse) && (
            <p className="text-yellow-600 text-xs text-center">
              {!todosFixos ? 'Avalie todos os critérios gerais.' : ''}
              {!todosComodos ? ' Avalie todos os itens do imóvel.' : ''}
              {!interesse ? ' Indique seu interesse.' : ''}
            </p>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{erro}</div>
          )}

          <button type="submit" disabled={sending || !todosFixos || !todosComodos || !interesse}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
            {sending ? 'Salvando...' : editando ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
          </button>
        </form>
      </div>
    </div>
  );
}
