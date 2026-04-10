import React, { useEffect, useState, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { imoveisApi, fotoUrl } from '../services/api';
import { PageHeader, LoadingSpinner, ErrorMsg, SuccessMsg } from '../components/ui';

interface Foto { id: string; ordem: number; mime_type: string; }
interface Comodo { id: string; nome: string; ordem: number; }

export default function ImovelFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ titulo:'', descricao:'', observacao:'', bairro:'', cidade:'', preco:'', metragem:'', quartos:'', banheiros:'', vagas:'' });
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [comodos, setComodos] = useState<Comodo[]>([]);
  const [novoComodo, setNovoComodo] = useState('');
  const [editComodo, setEditComodo] = useState<{ id: string; nome: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const loadFotos   = () => isEdit && imoveisApi.listarFotos(id!).then(r => setFotos(r.data));
  const loadComodos = () => isEdit && imoveisApi.listarComodos(id!).then(r => setComodos(r.data));

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([imoveisApi.buscar(id!), imoveisApi.listarFotos(id!), imoveisApi.listarComodos(id!)])
      .then(([im, ft, co]) => {
        const d = im.data;
        setForm({ titulo:d.titulo||'', descricao:d.descricao||'', observacao:d.observacao||'',
          bairro:d.bairro||'', cidade:d.cidade||'', preco:d.preco!=null?String(d.preco):'',
          metragem:d.metragem!=null?String(d.metragem):'', quartos:d.quartos!=null?String(d.quartos):'',
          banheiros:d.banheiros!=null?String(d.banheiros):'', vagas:d.vagas!=null?String(d.vagas):'' });
        setFotos(ft.data);
        setComodos(co.data);
      }).finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setErro(''); setSucesso(''); setLoading(true);
    try {
      const payload = { ...form, preco:form.preco?parseFloat(form.preco):null, metragem:form.metragem?parseFloat(form.metragem):null,
        quartos:form.quartos?parseInt(form.quartos):0, banheiros:form.banheiros?parseInt(form.banheiros):0, vagas:form.vagas?parseInt(form.vagas):0 };
      if (isEdit) { await imoveisApi.atualizar(id!, payload); setSucesso('Imóvel atualizado!'); }
      else {
        const r = await imoveisApi.criar(payload);
        navigate(`/imoveis/${r.data.id}`);
      }
    } catch (err: unknown) { setErro((err as {response?:{data?:{erro?:string}}})?.response?.data?.erro||'Erro ao salvar.'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (fotos.length + files.length > 10) { setErro('Máximo 10 fotos por imóvel.'); return; }
    setUploadLoading(true); setErro('');
    try {
      await imoveisApi.uploadFotos(id!, files);
      await loadFotos();
    } catch (err: unknown) { setErro((err as {response?:{data?:{erro?:string}}})?.response?.data?.erro||'Erro ao enviar fotos.'); }
    finally { setUploadLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleExcluirFoto = async (fotoId: string) => {
    await imoveisApi.excluirFoto(id!, fotoId);
    await loadFotos();
  };

  const handleAddComodo = async () => {
    if (!novoComodo.trim()) return;
    await imoveisApi.criarComodo(id!, novoComodo.trim());
    setNovoComodo(''); await loadComodos();
  };

  const handleEditComodo = async () => {
    if (!editComodo) return;
    await imoveisApi.atualizarComodo(id!, editComodo.id, editComodo.nome);
    setEditComodo(null); await loadComodos();
  };

  const handleExcluirComodo = async (comodoId: string) => {
    await imoveisApi.excluirComodo(id!, comodoId);
    await loadComodos();
  };

  if (fetching) return <LoadingSpinner />;

  // Bloco de seção bloqueada para quando o imóvel ainda não foi salvo
  const BloqueioNovo = ({ icone, texto }: { icone: string; texto: string }) => (
    <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
      <p className="text-3xl mb-2">{icone}</p>
      <p className="text-slate-400 text-sm">{texto}</p>
      <p className="text-slate-300 text-xs mt-1">Preencha os dados e clique em <strong>Cadastrar Imóvel</strong>.</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title={isEdit ? 'Editar Imóvel' : 'Novo Imóvel'} action={<button onClick={() => navigate('/imoveis')} className="btn-secondary">← Voltar</button>} />

      {/* DADOS BÁSICOS */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5 mb-5">
        <h3 className="font-display font-semibold text-slate-800 text-sm">Dados do Imóvel</h3>
        <div><label className="label">Título *</label><input className="input" value={form.titulo} onChange={set('titulo')} required placeholder="Ex: Apartamento 3 quartos Centro" spellCheck={false} /></div>
        <div><label className="label">Descrição</label><textarea className="input resize-none h-20" value={form.descricao} onChange={set('descricao')} placeholder="Descrição geral do imóvel..." spellCheck={false} /></div>
        <div><label className="label">Observações internas <span className="normal-case text-slate-400 text-[10px]">(visível apenas para corretores)</span></label>
          <textarea className="input resize-none h-16" value={form.observacao} onChange={set('observacao')} placeholder="Ex: Proprietário aceita proposta, chave com porteiro..." spellCheck={false} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Bairro</label><input className="input" value={form.bairro} onChange={set('bairro')} placeholder="Centro" spellCheck={false} /></div>
          <div><label className="label">Cidade</label><input className="input" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" spellCheck={false} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Preço (R$)</label><input className="input" type="number" step="0.01" value={form.preco} onChange={set('preco')} placeholder="450000" /></div>
          <div><label className="label">Metragem (m²)</label><input className="input" type="number" step="0.01" value={form.metragem} onChange={set('metragem')} placeholder="85" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="label">Quartos</label><input className="input" type="number" min="0" value={form.quartos} onChange={set('quartos')} placeholder="3" /></div>
          <div><label className="label">Banheiros</label><input className="input" type="number" min="0" value={form.banheiros} onChange={set('banheiros')} placeholder="2" /></div>
          <div><label className="label">Vagas</label><input className="input" type="number" min="0" value={form.vagas} onChange={set('vagas')} placeholder="1" /></div>
        </div>
        {erro && <ErrorMsg message={erro} />}
        {sucesso && <SuccessMsg message={sucesso} />}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Imóvel'}</button>
          <button type="button" onClick={() => navigate('/imoveis')} className="btn-secondary">Cancelar</button>
        </div>
      </form>

      {/* FOTOS */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Fotos</h3>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `${fotos.length}/10 fotos · mínimo 1` : 'Adicione fotos após salvar o imóvel'}</p>
          </div>
          {isEdit && fotos.length < 10 && (
            <label className="btn-primary cursor-pointer text-xs py-2">
              {uploadLoading ? 'Enviando...' : '+ Adicionar Fotos'}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploadLoading} />
            </label>
          )}
        </div>

        {!isEdit ? (
          <BloqueioNovo icone="📷" texto="As fotos ficam disponíveis depois que o imóvel for salvo." />
        ) : fotos.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-sm">Nenhuma foto ainda.</p>
            <p className="text-slate-300 text-xs mt-1">Adicione pelo menos 1 foto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fotos.map((foto, idx) => (
              <div key={foto.id} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100">
                <img src={fotoUrl(foto.id)} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                {idx === 0 && <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Capa</span>}
                <button onClick={() => handleExcluirFoto(foto.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ITENS DE AVALIAÇÃO */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-slate-800 text-sm mb-1">Itens de Avaliação</h3>
        <p className="text-xs text-slate-400 mb-5">
          {isEdit ? 'Selecione o que o cliente irá avaliar neste imóvel.' : 'Configure os itens depois que o imóvel for salvo.'}
        </p>

        {!isEdit ? (
          <BloqueioNovo icone="📋" texto="Os itens de avaliação ficam disponíveis depois que o imóvel for salvo." />
        ) : (
          <>
            {/* Auto-gerar */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-brand-700 mb-3">⚡ Gerar automaticamente</p>
              <div className="flex flex-wrap gap-2">
                {parseInt(form.quartos) > 0 && (
                  <button type="button" onClick={async () => {
                    const n = parseInt(form.quartos);
                    for (let i = 1; i <= n; i++) {
                      const nome = n === 1 ? 'Quarto' : `Quarto ${i}`;
                      if (!comodos.find(c => c.nome === nome)) await imoveisApi.criarComodo(id!, nome);
                    }
                    await loadComodos();
                  }} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    🛏 {parseInt(form.quartos)} Quarto{parseInt(form.quartos) > 1 ? 's' : ''}
                  </button>
                )}
                {parseInt(form.banheiros) > 0 && (
                  <button type="button" onClick={async () => {
                    const n = parseInt(form.banheiros);
                    for (let i = 1; i <= n; i++) {
                      const nome = n === 1 ? 'Banheiro' : `Banheiro ${i}`;
                      if (!comodos.find(c => c.nome === nome)) await imoveisApi.criarComodo(id!, nome);
                    }
                    await loadComodos();
                  }} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    🚿 {parseInt(form.banheiros)} Banheiro{parseInt(form.banheiros) > 1 ? 's' : ''}
                  </button>
                )}
                {parseInt(form.vagas) > 0 && (
                  <button type="button" onClick={async () => {
                    const n = parseInt(form.vagas);
                    for (let i = 1; i <= n; i++) {
                      const nome = n === 1 ? 'Vaga de Garagem' : `Vaga de Garagem ${i}`;
                      if (!comodos.find(c => c.nome === nome)) await imoveisApi.criarComodo(id!, nome);
                    }
                    await loadComodos();
                  }} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    🚗 {parseInt(form.vagas)} Vaga{parseInt(form.vagas) > 1 ? 's' : ''}
                  </button>
                )}
                {(!parseInt(form.quartos) && !parseInt(form.banheiros) && !parseInt(form.vagas)) && (
                  <p className="text-xs text-brand-500 italic">Preencha quartos, banheiros e vagas nos dados do imóvel para gerar automaticamente.</p>
                )}
              </div>
            </div>

            {/* Sugestões por categoria */}
            {[
              { label: '🏠 Áreas Comuns', itens: ['Sala de Estar', 'Sala de Jantar', 'Cozinha', 'Copa', 'Área de Serviço', 'Lavanderia', 'Corredor'] },
              { label: '🌳 Áreas Externas', itens: ['Quintal', 'Varanda', 'Sacada', 'Jardim', 'Churrasqueira', 'Piscina', 'Área Gourmet'] },
              { label: '🔨 Estrutura & Acabamento', itens: ['Pintura', 'Piso', 'Elétrica', 'Hidráulica', 'Telhado / Laje', 'Iluminação', 'Janelas / Esquadrias'] },
              { label: '🏢 Outros', itens: ['Depósito', 'Academia', 'Salão de Festas', 'Portaria', 'Elevador', 'Área de Lazer'] },
            ].map(cat => (
              <div key={cat.label} className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">{cat.label}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.itens.map(item => {
                    const jaAdicionado = comodos.some(c => c.nome === item);
                    return (
                      <button key={item} type="button"
                        onClick={async () => {
                          if (!jaAdicionado) { await imoveisApi.criarComodo(id!, item); await loadComodos(); }
                        }}
                        disabled={jaAdicionado}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                          jaAdicionado
                            ? 'bg-green-50 border-green-300 text-green-600 cursor-default'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50'
                        }`}>
                        {jaAdicionado ? '✓ ' : '+ '}{item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Adicionar personalizado */}
            <div className="border-t border-slate-100 pt-4 mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">✏️ Item personalizado</p>
              <div className="flex gap-2">
                <input className="input flex-1" value={novoComodo} onChange={e => setNovoComodo(e.target.value)}
                  placeholder="Ex: Closet, Escritório, Mezanino..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddComodo())} />
                <button type="button" onClick={handleAddComodo} className="btn-primary text-xs py-2 whitespace-nowrap">+ Adicionar</button>
              </div>
            </div>

            {/* Lista dos itens selecionados */}
            {comodos.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">📋 Itens selecionados ({comodos.length})</p>
                <div className="space-y-1.5">
                  {comodos.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg">
                      {editComodo?.id === c.id ? (
                        <>
                          <input className="input flex-1 py-1.5 text-xs" value={editComodo.nome}
                            onChange={e => setEditComodo({ ...editComodo, nome: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleEditComodo()} />
                          <button type="button" onClick={handleEditComodo} className="text-green-600 text-xs font-medium">Salvar</button>
                          <button type="button" onClick={() => setEditComodo(null)} className="text-slate-400 text-xs">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                          <span className="text-sm text-slate-700 flex-1">{c.nome}</span>
                          <button type="button" onClick={() => setEditComodo({ id: c.id, nome: c.nome })} className="text-brand-600 hover:text-brand-800 text-xs font-medium">Editar</button>
                          <button type="button" onClick={() => handleExcluirComodo(c.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 text-sm">Nenhum item selecionado ainda.</p>
                <p className="text-slate-300 text-xs mt-1">Use as sugestões acima ou adicione um personalizado.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
