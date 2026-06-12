import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { clienteAuthApi, fotoUrl } from '../services/api';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (v?: number | string) =>
  v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
const fmtData = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= value ? 'text-yellow-400' : 'text-slate-200'}>★</span>
      ))}
    </span>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />;
}

// ─────────────────────────────────────────────────────────────
// MODAL PERFIL
// ─────────────────────────────────────────────────────────────
function ModalPerfil({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const cliente = JSON.parse(localStorage.getItem('vr_cliente') || '{}');
  const iniciais = (cliente.nome || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  const [aba, setAba] = useState<'perfil' | 'senha'>('perfil');

  // Perfil
  const [nome, setNome] = useState(cliente.nome || '');
  const [telefone, setTelefone] = useState(cliente.telefone || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState('');
  const [erroPerfil, setErroPerfil] = useState('');

  // Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConf, setSenhaConf] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  const handleSalvarPerfil = async (e: FormEvent) => {
    e.preventDefault();
    setErroPerfil(''); setMsgPerfil('');
    setSalvandoPerfil(true);
    try {
      const r = await clienteAuthApi.atualizarPerfil({ nome, telefone });
      localStorage.setItem('vr_cliente', JSON.stringify({ ...cliente, ...r.data }));
      setMsgPerfil('Perfil atualizado!');
    } catch (err: unknown) {
      setErroPerfil((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao salvar.');
    } finally { setSalvandoPerfil(false); }
  };

  const handleTrocarSenha = async (e: FormEvent) => {
    e.preventDefault();
    setErroSenha(''); setMsgSenha('');
    if (senhaNova !== senhaConf) { setErroSenha('As senhas não conferem.'); return; }
    if (senhaNova.length < 6) { setErroSenha('Mínimo 6 caracteres.'); return; }
    setSalvandoSenha(true);
    try {
      await clienteAuthApi.trocarSenha(senhaAtual, senhaNova);
      setMsgSenha('Senha alterada com sucesso!');
      setSenhaAtual(''); setSenhaNova(''); setSenhaConf('');
    } catch (err: unknown) {
      setErroSenha((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao trocar senha.');
    } finally { setSalvandoSenha(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-slate-400';

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header do perfil */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 pt-6 pb-8 rounded-t-3xl sm:rounded-t-2xl relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-xl">✕</button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-display font-bold text-xl shrink-0">
              {iniciais}
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight">{cliente.nome}</p>
              <p className="text-white/60 text-xs mt-0.5">{cliente.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          {([['perfil', '👤 Meus dados'], ['senha', '🔐 Senha']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${aba === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* ── ABA PERFIL ── */}
          {aba === 'perfil' && (
            <form onSubmit={handleSalvarPerfil} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Nome completo</label>
                <input value={nome} onChange={e => setNome(e.target.value)} required className={inputCls} placeholder="Seu nome" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Email</label>
                <input value={cliente.email} disabled className={inputCls + ' bg-slate-50 text-slate-400 cursor-not-allowed'} />
                <p className="text-[10px] text-slate-400 mt-1">O email não pode ser alterado.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Telefone</label>
                <input value={telefone} onChange={e => setTelefone(e.target.value)} className={inputCls} placeholder="(11) 99999-0000" inputMode="tel" />
              </div>
              {erroPerfil && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erroPerfil}</p>}
              {msgPerfil && <p className="text-green-600 text-xs bg-green-50 border border-green-200 rounded-xl px-3 py-2">✓ {msgPerfil}</p>}
              <button type="submit" disabled={salvandoPerfil}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm hover:bg-brand-500 transition-colors disabled:opacity-60">
                {salvandoPerfil ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          )}

          {/* ── ABA SENHA ── */}
          {aba === 'senha' && (
            <form onSubmit={handleTrocarSenha} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Senha atual</label>
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Nova senha</label>
                <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} required minLength={6} className={inputCls} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Confirmar nova senha</label>
                <input type="password" value={senhaConf} onChange={e => setSenhaConf(e.target.value)} required className={inputCls} placeholder="••••••••" />
              </div>
              {erroSenha && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erroSenha}</p>}
              {msgSenha && <p className="text-green-600 text-xs bg-green-50 border border-green-200 rounded-xl px-3 py-2">✓ {msgSenha}</p>}
              <button type="submit" disabled={salvandoSenha}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm hover:bg-brand-500 transition-colors disabled:opacity-60">
                {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
              </button>
            </form>
          )}

          {/* Sair */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button onClick={onLogout}
              className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
              ⏏ Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// ABA EXTERNOS
// ─────────────────────────────────────────────────────────────
interface ImovelExterno {
  id: string; titulo: string; endereco?: string; bairro?: string; cidade?: string;
  preco?: number; metragem?: number; quartos?: number; banheiros?: number;
  observacoes?: string; interesse?: string; avaliado_em?: string; soma_notas?: number;
}

const CRITERIOS_EXT = [
  { key: 'nota_localizacao', label: 'Localização', icon: '📍' },
  { key: 'nota_preco',       label: 'Preço',       icon: '💰' },
  { key: 'nota_estado',      label: 'Conservação', icon: '🔧' },
  { key: 'nota_tamanho',     label: 'Tamanho',     icon: '📐' },
  { key: 'nota_conforto',    label: 'Conforto',    icon: '🛋️' },
] as const;

const INT_LABEL: Record<string, { label: string; color: string }> = {
  SIM:    { label: '✅ Interesse',  color: 'text-green-700 bg-green-50 border-green-200' },
  TALVEZ: { label: '🤷 Talvez',    color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  NAO:    { label: '❌ Sem int.',   color: 'text-red-600 bg-red-50 border-red-200' },
};

function ModalImovelExterno({ item, onClose, onSaved }: { item?: ImovelExterno; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    titulo: item?.titulo || '', endereco: item?.endereco || '', bairro: item?.bairro || '',
    cidade: item?.cidade || '', preco: item?.preco ? String(item.preco) : '',
    metragem: item?.metragem ? String(item.metragem) : '', quartos: item?.quartos ? String(item.quartos) : '',
    banheiros: item?.banheiros ? String(item.banheiros) : '', observacoes: item?.observacoes || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputCls = 'input w-full mt-1';

  const handleSalvar = async () => {
    if (!form.titulo.trim()) { setErro('Informe o título/endereço do imóvel.'); return; }
    setSalvando(true); setErro('');
    try {
      const body = { ...form, preco: form.preco ? Number(form.preco) : undefined, metragem: form.metragem ? Number(form.metragem) : undefined, quartos: form.quartos ? Number(form.quartos) : undefined, banheiros: form.banheiros ? Number(form.banheiros) : undefined };
      if (item) await clienteAuthApi.editarExterno(item.id, body);
      else await clienteAuthApi.criarExterno(body);
      onSaved();
    } catch (e: unknown) {
      setErro((e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao salvar.');
    } finally { setSalvando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-display font-bold text-slate-900">{item ? 'Editar imóvel' : 'Adicionar imóvel visitado'}</h3>
          <button onClick={onClose} className="text-slate-400 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-500">Nome / Endereço *</label><input className={inputCls} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Apt. Rua das Flores, 123" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-500">Bairro</label><input className={inputCls} value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-slate-500">Cidade</label><input className={inputCls} value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-500">Preço (R$)</label><input className={inputCls} type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-slate-500">Metragem (m²)</label><input className={inputCls} type="number" value={form.metragem} onChange={e => setForm(f => ({ ...f, metragem: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-500">Quartos</label><input className={inputCls} type="number" value={form.quartos} onChange={e => setForm(f => ({ ...f, quartos: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-slate-500">Banheiros</label><input className={inputCls} type="number" value={form.banheiros} onChange={e => setForm(f => ({ ...f, banheiros: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-500">Observações</label><textarea className="input w-full mt-1 h-16 resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          {erro && <p className="text-red-500 text-xs">{erro}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={handleSalvar} disabled={salvando} className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm disabled:opacity-50">
            {salvando ? 'Salvando...' : item ? 'Salvar alterações' : 'Adicionar imóvel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ModalAvaliarExterno({ item, onClose, onSaved }: { item: ImovelExterno; onClose: () => void; onSaved: () => void }) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [interesse, setInteresse] = useState('');
  const [comentario, setComentario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSalvar = async () => {
    if (!interesse) { setErro('Selecione seu interesse.'); return; }
    if (CRITERIOS_EXT.some(c => !notas[c.key])) { setErro('Avalie todos os critérios.'); return; }
    setSalvando(true); setErro('');
    try { await clienteAuthApi.avaliarExterno(item.id, { interesse, comentario, ...notas }); onSaved(); }
    catch (e: unknown) { setErro((e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao salvar.'); }
    finally { setSalvando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-display font-bold text-slate-900 truncate">Avaliar: {item.titulo}</h3>
          <button onClick={onClose} className="text-slate-400 text-xl ml-2 shrink-0">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="space-y-4">
            {CRITERIOS_EXT.map(c => (
              <div key={c.key}>
                <p className="text-sm font-medium text-slate-700 mb-1.5">{c.icon} {c.label}</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setNotas(n => ({ ...n, [c.key]: s }))}
                      className={`text-3xl transition-all hover:scale-110 ${s <= (notas[c.key] || 0) ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Tem interesse neste imóvel?</p>
            <div className="grid grid-cols-3 gap-2">
              {([['SIM', '✅ Sim'], ['TALVEZ', '🤷 Talvez'], ['NAO', '❌ Não']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setInteresse(v)}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${interesse === v ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder="Comentário (opcional)..." className="input w-full h-16 resize-none" />
          {erro && <p className="text-red-500 text-xs">{erro}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={handleSalvar} disabled={salvando}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar avaliação'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AbaExternos() {
  const [externos, setExternos] = useState<ImovelExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalForm, setModalForm] = useState<{ open: boolean; item?: ImovelExterno }>({ open: false });
  const [modalAvaliar, setModalAvaliar] = useState<ImovelExterno | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const load = () => { setLoading(true); clienteAuthApi.listarExternos().then(r => setExternos(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      {modalForm.open && <ModalImovelExterno item={modalForm.item} onClose={() => setModalForm({ open: false })} onSaved={() => { setModalForm({ open: false }); load(); }} />}
      {modalAvaliar && <ModalAvaliarExterno item={modalAvaliar} onClose={() => setModalAvaliar(null)} onSaved={() => { setModalAvaliar(null); load(); }} />}
      <button onClick={() => setModalForm({ open: true })}
        className="w-full py-3.5 mb-4 rounded-2xl border-2 border-dashed border-brand-200 text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors flex items-center justify-center gap-2">
        <span className="text-lg">+</span> Adicionar imóvel visitado
      </button>
      {externos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏘️</div>
          <p className="text-slate-700 font-semibold">Nenhum imóvel adicionado</p>
          <p className="text-slate-400 text-sm mt-1">Adicione imóveis que você visitou por conta própria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {externos.map(ext => (
            <div key={ext.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900 truncate">{ext.titulo}</p>
                  {(ext.bairro || ext.cidade) && <p className="text-xs text-slate-400">{[ext.bairro, ext.cidade].filter(Boolean).join(', ')}</p>}
                  {ext.preco && <p className="text-xs font-mono font-semibold text-brand-600 mt-0.5">{Number(ext.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                </div>
                {ext.interesse && (
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full border shrink-0 ml-2 ${INT_LABEL[ext.interesse]?.color}`}>
                    {INT_LABEL[ext.interesse]?.label}
                  </span>
                )}
              </div>
              {ext.observacoes && <p className="text-xs text-slate-500 italic mb-3">"{ext.observacoes}"</p>}
              <div className="flex gap-2">
                <button onClick={() => setModalAvaliar(ext)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${ext.interesse ? 'border border-brand-200 text-brand-700 hover:bg-brand-50' : 'bg-brand-600 text-white hover:bg-brand-500'}`}>
                  {ext.interesse ? '✏️ Editar avaliação' : '⭐ Avaliar'}
                </button>
                <button onClick={() => setModalForm({ open: true, item: ext })} className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs">✏️</button>
                <button onClick={async () => { setExcluindo(ext.id); try { await clienteAuthApi.excluirExterno(ext.id); load(); } finally { setExcluindo(null); } }}
                  disabled={excluindo === ext.id} className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 text-xs disabled:opacity-50">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface ImovelCliente {
  id: string; titulo: string; descricao?: string; bairro?: string; cidade?: string;
  preco?: number; metragem?: number; quartos?: number; banheiros?: number; vagas?: number;
  foto_ids: string[]; ja_avaliado: boolean; ja_liberado: boolean; tem_agendamento: boolean;
}
interface MinhaAvaliacao {
  id: string; imovel_id: string; imovel_titulo: string; imovel_preco?: number; bairro?: string; cidade?: string;
  media_itens: number; total_itens: number;
  interesse: 'SIM' | 'TALVEZ' | 'NAO'; comentario?: string; criado_em: string; foto_ids: string[];
}
interface AvaliacaoCompleta {
  avaliacao_existente: { interesse: string; comentario?: string; nota_localizacao?: number; nota_preco?: number; nota_estado?: number; nota_tamanho?: number; nota_conforto?: number; } | null;
  avaliacoes_existentes: { comodo_id: string; nota: number; comentario?: string }[];
  comodos: { id: string; nome: string }[];
}
interface Slot { disponibilidade_id: string; hora_inicio: string; hora_fim: string; corretor_id: string; corretor_nome: string; }

const INTERESSE_LABEL: Record<string, { label: string; color: string }> = {
  SIM:    { label: '✅ Tenho interesse',  color: 'text-green-700 bg-green-50 border-green-200' },
  TALVEZ: { label: '🤷 Talvez',           color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  NAO:    { label: '❌ Sem interesse',    color: 'text-red-600 bg-red-50 border-red-200' },
};

const CRITERIOS = [
  { key: 'nota_localizacao', label: 'Localização' },
  { key: 'nota_preco',       label: 'Preço'        },
  { key: 'nota_estado',      label: 'Estado'       },
  { key: 'nota_tamanho',     label: 'Tamanho'      },
  { key: 'nota_conforto',    label: 'Conforto'     },
] as const;

// ─────────────────────────────────────────────────────────────
// LIGHTBOX / CARROSSEL
// ─────────────────────────────────────────────────────────────
function Lightbox({ fotoIds, inicial, onClose }: { fotoIds: string[]; inicial: number; onClose: () => void }) {
  const [idx, setIdx] = useState(inicial);
  const prev = useCallback(() => setIdx(i => (i - 1 + fotoIds.length) % fotoIds.length), [fotoIds.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % fotoIds.length), [fotoIds.length]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') prev(); else if (e.key === 'ArrowRight') next(); else if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [prev, next, onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-2xl">✕</button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">{idx + 1} / {fotoIds.length}</span>
      {fotoIds.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl">←</button>
        <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white text-3xl">→</button>
      </>}
      <img src={fotoUrl(fotoIds[idx])} alt="" className="max-h-[90vh] max-w-[90vw] object-contain select-none" onClick={e => e.stopPropagation()} />
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL AGENDAR VISITA (calendário)
// ─────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function ModalAgendarVisita({ imovel, onClose, onAgendado }: { imovel: ImovelCliente; onClose: () => void; onAgendado: () => void }) {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  const [passo, setPasso] = useState<'calendario' | 'slots' | 'confirmado'>('calendario');
  const [mesAtual, setMesAtual] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [datasDisponiveis, setDatasDisponiveis] = useState<Set<string>>(new Set());
  const [loadingDatas, setLoadingDatas] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [agendando, setAgendando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (passo !== 'calendario') return;
    setLoadingDatas(true);
    const mesStr = `${mesAtual.ano}-${String(mesAtual.mes + 1).padStart(2, '0')}`;
    clienteAuthApi.datasDisponiveis(imovel.id, mesStr)
      .then(r => setDatasDisponiveis(new Set(r.data as string[])))
      .catch(() => setDatasDisponiveis(new Set()))
      .finally(() => setLoadingDatas(false));
  }, [mesAtual.ano, mesAtual.mes, imovel.id, passo]);

  const irMesAnterior = () => setMesAtual(m => m.mes === 0 ? { ano: m.ano - 1, mes: 11 } : { ...m, mes: m.mes - 1 });
  const irProximoMes = () => setMesAtual(m => m.mes === 11 ? { ano: m.ano + 1, mes: 0 } : { ...m, mes: m.mes + 1 });

  const diasNoMes = new Date(mesAtual.ano, mesAtual.mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(mesAtual.ano, mesAtual.mes, 1).getDay();
  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];
  while (celulas.length % 7 !== 0) celulas.push(null);

  const getDiaStr = (dia: number) => `${mesAtual.ano}-${String(mesAtual.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const mesAtualEhPassado = mesAtual.ano < hoje.getFullYear() || (mesAtual.ano === hoje.getFullYear() && mesAtual.mes < hoje.getMonth());

  const selecionarData = async (diaStr: string) => {
    if (!datasDisponiveis.has(diaStr)) return;
    setDataSelecionada(diaStr); setLoadingSlots(true); setErro('');
    try { const r = await clienteAuthApi.slots(diaStr, imovel.id); setSlots(r.data); setPasso('slots'); }
    catch { setErro('Erro ao buscar horários.'); }
    finally { setLoadingSlots(false); }
  };

  const confirmarAgendamento = async () => {
    if (!slotSelecionado) return;
    setAgendando(true); setErro('');
    try {
      await clienteAuthApi.agendar({ imovel_id: imovel.id, corretor_id: slotSelecionado.corretor_id, data_hora: `${dataSelecionada}T${slotSelecionado.hora_inicio}:00` });
      setPasso('confirmado');
    } catch (e: unknown) { setErro((e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao agendar.'); }
    finally { setAgendando(false); }
  };

  const fmtHora = (h: string) => h.slice(0, 5);
  const fmtDataLonga = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={passo !== 'confirmado' ? onClose : undefined}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        {passo === 'confirmado' ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-3xl mb-4">✅</div>
            <h3 className="font-display font-bold text-slate-900 text-xl mb-2">Visita agendada!</h3>
            <p className="text-sm text-slate-500 mb-1">{imovel.titulo}</p>
            <p className="text-sm font-medium text-brand-600 mb-1 capitalize">{fmtDataLonga(dataSelecionada)}</p>
            <p className="text-sm text-slate-600 mb-6">{slotSelecionado && `${fmtHora(slotSelecionado.hora_inicio)} – ${fmtHora(slotSelecionado.hora_fim)} · ${slotSelecionado.corretor_nome}`}</p>
            <button onClick={() => { onAgendado(); onClose(); }} className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm hover:bg-brand-500 transition-colors">Ótimo! 🎉</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0"><h3 className="font-display font-bold text-slate-900">Agendar Visita</h3><p className="text-xs text-slate-400 truncate mt-0.5">{imovel.titulo}</p></div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl ml-3 shrink-0">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {passo === 'calendario' && (<>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Disponível</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Indisponível</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={irMesAnterior} disabled={mesAtualEhPassado} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 text-lg">‹</button>
                  <p className="font-display font-semibold text-slate-800 text-sm">{MESES[mesAtual.mes]} {mesAtual.ano}</p>
                  <button onClick={irProximoMes} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">›</button>
                </div>
                {loadingDatas ? <div className="flex justify-center py-10"><Spinner /></div> : (
                  <div>
                    <div className="grid grid-cols-7 mb-1">{DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                      {celulas.map((dia, idx) => {
                        if (!dia) return <div key={idx} />;
                        const diaStr = getDiaStr(dia);
                        const ePassado = diaStr < hojeStr;
                        const disponivel = datasDisponiveis.has(diaStr);
                        const selecionado = diaStr === dataSelecionada;
                        let cls = 'w-full aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ';
                        if (ePassado) cls += 'text-slate-300 cursor-not-allowed';
                        else if (selecionado) cls += 'bg-brand-600 text-white shadow-md cursor-pointer ring-2 ring-brand-400 ring-offset-1';
                        else if (disponivel) cls += 'bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-sm hover:shadow-md active:scale-95';
                        else cls += 'bg-red-100 text-red-400 cursor-not-allowed';
                        return <button key={idx} className={cls} disabled={ePassado || !disponivel} onClick={() => selecionarData(diaStr)}>{dia}</button>;
                      })}
                    </div>
                  </div>
                )}
                {loadingSlots && <div className="flex items-center justify-center gap-2 py-2 text-sm text-brand-600"><Spinner /><span>Buscando horários...</span></div>}
                {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}
              </>)}
              {passo === 'slots' && (<>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setPasso('calendario'); setSlotSelecionado(null); setDataSelecionada(''); }} className="text-slate-400 hover:text-slate-700 text-lg">←</button>
                  <div><p className="text-xs text-slate-400">Data</p><p className="font-medium text-slate-800 capitalize text-sm">{fmtDataLonga(dataSelecionada)}</p></div>
                </div>
                {slots.length === 0 ? <div className="text-center py-8"><p className="text-3xl mb-3">😔</p><p className="text-slate-700 font-medium text-sm">Nenhum horário disponível</p><p className="text-slate-400 text-xs mt-1">Tente outra data.</p></div> : (<>
                  <p className="text-sm font-medium text-slate-700">🕐 Escolha um horário</p>
                  <div className="space-y-2">
                    {slots.map((s, i) => {
                      const sel = slotSelecionado?.disponibilidade_id === s.disponibilidade_id && slotSelecionado?.corretor_id === s.corretor_id && slotSelecionado?.hora_inicio === s.hora_inicio;
                      return (
                        <button key={i} onClick={() => setSlotSelecionado(sel ? null : s)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left ${sel ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'}`}>
                          <div><p className={`text-sm font-semibold ${sel ? 'text-brand-700' : 'text-slate-800'}`}>{fmtHora(s.hora_inicio)} – {fmtHora(s.hora_fim)}</p><p className="text-xs text-slate-500 mt-0.5">🧑‍💼 {s.corretor_nome}</p></div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>{sel && <span className="text-white text-[10px] font-bold">✓</span>}</div>
                        </button>
                      );
                    })}
                  </div>
                </>)}
                {erro && <p className="text-red-500 text-xs">{erro}</p>}
                {slotSelecionado && <button onClick={confirmarAgendamento} disabled={agendando} className="w-full py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm disabled:opacity-50 hover:bg-brand-500">{agendando ? 'Agendando...' : '✓ Confirmar agendamento'}</button>}
              </>)}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL VER DETALHES DO IMÓVEL
// ─────────────────────────────────────────────────────────────
function ModalVerImovel({ imovel, onAgendar, onAvaliar, onClose }: { imovel: ImovelCliente; onAgendar?: () => void; onAvaliar?: () => void; onClose: () => void }) {
  const [fotoAtual, setFotoAtual] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {lightbox !== null && <Lightbox fotoIds={imovel.foto_ids} inicial={lightbox} onClose={() => setLightbox(null)} />}
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-slate-900 truncate">{imovel.titulo}</h3>
            {(imovel.bairro || imovel.cidade) && <p className="text-xs text-slate-400 mt-0.5">📍 {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl ml-3 shrink-0">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {imovel.foto_ids.length > 0 && (
            <div className="relative bg-slate-100" style={{ height: '220px' }}>
              <img src={fotoUrl(imovel.foto_ids[fotoAtual])} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(fotoAtual)} />
              {imovel.foto_ids.length > 1 && (<>
                <button onClick={e => { e.stopPropagation(); setFotoAtual(p => (p - 1 + imovel.foto_ids.length) % imovel.foto_ids.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center text-lg">←</button>
                <button onClick={e => { e.stopPropagation(); setFotoAtual(p => (p + 1) % imovel.foto_ids.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center text-lg">→</button>
                <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">{fotoAtual + 1}/{imovel.foto_ids.length}</span>
              </>)}
            </div>
          )}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              {imovel.preco && <p className="font-mono font-bold text-brand-600 text-xl">{fmt(imovel.preco)}</p>}
              {imovel.metragem && <p className="text-sm text-slate-500">📐 {imovel.metragem}m²</p>}
            </div>
            <div className="flex gap-3 flex-wrap">
              {imovel.quartos ? <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full">🛏 {imovel.quartos} quarto{imovel.quartos > 1 ? 's' : ''}</span> : null}
              {imovel.banheiros ? <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full">🚿 {imovel.banheiros} banh.</span> : null}
              {imovel.vagas ? <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full">🚗 {imovel.vagas} vaga{imovel.vagas > 1 ? 's' : ''}</span> : null}
            </div>
            {imovel.descricao && <p className="text-sm text-slate-600 leading-relaxed">{imovel.descricao}</p>}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Fechar</button>
          {!imovel.ja_avaliado && !imovel.ja_liberado && !imovel.tem_agendamento && onAgendar && (
            <button onClick={() => { onClose(); onAgendar(); }} className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-display font-semibold text-sm hover:bg-brand-500">📅 Agendar</button>
          )}
          {imovel.tem_agendamento && !imovel.ja_liberado && !imovel.ja_avaliado && (
            <span className="flex-1 py-3 text-center text-brand-700 text-sm font-semibold">🗓️ Visita agendada</span>
          )}
          {imovel.ja_liberado && !imovel.ja_avaliado && onAvaliar && (
            <button onClick={() => { onClose(); onAvaliar(); }} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-display font-semibold text-sm hover:bg-amber-400">⭐ Avaliar agora</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA IMÓVEIS
// ─────────────────────────────────────────────────────────────
function AbaImoveis({ imoveis, loading, onAvaliar, onAtualizar }: { imoveis: ImovelCliente[]; loading: boolean; onAvaliar: (id: string) => void; onAtualizar: () => void }) {
  const [verImovel, setVerImovel] = useState<ImovelCliente | null>(null);
  const [agendando, setAgendando] = useState<ImovelCliente | null>(null);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (imoveis.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🏠</div>
      <p className="text-slate-700 font-semibold text-lg">Nenhum imóvel disponível</p>
      <p className="text-slate-400 text-sm mt-1">Aguarde imóveis serem cadastrados pela imobiliária.</p>
    </div>
  );

  return (
    <>
      {verImovel && <ModalVerImovel imovel={verImovel} onClose={() => setVerImovel(null)} onAgendar={() => setAgendando(verImovel)} onAvaliar={() => onAvaliar(verImovel.id)} />}
      {agendando && <ModalAgendarVisita imovel={agendando} onClose={() => setAgendando(null)} onAgendado={() => { onAtualizar(); setAgendando(null); }} />}

      <div className="space-y-3">
        {imoveis.map(im => {
          const temFoto = im.foto_ids.length > 0;
          const statusBadge = im.ja_avaliado
            ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">✅ Avaliado</span>
            : im.ja_liberado
              ? <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">⭐ Avaliar agora</span>
              : im.tem_agendamento
                ? <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">🗓️ Agendado</span>
                : <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">🏠 Disponível</span>;

          const actionBtn = im.ja_avaliado ? (
            <button onClick={() => onAvaliar(im.id)}
              className="shrink-0 px-3 py-2 rounded-xl border border-brand-200 text-brand-600 hover:bg-brand-50 text-xs font-semibold transition-all">
              ✏️ Editar
            </button>
          ) : im.ja_liberado ? (
            <button onClick={() => onAvaliar(im.id)}
              className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-display font-semibold text-xs transition-all active:scale-95">
              ⭐ Avaliar
            </button>
          ) : im.tem_agendamento ? (
            <span className="shrink-0 px-3 py-2 text-brand-600 text-xs font-semibold">Aguardando visita</span>
          ) : (
            <button onClick={() => setAgendando(im)}
              className="shrink-0 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-xs transition-all active:scale-95">
              📅 Agendar
            </button>
          );

          return (
            <div key={im.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex items-stretch">
              {/* Thumbnail */}
              <div
                className="shrink-0 w-28 bg-slate-100 cursor-pointer relative overflow-hidden"
                onClick={() => setVerImovel(im)}
              >
                {temFoto ? (
                  <img src={fotoUrl(im.foto_ids[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">🏠</div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
                {/* Topo: título + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-slate-900 text-sm leading-tight truncate">{im.titulo}</p>
                    {(im.bairro || im.cidade) && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">📍 {[im.bairro, im.cidade].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  {statusBadge}
                </div>

                {/* Meio: preço + detalhes */}
                <div className="flex items-center gap-3 flex-wrap">
                  {im.preco && <p className="font-mono font-bold text-brand-600 text-sm">{fmt(im.preco)}</p>}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {im.quartos   ? <span>🛏 {im.quartos}</span>   : null}
                    {im.banheiros ? <span>🚿 {im.banheiros}</span> : null}
                    {im.metragem  ? <span>📐 {im.metragem}m²</span> : null}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setVerImovel(im)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all">
                    Ver detalhes
                  </button>
                  {actionBtn}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL AVALIAÇÃO COMPLETA
// ─────────────────────────────────────────────────────────────
function ModalAvaliacaoCompleta({ av, onClose }: { av: MinhaAvaliacao; onClose: () => void }) {
  const [dados, setDados] = useState<AvaliacaoCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const int = INTERESSE_LABEL[av.interesse];

  useEffect(() => { clienteAuthApi.detalheImovel(av.imovel_id).then(r => setDados(r.data)).finally(() => setLoading(false)); }, [av.imovel_id]);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-slate-900 truncate">{av.imovel_titulo}</h3>
            {(av.bairro || av.cidade) && <p className="text-xs text-slate-400 mt-0.5">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl ml-3 shrink-0">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <span className={`inline-flex text-xs font-medium px-3 py-1.5 rounded-full border ${int.color}`}>{int.label}</span>
          {av.comentario && <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-4 py-3">"{av.comentario}"</p>}
          {loading ? <div className="flex justify-center py-8"><Spinner /></div> : dados ? (<>
            {dados.avaliacao_existente && CRITERIOS.some(c => dados.avaliacao_existente![c.key]) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Critérios Gerais</p>
                <div className="space-y-2">
                  {CRITERIOS.map(c => { const nota = dados.avaliacao_existente![c.key]; if (!nota) return null; return (
                    <div key={c.key} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{c.label}</span>
                      <div className="flex items-center gap-2"><Stars value={nota} /><span className="text-xs text-slate-400 w-4">{nota}</span></div>
                    </div>
                  ); })}
                </div>
              </div>
            )}
            {dados.avaliacoes_existentes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Itens do Imóvel</p>
                <div className="space-y-2">
                  {dados.avaliacoes_existentes.map(ac => { const comodo = dados.comodos.find(c => c.id === ac.comodo_id); return (
                    <div key={ac.comodo_id}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{comodo?.nome || '—'}</span>
                        <div className="flex items-center gap-2"><Stars value={ac.nota} /><span className="text-xs text-slate-400 w-4">{ac.nota}</span></div>
                      </div>
                      {ac.comentario && <p className="text-xs text-slate-400 italic mt-0.5">"{ac.comentario}"</p>}
                    </div>
                  ); })}
                </div>
              </div>
            )}
          </>) : null}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200">Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// ABA AVALIAÇÕES
// ─────────────────────────────────────────────────────────────
function AbaVisitas() {
  type Visita = {
    id: string; status: string; data_visita: string;
    titulo: string; bairro: string; cidade: string;
    corretor_nome: string; corretor_telefone: string | null;
    foto: string | null;
  };
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    setLoading(true);
    clienteAuthApi.minhasVisitas().then(r => setVisitas(r.data)).finally(() => setLoading(false));
  };
  useEffect(carregar, []);

  const cancelar = async (id: string) => {
    if (!confirm('Cancelar esta visita?')) return;
    try {
      await clienteAuthApi.cancelarVisita(id);
      carregar();
    } catch { alert('Não foi possível cancelar.'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (visitas.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📅</div>
      <p className="text-slate-700 font-semibold text-lg">Nenhuma visita agendada</p>
      <p className="text-slate-400 text-sm mt-1">Agende uma visita pela aba Imóveis.</p>
    </div>
  );

  const STATUS_STYLE: Record<string, string> = {
    agendada:  'bg-blue-100 text-blue-700',
    realizada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-600',
  };
  const STATUS_LABEL: Record<string, string> = {
    agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada',
  };

  return (
    <div className="space-y-3">
      {visitas.map(v => {
        const dt = new Date(v.data_visita);
        const dataBR = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const hora   = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={v.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="flex gap-3 p-3">
              {v.foto
                ? <img src={v.foto} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                : <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">🏠</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{v.titulo}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[v.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[v.status] || v.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{v.bairro} — {v.cidade}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-brand-600 text-xs font-semibold">📅 {dataBR}</span>
                  <span className="text-slate-400 text-xs">às {hora}</span>
                </div>
                {v.corretor_nome && (
                  <p className="text-xs text-slate-400 mt-0.5">Corretor: <span className="text-slate-600">{v.corretor_nome}</span></p>
                )}
              </div>
            </div>
            {v.status === 'agendada' && (
              <div className="border-t border-slate-100 px-3 py-2">
                <button onClick={() => cancelar(v.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                  Cancelar visita
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AbaAvaliacoes({ onEditar }: { onEditar: (imovelId: string) => void }) {
  const [avaliacoes, setAvaliacoes] = useState<MinhaAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [verCompleta, setVerCompleta] = useState<MinhaAvaliacao | null>(null);

  useEffect(() => { clienteAuthApi.minhasAvaliacoes().then(r => setAvaliacoes(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (avaliacoes.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">⭐</div>
      <p className="text-slate-700 font-semibold text-lg">Nenhuma avaliação ainda</p>
      <p className="text-slate-400 text-sm mt-1">Após visitar um imóvel, avalie-o aqui.</p>
    </div>
  );

  return (
    <>
      {verCompleta && <ModalAvaliacaoCompleta av={verCompleta} onClose={() => setVerCompleta(null)} />}
      <div className="space-y-4">
        {avaliacoes.map(av => {
          const int = INTERESSE_LABEL[av.interesse];
          const media = Number(av.media_itens);
          return (
            <div key={av.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {av.foto_ids?.length > 0 && (
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img src={fotoUrl(av.foto_ids[0])} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-display font-bold text-sm leading-tight drop-shadow">{av.imovel_titulo}</p>
                    {(av.bairro || av.cidade) && <p className="text-white/70 text-xs">{[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>}
                  </div>
                </div>
              )}
              <div className="p-4">
                {!av.foto_ids?.length && (
                  <div className="mb-3">
                    <p className="font-display font-bold text-slate-900">{av.imovel_titulo}</p>
                    {(av.bairro || av.cidade) && <p className="text-xs text-slate-400 mt-0.5">📍 {[av.bairro, av.cidade].filter(Boolean).join(', ')}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${int.color}`}>{int.label}</span>
                  <div className="flex items-center gap-1.5 text-right">
                    {av.total_itens > 0 && <><Stars value={Math.round(media)} /><span className="text-xs text-slate-400">{media.toFixed(1)}</span></>}
                    <span className="text-xs text-slate-300 ml-1">{fmtData(av.criado_em)}</span>
                  </div>
                </div>
                {av.comentario && <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl px-3 py-2 mb-3 line-clamp-2">"{av.comentario}"</p>}
                <div className="flex gap-2">
                  <button onClick={() => setVerCompleta(av)} className="flex-1 py-2.5 rounded-xl border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-50 transition-colors">Ver completa →</button>
                  <button onClick={() => onEditar(av.imovel_id)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 text-xs font-medium transition-colors">✏️ Editar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ClienteImoveisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [imoveis, setImoveis] = useState<ImovelCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPerfil, setShowPerfil] = useState(false);

  const abaParam = new URLSearchParams(location.search).get('aba');
  const abaInicial = abaParam === 'avaliacoes' ? 'avaliacoes' : abaParam === 'externos' ? 'externos' : abaParam === 'visitas' ? 'visitas' : 'imoveis';
  const [aba, setAba] = useState<'imoveis' | 'visitas' | 'avaliacoes' | 'externos'>(abaInicial);

  const cliente = JSON.parse(localStorage.getItem('vr_cliente') || '{}');
  const iniciais = (cliente.nome || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  // Stats rápidas
  const totalImoveis = imoveis.length;
  const avaliados = imoveis.filter(i => i.ja_avaliado).length;
  const [agendados, setAgendados] = useState(0);

  const carregarImoveis = () => {
    setLoading(true);
    clienteAuthApi.todosImoveis().then(r => setImoveis(r.data)).finally(() => setLoading(false));
  };
  const carregarAgendados = () => {
    clienteAuthApi.minhasVisitas().then(r => {
      setAgendados(r.data.filter((v: { status: string }) => v.status === 'agendada').length);
    }).catch(() => {});
  };
  useEffect(() => { carregarImoveis(); carregarAgendados(); }, []);
  useEffect(() => { if (aba === 'imoveis') { carregarImoveis(); carregarAgendados(); } }, [aba]);

  const handleLogout = () => {
    localStorage.removeItem('vr_cli_token');
    localStorage.removeItem('vr_cliente');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 bg-fixed">

      {/* ── HEADER ── */}
      <div className="pt-6 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-display font-bold text-xs">V</div>
              <span className="text-white/80 text-sm font-medium">VisitRank</span>
            </div>
            <button onClick={() => setShowPerfil(true)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-display font-bold text-sm transition-colors">
              {iniciais}
            </button>
          </div>
          <p className="text-white/70 text-sm">Olá,</p>
          <h1 className="text-white font-display font-bold text-2xl mt-0.5">{cliente.nome?.split(' ')[0]} 👋</h1>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Imóveis', valor: totalImoveis, icon: '🏠' },
                { label: 'Agendados', valor: agendados, icon: '📅' },
                { label: 'Avaliados', valor: avaliados, icon: '⭐' },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-3 py-3 text-center">
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-white font-display font-bold text-xl leading-none mt-1">{s.valor}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CARD FLUTUANTE ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([
              ['imoveis',    '🏠', 'Imóveis'   ],
              ['visitas',    '📅', 'Visitas'   ],
              ['avaliacoes', '⭐', 'Avaliações' ],
              ['externos',   '🏘️', 'Outros'    ],
            ] as const).map(([key, icon, label]) => (
              <button key={key} onClick={() => setAba(key)}
                className={`flex-1 py-3.5 text-xs font-semibold flex flex-col items-center gap-0.5 border-b-2 transition-colors ${aba === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="p-4">
            {aba === 'imoveis' && (
              <AbaImoveis imoveis={imoveis} loading={loading} onAvaliar={id => navigate(`/cliente/imoveis/${id}`)} onAtualizar={carregarImoveis} />
            )}
            {aba === 'visitas' && <AbaVisitas />}
            {aba === 'avaliacoes' && (
              <AbaAvaliacoes onEditar={id => navigate(`/cliente/imoveis/${id}`)} />
            )}
            {aba === 'externos' && <AbaExternos />}
          </div>
        </div>
      </div>

      {/* Modal Perfil */}
      {showPerfil && <ModalPerfil onClose={() => setShowPerfil(false)} onLogout={handleLogout} />}
    </div>
  );
}
