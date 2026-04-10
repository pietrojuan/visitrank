import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imoveisApi, fotoUrl } from '../services/api';
import { Imovel } from '../types';
import { PageHeader, LoadingSpinner, EmptyState, Confirm } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const fmt = (v?: number | string) => v != null && v !== '' ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

interface ImovelComFotos extends Imovel { foto_ids?: string[]; }

export default function ImoveisPage() {
  const { isAdmin } = useAuth();
  const [imoveis, setImoveis] = useState<ImovelComFotos[]>([]);
  const [fotos, setFotos] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ quartos: '', banheiros: '', vagas: '' });

  const load = async () => {
    setLoading(true);
    const r = await imoveisApi.listar();
    setImoveis(r.data);
    // Carrega primeira foto de cada imóvel
    const fotoMap: Record<string, string[]> = {};
    await Promise.all(r.data.map(async (im: Imovel) => {
      const ft = await imoveisApi.listarFotos(im.id);
      fotoMap[im.id] = ft.data.map((f: { id: string }) => f.id);
    }));
    setFotos(fotoMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = imoveis.filter(i => {
    if (search && !i.titulo.toLowerCase().includes(search.toLowerCase()) &&
        !(i.bairro||'').toLowerCase().includes(search.toLowerCase()) &&
        !(i.cidade||'').toLowerCase().includes(search.toLowerCase())) return false;
    if (filtros.quartos   && Number(i.quartos)   < Number(filtros.quartos))   return false;
    if (filtros.banheiros && Number(i.banheiros) < Number(filtros.banheiros)) return false;
    if (filtros.vagas     && Number(i.vagas)     < Number(filtros.vagas))     return false;
    return true;
  });

  const temFiltro = filtros.quartos || filtros.banheiros || filtros.vagas;
  const setFiltro = (k: keyof typeof filtros) => (v: string) =>
    setFiltros(f => ({ ...f, [k]: f[k] === v ? '' : v }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Imóveis" subtitle={`${imoveis.length} cadastrados`} action={<Link to="/imoveis/novo" className="btn-primary">+ Novo Imóvel</Link>} />
      <div className="mb-5 space-y-3">
        <input className="input max-w-sm" placeholder="Buscar por título, bairro ou cidade..." value={search} onChange={e => setSearch(e.target.value)} />

        <div className="flex flex-wrap gap-4 items-center">
          {([
            { key: 'quartos',   icon: '🛏', label: 'Quartos'   },
            { key: 'banheiros', icon: '🚿', label: 'Banheiros' },
            { key: 'vagas',     icon: '🚗', label: 'Vagas'     },
          ] as const).map(({ key, icon, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{icon} {label}:</span>
              <div className="flex gap-1">
                {['1','2','3','4','5+'].map(v => (
                  <button key={v} onClick={() => setFiltro(key)(v)}
                    className={`w-8 h-7 rounded-lg text-xs font-semibold border transition-all ${
                      filtros[key] === v
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600'
                    }`}>{v}</button>
                ))}
              </div>
            </div>
          ))}
          {temFiltro && (
            <button onClick={() => setFiltros({ quartos: '', banheiros: '', vagas: '' })}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(im => {
            const fotoIds = fotos[im.id] || [];
            return (
              <div key={im.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                {/* Foto de capa */}
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {fotoIds.length > 0 ? (
                    <img src={fotoUrl(fotoIds[0])} alt={im.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🏠</div>
                  )}
                  {fotoIds.length > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {fotoIds.length} foto{fotoIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-slate-900 text-sm truncate">{im.titulo}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{[im.bairro, im.cidade].filter(Boolean).join(', ') || '—'}</p>
                    </div>
                    <p className="font-mono font-semibold text-brand-600 text-sm shrink-0 ml-2">{fmt(im.preco)}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[{ icon:'🛏', val:im.quartos, label:'Quartos' },{ icon:'🚿', val:im.banheiros, label:'Banh.' },{ icon:'🚗', val:im.vagas, label:'Vagas' }].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-lg p-1.5 text-center">
                        <p className="text-sm">{item.icon}</p>
                        <p className="text-xs font-mono font-semibold text-slate-700">{item.val ?? '—'}</p>
                        <p className="text-[10px] text-slate-400">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-50">
                    <Link to={`/imoveis/${im.id}/ver`} className="btn-secondary flex-1 justify-center text-xs py-2">Ver</Link>
                    <Link to={`/imoveis/${im.id}`} className="btn-secondary flex-1 justify-center text-xs py-2">Editar</Link>
                    {isAdmin && (
                      <button onClick={() => setConfirm(im.id)} className="btn-danger flex-1 justify-center text-xs py-2">Excluir</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Confirm open={!!confirm} title="Excluir Imóvel"
        message="Esta ação é permanente e irreversível. Todas as visitas, avaliações e fotos vinculadas a este imóvel serão apagadas do banco de dados."
        confirmLabel="Excluir tudo"
        onConfirm={async () => { if (confirm) { await imoveisApi.excluir(confirm); setConfirm(null); load(); } }}
        onCancel={() => setConfirm(null)} />
    </div>
  );
}
