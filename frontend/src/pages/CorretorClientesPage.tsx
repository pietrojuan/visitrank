import React, { useEffect, useState } from 'react';
import { corretorApi } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState, ErrorMsg, Confirm } from '../components/ui';

interface ImovelSimples { id: string; titulo: string; }
interface ClienteComImoveis {
  id: string; nome: string; email: string; telefone: string;
  primeiro_acesso: boolean; imoveis_liberados: ImovelSimples[];
}

export default function CorretorClientesPage() {
  const [clientes, setClientes] = useState<ClienteComImoveis[]>([]);
  const [imoveis, setImoveis] = useState<ImovelSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<Record<string, string>>({});
  const [confirmRemover, setConfirmRemover] = useState<{ clienteId: string; imovelId: string; titulo: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [cl, im] = await Promise.all([corretorApi.clientesComImoveis(), corretorApi.imoveisDisponiveis()]);
    setClientes(cl.data);
    setImoveis(im.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleLiberar = async (clienteId: string) => {
    const imovelId = adicionando[clienteId];
    if (!imovelId) return;
    setErro('');
    try {
      await corretorApi.liberarImovel(clienteId, imovelId);
      setAdicionando(p => ({ ...p, [clienteId]: '' }));
      await load();
    } catch (err: unknown) { setErro((err as {response?:{data?:{erro?:string}}})?.response?.data?.erro || 'Erro ao liberar.'); }
  };

  const handleRemover = async () => {
    if (!confirmRemover) return;
    try {
      await corretorApi.removerImovel(confirmRemover.clienteId, confirmRemover.imovelId);
      setConfirmRemover(null);
      await load();
    } catch {
      setErro('Erro ao remover.');
      setConfirmRemover(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clientes & Imóveis" subtitle="Selecione quais imóveis cada cliente poderá avaliar" />
      {erro && <div className="mb-4"><ErrorMsg message={erro} /></div>}

      {clientes.length === 0 ? <EmptyState message="Nenhum cliente cadastrado." /> : (
        <div className="space-y-3">
          {clientes.map(c => (
            <div key={c.id} className="card overflow-hidden">
              {/* Header do cliente */}
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-display font-bold text-sm shrink-0">
                  {c.nome[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 text-sm">{c.nome}</p>
                  </div>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-brand-600">{c.imoveis_liberados.length} imóvel(is)</p>
                </div>
                <span className="text-slate-300 text-xs">{expandido === c.id ? '▲' : '▼'}</span>
              </div>

              {/* Detalhe expandido */}
              {expandido === c.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fade-in">
                  {/* Imóveis liberados */}
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Imóveis liberados para este cliente</p>

                  {c.imoveis_liberados.length === 0 ? (
                    <p className="text-sm text-slate-400 mb-3">Nenhum imóvel liberado ainda.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {c.imoveis_liberados.map(im => (
                        <div key={im.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                          <span className="text-sm text-slate-700">🏠 {im.titulo}</span>
                          <button
                            onClick={() => setConfirmRemover({ clienteId: c.id, imovelId: im.id, titulo: im.titulo })}
                            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors flex items-center gap-1">
                            🗑️ Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar imóvel */}
                  <div className="flex gap-2">
                    <select className="input flex-1 text-xs py-2"
                      value={adicionando[c.id] || ''}
                      onChange={e => setAdicionando(p => ({ ...p, [c.id]: e.target.value }))}>
                      <option value="">Selecionar imóvel para liberar...</option>
                      {imoveis
                        .filter(im => !c.imoveis_liberados.some(l => l.id === im.id))
                        .map(im => <option key={im.id} value={im.id}>{im.titulo}</option>)}
                    </select>
                    <button onClick={() => handleLiberar(c.id)} disabled={!adicionando[c.id]}
                      className="btn-primary text-xs py-2 whitespace-nowrap disabled:opacity-50">
                      + Liberar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Confirm
        open={!!confirmRemover}
        icon="🏠"
        title="Remover Imóvel"
        message={`Deseja retirar "${confirmRemover?.titulo}" do cliente? O cliente não poderá mais acessar este imóvel.`}
        confirmLabel="Remover"
        onConfirm={handleRemover}
        onCancel={() => setConfirmRemover(null)}
      />
    </div>
  );
}
