import React, { useEffect, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { visitasApi, imoveisApi, clientesApi, authApi } from '../services/api';
import { Imovel, Cliente, Visita } from '../types';
import { PageHeader, ErrorMsg, LoadingSpinner } from '../components/ui';

const hoje = new Date().toISOString().split('T')[0];

const HORAS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 7; // 07:00 até 20:00
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` };
});

export default function AgendarVisitaPage() {
  const navigate = useNavigate();
  const [imoveis,   setImoveis]   = useState<Imovel[]>([]);
  const [clientes,  setClientes]  = useState<Cliente[]>([]);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [visitas,   setVisitas]   = useState<Visita[]>([]);
  const [fetching,  setFetching]  = useState(true);
  const [form, setForm] = useState({ imovel_id: '', cliente_id: '', corretor_id: '', data: '', hora: '' });
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState('');
  const [agendado,  setAgendado]  = useState(false);

  useEffect(() => {
    Promise.all([imoveisApi.listar(), clientesApi.listar(), authApi.listarUsuarios(), visitasApi.listar()])
      .then(([im, cl, us, vis]) => {
        setImoveis(im.data);
        setClientes(cl.data);
        setCorretores((us.data as { id: string; nome: string; perfil: string }[]).filter(u => u.perfil === 'corretor'));
        setVisitas(vis.data);
      })
      .finally(() => setFetching(false));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Verifica conflito: mesmo imóvel, mesma data e hora
  const conflito = form.imovel_id && form.data && form.hora
    ? visitas.find(v =>
        v.imovel_id === form.imovel_id &&
        v.status !== 'cancelada' &&
        new Date(v.data_visita).toISOString().slice(0, 13) === `${form.data}T${form.hora.slice(0, 2)}`
      )
    : null;

  // Datas que já têm visita neste imóvel (para feedback visual)
  const datasComVisita = new Set(
    visitas
      .filter(v => v.imovel_id === form.imovel_id && v.status !== 'cancelada')
      .map(v => new Date(v.data_visita).toISOString().slice(0, 10))
  );

  // Horas ocupadas na data selecionada neste imóvel
  const horasOcupadas = new Set(
    visitas
      .filter(v =>
        v.imovel_id === form.imovel_id &&
        v.status !== 'cancelada' &&
        new Date(v.data_visita).toISOString().slice(0, 10) === form.data
      )
      .map(v => `${String(new Date(v.data_visita).getHours()).padStart(2, '0')}:00`)
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setErro(''); setLoading(true);
    try {
      const data_visita = new Date(`${form.data}T${form.hora}:00`).toISOString();
      await visitasApi.agendar({ imovel_id: form.imovel_id, cliente_id: form.cliente_id, corretor_id: form.corretor_id, data_visita });
      setAgendado(true);
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao agendar.');
    } finally { setLoading(false); }
  };

  const handleNovaVisita = () => {
    setAgendado(false);
    setForm({ imovel_id: '', cliente_id: '', corretor_id: '', data: '', hora: '' });
    setErro('');
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in max-w-lg">
      <PageHeader title="Agendar Visita" subtitle="Registre uma visita para um cliente"
        action={<button onClick={() => navigate('/visitas')} className="btn-secondary">← Voltar</button>} />

      {!agendado && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Imóvel *</label>
            <select className="input" value={form.imovel_id} onChange={set('imovel_id')} required>
              <option value="">Selecione o imóvel</option>
              {imoveis.map(i => <option key={i.id} value={i.id}>{i.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.cliente_id} onChange={set('cliente_id')} required>
              <option value="">Selecione o cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Corretor *</label>
            <select className="input" value={form.corretor_id} onChange={set('corretor_id')} required>
              <option value="">Selecione o corretor</option>
              {corretores.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>

          {/* Data e Hora separados */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data *</label>
              <input className={`input ${form.imovel_id && datasComVisita.has(form.data) ? 'border-red-300 bg-red-50' : ''}`}
                type="date" value={form.data} min={hoje} onChange={set('data')} required />
              {form.imovel_id && form.data && datasComVisita.has(form.data) && (
                <p className="text-[11px] text-red-500 mt-1">⚠ Já há visita nesta data</p>
              )}
            </div>
            <div>
              <label className="label">Hora *</label>
              <select className={`input ${horasOcupadas.has(form.hora) ? 'border-red-300 bg-red-50 text-red-600' : ''}`}
                value={form.hora} onChange={set('hora')} required>
                <option value="">Selecione</option>
                {HORAS.map(h => (
                  <option key={h.value} value={h.value}
                    style={horasOcupadas.has(h.value) ? { color: '#dc2626', fontWeight: 600 } : {}}>
                    {h.label}{horasOcupadas.has(h.value) ? ' ⚠ Ocupado' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Aviso de conflito */}
          {conflito && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <p className="font-medium">Conflito de horário</p>
                <p className="text-xs mt-0.5">Já existe uma visita agendada para este imóvel nessa data e hora (cliente: {conflito.cliente_nome}).</p>
              </div>
            </div>
          )}

          {erro && <ErrorMsg message={erro} />}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !!conflito} className="btn-primary">
              {loading ? 'Agendando...' : 'Agendar Visita'}
            </button>
            <button type="button" onClick={() => navigate('/visitas')} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Popup pós-agendamento */}
      {agendado && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden">
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-2xl mb-4">✅</div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Visita agendada!</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                A visita foi registrada com sucesso.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={handleNovaVisita}
                className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
                Agendar outra visita
              </button>
              <button onClick={() => navigate('/visitas')}
                className="flex-1 py-3.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
                Ver visitas
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
