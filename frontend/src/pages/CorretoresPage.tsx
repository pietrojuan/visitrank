import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui';

interface Corretor { id: string; nome: string; email: string; telefone?: string; }
interface Slot {
  id: string; recorrente: boolean; dia_semana?: number;
  data_especifica?: string; hora_inicio: string; hora_fim: string;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const fmtHora = (h: string) => h.slice(0, 5);
const fmtData = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

function ModalDisponibilidade({ corretor, onClose }: { corretor: Corretor; onClose: () => void }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    recorrente: true, dia_semana: 1, data_especifica: '', hora_inicio: '09:00', hora_fim: '12:00',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.listarDisponibilidadeCorretor(corretor.id)
      .then(r => setSlots(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [corretor.id]);

  const handleSalvar = async () => {
    setErro('');
    if (!form.recorrente && !form.data_especifica) { setErro('Informe a data específica.'); return; }
    if (form.hora_inicio >= form.hora_fim) { setErro('Início deve ser anterior ao fim.'); return; }
    setSalvando(true);
    try {
      await adminApi.adicionarSlotCorretor(corretor.id, {
        recorrente: form.recorrente,
        dia_semana: form.recorrente ? form.dia_semana : undefined,
        data_especifica: !form.recorrente ? form.data_especifica : undefined,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
      });
      load();
    } catch (e: unknown) {
      setErro((e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao salvar.');
    } finally { setSalvando(false); }
  };

  const handleExcluir = async (id: string) => {
    await adminApi.excluirSlot(id);
    load();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-display font-bold text-slate-900">🗓️ Disponibilidade</h3>
            <p className="text-xs text-slate-400 mt-0.5">{corretor.nome}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Formulário novo slot */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">+ Novo horário</p>
            <div className="flex gap-2">
              {[{ v: true, l: '🔁 Recorrente' }, { v: false, l: '📅 Data única' }].map(({ v, l }) => (
                <button key={String(v)} onClick={() => setForm(f => ({ ...f, recorrente: v }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.recorrente === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {form.recorrente ? (
                <div>
                  <label className="text-[10px] font-medium text-slate-500">Dia</label>
                  <select className="input w-full mt-0.5 text-xs" value={form.dia_semana}
                    onChange={e => setForm(f => ({ ...f, dia_semana: Number(e.target.value) }))}>
                    {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-medium text-slate-500">Data</label>
                  <input type="date" className="input w-full mt-0.5 text-xs" value={form.data_especifica}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm(f => ({ ...f, data_especifica: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-[10px] font-medium text-slate-500">Início</label>
                <input type="time" className="input w-full mt-0.5 text-xs" value={form.hora_inicio}
                  onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500">Fim</label>
                <input type="time" className="input w-full mt-0.5 text-xs" value={form.hora_fim}
                  onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
              </div>
            </div>
            {erro && <p className="text-red-500 text-xs">{erro}</p>}
            <button onClick={handleSalvar} disabled={salvando}
              className="w-full py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Adicionar horário'}
            </button>
          </div>

          {/* Lista de slots */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum horário cadastrado.</p>
          ) : (
            <div className="space-y-1.5">
              {slots.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${s.recorrente ? 'text-brand-500' : 'text-purple-500'}`}>
                      {s.recorrente ? '🔁' : '📅'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {s.recorrente ? DIAS[s.dia_semana!] : fmtData(s.data_especifica!)}
                      </p>
                      <p className="text-xs text-slate-400">{fmtHora(s.hora_inicio)} – {fmtHora(s.hora_fim)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleExcluir(s.id)}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm p-1">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CorretoresPage() {
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDisp, setModalDisp] = useState<Corretor | null>(null);

  useEffect(() => {
    adminApi.listarCorretores()
      .then(r => setCorretores(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Corretores"
        subtitle="Gerencie a disponibilidade de cada corretor"
      />

      {modalDisp && <ModalDisponibilidade corretor={modalDisp} onClose={() => setModalDisp(null)} />}

      {loading ? <LoadingSpinner /> : corretores.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🧑‍💼</p>
          <p className="text-slate-500 text-sm">Nenhum corretor cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {corretores.map(c => (
            <div key={c.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-display font-bold text-sm shrink-0">
                {c.nome[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{c.nome}</p>
                <p className="text-xs text-slate-400">{c.email}{c.telefone ? ` · ${c.telefone}` : ''}</p>
              </div>
              <button
                onClick={() => setModalDisp(c)}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
                🗓️ Horários
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
