import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteAuthApi, fotoUrl } from '../services/api';

interface ImovelAgenda {
  id: string; titulo: string; bairro?: string; cidade?: string;
  preco?: number; quartos?: number; banheiros?: number; metragem?: number;
  foto_ids: string[];
}

interface Slot {
  disponibilidade_id: string; corretor_id: string; corretor_nome: string;
  corretor_telefone?: string; hora_inicio: string; hora_fim: string;
}

const fmt = (v?: number) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
const fmtHora = (h: string) => h.slice(0, 5);

// Gera os próximos 30 dias a partir de hoje
const diasDisponiveis = () => {
  const dias = [];
  const hoje = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
};

const fmtDia = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return {
    dia: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    num: d.getDate(),
    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  };
};

export default function ClienteAgendarPage() {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState<ImovelAgenda[]>([]);
  const [imovelSel, setImovelSel] = useState<ImovelAgenda | null>(null);
  const [dataSel, setDataSel] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSel, setSlotSel] = useState<Slot | null>(null);
  const [corretorFiltro, setCorretorFiltro] = useState('');
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const dias = diasDisponiveis();

  useEffect(() => {
    clienteAuthApi.imoveisParaAgendar()
      .then(r => setImoveis(r.data))
      .finally(() => setLoadingImoveis(false));
  }, []);

  useEffect(() => {
    if (!imovelSel || !dataSel) { setSlots([]); return; }
    setLoadingSlots(true);
    setSlotSel(null);
    clienteAuthApi.slots(dataSel, imovelSel.id)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [imovelSel, dataSel]);

  const handleAgendar = async () => {
    if (!imovelSel || !dataSel || !slotSel) return;
    setAgendando(true); setErro('');
    try {
      const dataHora = `${dataSel}T${slotSel.hora_inicio}:00`;
      await clienteAuthApi.agendar({ imovel_id: imovelSel.id, corretor_id: slotSel.corretor_id, data_hora: dataHora });
      setSucesso(true);
    } catch (e: unknown) {
      setErro((e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao agendar.');
    } finally { setAgendando(false); }
  };

  const imovelFiltrado = imoveis.filter(im =>
    im.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    (im.bairro || '').toLowerCase().includes(busca.toLowerCase()) ||
    (im.cidade || '').toLowerCase().includes(busca.toLowerCase())
  );

  const corretores = [...new Set(slots.map(s => s.corretor_id))].map(id => ({
    id, nome: slots.find(s => s.corretor_id === id)!.corretor_nome,
  }));

  const slotsFiltrados = corretorFiltro ? slots.filter(s => s.corretor_id === corretorFiltro) : slots;

  if (sucesso) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-surface-950 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-5">✅</div>
        <h2 className="font-display font-bold text-white text-2xl mb-2">Visita agendada!</h2>
        <p className="text-slate-300 text-sm mb-2">
          <strong>{imovelSel?.titulo}</strong>
        </p>
        <p className="text-slate-400 text-sm mb-6">
          {new Date(dataSel + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {fmtHora(slotSel!.hora_inicio)} com {slotSel!.corretor_nome}
        </p>
        <button onClick={() => navigate('/cliente/imoveis')} className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm">
          Voltar ao início
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 pb-8">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/cliente/imoveis')} className="text-slate-400 hover:text-slate-700">←</button>
          <p className="font-display font-semibold text-slate-900 text-sm">Agendar Visita</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* STEP 1 — Escolher imóvel */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <p className="font-display font-semibold text-slate-900">Escolha o imóvel</p>
          </div>
          <input className="input w-full mb-3" placeholder="Buscar por nome, bairro ou cidade..." value={busca} onChange={e => setBusca(e.target.value)} />
          {loadingImoveis ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {imovelFiltrado.map(im => (
                <button key={im.id} onClick={() => { setImovelSel(im); setDataSel(''); setSlotSel(null); }}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${imovelSel?.id === im.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  {im.foto_ids?.length > 0 ? (
                    <img src={fotoUrl(im.foto_ids[0])} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shrink-0">🏠</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{im.titulo}</p>
                    <p className="text-xs text-slate-400">{[im.bairro, im.cidade].filter(Boolean).join(', ') || '—'}</p>
                    {im.preco && <p className="text-xs font-mono font-semibold text-brand-600 mt-0.5">{fmt(im.preco)}</p>}
                  </div>
                  {imovelSel?.id === im.id && <span className="ml-auto text-brand-600 shrink-0">✓</span>}
                </button>
              ))}
              {imovelFiltrado.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Nenhum imóvel encontrado.</p>}
            </div>
          )}
        </div>

        {/* STEP 2 — Escolher data */}
        {imovelSel && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <p className="font-display font-semibold text-slate-900">Escolha a data</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dias.map(d => {
                const { dia, num, mes } = fmtDia(d);
                return (
                  <button key={d} onClick={() => setDataSel(d)}
                    className={`shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border text-center min-w-[60px] transition-all ${dataSel === d ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <span className="text-[10px] uppercase font-medium opacity-70">{dia}</span>
                    <span className="text-lg font-bold leading-none my-0.5">{num}</span>
                    <span className="text-[10px] opacity-70">{mes}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — Escolher horário/corretor */}
        {imovelSel && dataSel && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <p className="font-display font-semibold text-slate-900">Escolha o horário</p>
            </div>

            {/* Filtro por corretor */}
            {corretores.length > 1 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                <button onClick={() => setCorretorFiltro('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!corretorFiltro ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Todos os corretores
                </button>
                {corretores.map(c => (
                  <button key={c.id} onClick={() => setCorretorFiltro(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${corretorFiltro === c.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {c.nome}
                  </button>
                ))}
              </div>
            )}

            {loadingSlots ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : slotsFiltrados.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
                <p className="text-3xl mb-2">😕</p>
                <p className="text-slate-500 text-sm">Nenhum horário disponível nesta data.</p>
                <p className="text-slate-400 text-xs mt-1">Tente outra data ou corretor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slotsFiltrados.map((s, i) => (
                  <button key={i} onClick={() => setSlotSel(s)}
                    className={`p-3 rounded-xl border text-left transition-all ${slotSel?.corretor_id === s.corretor_id && slotSel?.hora_inicio === s.hora_inicio ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <p className="font-semibold text-slate-800 text-sm">{fmtHora(s.hora_inicio)} – {fmtHora(s.hora_fim)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">🧑‍💼 {s.corretor_nome}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmar */}
        {slotSel && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-brand-900 mb-1">Resumo da visita</p>
            <p className="text-xs text-brand-700">📍 {imovelSel?.titulo}</p>
            <p className="text-xs text-brand-700">📅 {new Date(dataSel + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {fmtHora(slotSel.hora_inicio)}</p>
            <p className="text-xs text-brand-700">🧑‍💼 {slotSel.corretor_nome}</p>
            {erro && <p className="text-red-500 text-xs mt-2">{erro}</p>}
            <button onClick={handleAgendar} disabled={agendando}
              className="mt-3 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all disabled:opacity-50">
              {agendando ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
