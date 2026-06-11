import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteAuthApi, fotoUrl } from '../services/api';

interface Comodo { id: string; nome: string; }
interface NotaComodo { comodo_id: string; nota: number; comentario: string; }

const CRITERIOS_FIXOS = [
  { key: 'nota_localizacao', label: 'Localização', icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',        icon: '💰' },
  { key: 'nota_estado',      label: 'Conservação',  icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',      icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',     icon: '🛋️' },
] as const;

const INTERESSE_OPTS = [
  { val: 'SIM',    label: 'Tenho interesse', emoji: '✅', active: 'bg-green-500 border-green-400 text-white', idle: 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/5' },
  { val: 'TALVEZ', label: 'Talvez',          emoji: '🤷', active: 'bg-yellow-500 border-yellow-400 text-white', idle: 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/5' },
  { val: 'NAO',    label: 'Sem interesse',   emoji: '❌', active: 'bg-red-500 border-red-400 text-white', idle: 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/5' },
] as const;

function StarRow({ label, icon, value, onChange }: { label: string; icon: string; value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <p className="text-sm font-medium text-white/70">{icon} {label}</p>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            className={`text-2xl transition-all duration-75 hover:scale-110 ${s <= display ? 'text-yellow-400 drop-shadow-sm' : 'text-white/15'}`}>
            ★
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs font-semibold text-white/30 w-4">{value}</span>}
    </div>
  );
}

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
      fetch(`/api/imoveis/${id}/fotos`).then(res => res.json()).then((ft: { id: string }[]) => setFotoIds(ft.map(f => f.id)));
      const av = r.data.avaliacao_existente;
      if (av) {
        setEditando(true);
        setInteresse(av.interesse || '');
        setComentario(av.comentario || '');
        const nf: Record<string, number> = {};
        for (const c of CRITERIOS_FIXOS) { if (av[c.key]) nf[c.key] = av[c.key]; }
        setNotasFixas(nf);
      }
      const notasExist: Record<string, NotaComodo> = {};
      for (const n of (r.data.avaliacoes_existentes || [])) {
        notasExist[n.comodo_id] = { comodo_id: n.comodo_id, nota: n.nota, comentario: n.comentario || '' };
      }
      setNotasComodo(notasExist);
    }).catch(() => navigate('/cliente/imoveis')).finally(() => setLoading(false));
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
      await clienteAuthApi.avaliar(id!, { interesse, comentario, notas_fixas: notasFixas, avaliacoes: Object.values(notasComodo).filter(n => n.nota > 0) });
      setSucesso(true);
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao enviar avaliação.');
    } finally { setSending(false); }
  };

  const totalFixos = CRITERIOS_FIXOS.length;
  const preenchidosFixos = CRITERIOS_FIXOS.filter(c => (notasFixas[c.key] || 0) > 0).length;
  const preenchidosComodos = comodos.filter(c => notasComodo[c.id]?.nota > 0).length;
  const totalItens = totalFixos + comodos.length + 1;
  const preenchidos = preenchidosFixos + preenchidosComodos + (interesse ? 1 : 0);
  const progresso = totalItens > 0 ? Math.round((preenchidos / totalItens) * 100) : 0;
  const pronto = preenchidosFixos === totalFixos && preenchidosComodos === comodos.length && !!interesse;

  const titulo = String(imovel?.titulo || '');

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (sucesso) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 text-4xl">
          {editando ? '✏️' : '🎉'}
        </div>
        <h2 className="font-display font-bold text-white text-2xl mb-2">
          {editando ? 'Avaliação atualizada!' : 'Avaliação enviada!'}
        </h2>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          {editando ? 'Suas alterações foram salvas. A imobiliária irá revisá-las em breve.' : 'Obrigado pelo seu feedback! A imobiliária irá revisá-lo em breve.'}
        </p>
        <button onClick={() => navigate(editando ? '/cliente/imoveis?aba=avaliacoes' : '/cliente/imoveis')}
          className="px-8 py-3 rounded-xl bg-white text-brand-800 font-display font-bold text-sm hover:bg-slate-100 transition-colors">
          {editando ? 'Ver minhas avaliações' : 'Voltar ao início'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed pb-12">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/cliente/imoveis')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-white text-sm truncate">{titulo}</p>
            <p className="text-[10px] text-white/40">{editando ? 'Editando avaliação' : 'Nova avaliação'}</p>
          </div>
          {/* Progresso */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
            </div>
            <span className="text-[10px] text-white/40 font-medium w-7">{progresso}%</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* ── FOTO ── */}
        {fotoIds.length > 0 && (
          <div className="relative h-52 rounded-2xl overflow-hidden shadow-xl">
            <img src={fotoUrl(fotoIds[fotoAtual])} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {fotoIds.length > 1 && (<>
              <button onClick={() => setFotoAtual(p => (p - 1 + fotoIds.length) % fotoIds.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm text-lg">←</button>
              <button onClick={() => setFotoAtual(p => (p + 1) % fotoIds.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm text-lg">→</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {fotoIds.map((_, i) => (
                  <button key={i} onClick={() => setFotoAtual(i)}
                    className={`h-1.5 rounded-full transition-all ${i === fotoAtual ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`} />
                ))}
              </div>
            </>)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── CRITÉRIOS GERAIS ── */}
          <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">Critérios Gerais</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${preenchidosFixos === totalFixos ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                {preenchidosFixos}/{totalFixos}
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              {CRITERIOS_FIXOS.map(c => (
                <StarRow key={c.key} label={c.label} icon={c.icon}
                  value={notasFixas[c.key] || 0}
                  onChange={v => setNotasFixas(p => ({ ...p, [c.key]: v }))} />
              ))}
            </div>
          </div>

          {/* ── CÔMODOS ── */}
          {comodos.length > 0 && (
            <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-display font-semibold text-white">Itens do Imóvel</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${preenchidosComodos === comodos.length ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                  {preenchidosComodos}/{comodos.length}
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {comodos.map(c => {
                  const av = notasComodo[c.id];
                  const avaliado = av?.nota > 0;
                  return (
                    <div key={c.id} className={`px-5 py-4 transition-colors ${avaliado ? 'bg-green-500/5' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${avaliado ? 'bg-green-400' : 'bg-white/20'}`} />
                        <p className="font-medium text-white/80 text-sm">{c.nome}</p>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button" onClick={() => setNota(c.id, s)}
                            className={`text-2xl transition-all hover:scale-110 ${s <= (av?.nota || 0) ? 'text-yellow-400' : 'text-white/15'}`}>★</button>
                        ))}
                        {av?.nota > 0 && <span className="text-xs text-white/30 self-center ml-1">{av.nota}/5</span>}
                      </div>
                      <textarea value={av?.comentario || ''} onChange={e => setComentarioComodo(c.id, e.target.value)}
                        placeholder="Observação (opcional)..."
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none h-12 placeholder:text-white/20" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INTERESSE ── */}
          <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10">
              <h3 className="font-display font-semibold text-white">Você tem interesse neste imóvel?</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {INTERESSE_OPTS.map(opt => {
                  const ativo = interesse === opt.val;
                  return (
                    <button key={opt.val} type="button" onClick={() => setInteresse(opt.val)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${ativo ? opt.active + ' shadow-lg' : opt.idle}`}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Comentário geral <span className="font-normal">(opcional)</span></label>
                <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                  placeholder="O que você achou do imóvel no geral?"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none h-20 placeholder:text-white/20" />
              </div>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
              <span>⚠️</span><span>{erro}</span>
            </div>
          )}

          {!pronto && !erro && preenchidos > 0 && (
            <p className="text-center text-xs text-white/30">
              {!interesse ? 'Indique seu interesse para finalizar' : 'Avalie todos os itens para continuar'}
            </p>
          )}

          <button type="submit" disabled={sending || !pronto}
            className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-[0.98] ${
              pronto ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-900/50' : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}>
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : editando ? '✓ Atualizar Avaliação' : '✓ Enviar Avaliação'}
          </button>
        </form>
      </div>
    </div>
  );
}
