import React, { useEffect, useState } from 'react';
import { disponibilidadeApi } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

interface Slot {
  id: string; recorrente: boolean; dia_semana?: number;
  data_especifica?: string; hora_inicio: string; hora_fim: string;
  corretor_nome?: string; corretor_id?: string;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const fmtHora = (h: string) => h.slice(0, 5);
const fmtData = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

export default function DisponibilidadePage() {
  const { isAdmin, perfil } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    recorrente: true, dia_semana: 1, data_especifica: '', hora_inicio: '09:00', hora_fim: '12:00',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    disponibilidadeApi.listar().then(r => setSlots(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSalvar = async () => {
    setErro('');
    if (!form.recorrente && !form.data_especifica) { setErro('Informe a data específica.'); return; }
    if (form.hora_inicio >= form.hora_fim) { setErro('Hora de início deve ser anterior à hora de fim.'); return; }
    setSalvando(true);
    try {
      await disponibilidadeApi.criar({
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
    await disponibilidadeApi.excluir(id);
    setDeleteId(null);
    load();
  };

  // Agrupa por corretor (para admin ver todos)
  const porCorretor = slots.reduce<Record<string, { nome: string; slots: Slot[] }>>((acc, s) => {
    const id = s.corretor_id || 'eu';
    if (!acc[id]) acc[id] = { nome: s.corretor_nome || 'Você', slots: [] };
    acc[id].slots.push(s);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Disponibilidade"
        subtitle="Gerencie seus horários disponíveis para visitas"
      />

      {/* Formulário de novo slot */}
      <div className="card p-5 mb-6">
        <h3 className="font-display font-semibold text-slate-800 mb-4">+ Novo Horário Disponível</h3>

        {/* Tipo: recorrente ou data específica */}
        <div className="flex gap-2 mb-4">
          {[{ v: true, l: '🔁 Recorrente (semanal)' }, { v: false, l: '📅 Data específica' }].map(({ v, l }) => (
            <button key={String(v)} onClick={() => setForm(f => ({ ...f, recorrente: v }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${form.recorrente === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {form.recorrente ? (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dia da semana</label>
              <select className="input w-full" value={form.dia_semana} onChange={e => setForm(f => ({ ...f, dia_semana: Number(e.target.value) }))}>
                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input type="date" className="input w-full" value={form.data_especifica}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(f => ({ ...f, data_especifica: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Início</label>
            <input type="time" className="input w-full" value={form.hora_inicio}
              onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fim</label>
            <input type="time" className="input w-full" value={form.hora_fim}
              onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
          </div>
        </div>

        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}

        <button onClick={handleSalvar} disabled={salvando}
          className="btn-primary disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Adicionar horário'}
        </button>
      </div>

      {/* Lista de slots */}
      {loading ? <LoadingSpinner /> : slots.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-500 text-sm">Nenhum horário cadastrado ainda.</p>
          <p className="text-slate-400 text-xs mt-1">Adicione seus horários disponíveis para que clientes possam agendar visitas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(porCorretor).map(([cId, grupo]) => (
            <div key={cId} className="card overflow-hidden">
              {isAdmin && (
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🧑‍💼 {grupo.nome}</p>
                </div>
              )}
              <div className="divide-y divide-slate-50">
                {grupo.slots.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${s.recorrente ? 'bg-brand-50 text-brand-600' : 'bg-purple-50 text-purple-600'}`}>
                        {s.recorrente ? '🔁' : '📅'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {s.recorrente ? DIAS[s.dia_semana!] : fmtData(s.data_especifica!)}
                        </p>
                        <p className="text-xs text-slate-400">{fmtHora(s.hora_inicio)} – {fmtHora(s.hora_fim)}</p>
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(s.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 text-sm">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-display font-bold text-slate-900 mb-2">Remover horário?</h3>
            <p className="text-sm text-slate-500 mb-5">Este horário deixará de aparecer para os clientes.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Cancelar</button>
              <button onClick={() => handleExcluir(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
