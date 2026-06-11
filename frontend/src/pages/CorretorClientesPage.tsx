import React, { useEffect, useState } from 'react';
import { corretorApi } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/ui';

interface ImovelSimples { id: string; titulo: string; }
interface ClienteComImoveis {
  id: string; nome: string; email: string; telefone: string;
  primeiro_acesso: boolean; imoveis_liberados: ImovelSimples[];
}

export default function CorretorClientesPage() {
  const [clientes, setClientes] = useState<ClienteComImoveis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const cl = await corretorApi.clientesComImoveis();
    setClientes(cl.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clientes & Imóveis" subtitle="Imóveis associados a cada cliente por visita agendada" />

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
                  <p className="font-medium text-slate-800 text-sm">{c.nome}</p>
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
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Imóveis vinculados a este cliente</p>

                  {c.imoveis_liberados.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhum imóvel vinculado. Agende uma visita para este cliente.</p>
                  ) : (
                    <div className="space-y-2">
                      {c.imoveis_liberados.map(im => (
                        <div key={im.id} className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-100">
                          <span className="text-sm text-slate-700">🏠 {im.titulo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
