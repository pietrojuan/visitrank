import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientesApi, authApi } from '../services/api';
import { PageHeader, LoadingSpinner, ErrorMsg, SuccessMsg } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

interface Corretor { id: string; nome: string; }

export default function ClienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { isAdmin, usuario } = useAuth();

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cpf: '', corretor_id: '' });
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (isAdmin) {
      authApi.listarUsuarios().then(r => {
        const lista = (r.data as Corretor[]).filter((u: any) => u.perfil === 'Corretor');
        setCorretores(lista);
        if (lista.length === 1) setForm(f => ({ ...f, corretor_id: lista[0].id }));
      });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isEdit) return;
    clientesApi.buscar(id!).then(r => {
      const d = r.data;
      setForm({ nome: d.nome||'', email: d.email||'', telefone: d.telefone||'', cpf: '', corretor_id: d.corretor_id||'' });
    }).finally(() => setFetching(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isAdmin && !isEdit && !form.corretor_id) { setErro('Selecione o corretor responsável.'); return; }
    setErro(''); setSucesso(''); setLoading(true);
    try {
      if (isEdit) { await clientesApi.atualizar(id!, form); setSucesso('Cliente atualizado!'); }
      else { await clientesApi.criar(form); setSucesso('Cliente cadastrado!'); setTimeout(() => navigate('/clientes'), 1000); }
    } catch (err: unknown) { setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao salvar.'); }
    finally { setLoading(false); }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in max-w-lg">
      <PageHeader title={isEdit ? 'Editar Cliente' : 'Novo Cliente'} action={<button onClick={() => navigate('/clientes')} className="btn-secondary">← Voltar</button>} />
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div><label className="label">Nome *</label>
          <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required placeholder="Nome completo" spellCheck={false} />
        </div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))}
            placeholder="email@exemplo.com" />
        </div>
        <div><label className="label">Telefone</label>
          <input className="input" value={form.telefone}
            onChange={e => setForm(f => ({ ...f, telefone: maskPhone(e.target.value) }))}
            placeholder="(11) 99999-0000" inputMode="numeric" />
        </div>
        {!isEdit && (
          <div><label className="label">CPF <span className="normal-case text-slate-400 text-[10px]">(armazenado com hash — LGPD)</span></label>
            <input className="input" value={form.cpf}
              onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))}
              placeholder="000.000.000-00" inputMode="numeric" />
          </div>
        )}
        {isAdmin && !isEdit && (
          <div>
            <label className="label">Corretor Responsável *</label>
            {corretores.length === 0 ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <span>⚠️</span>
                <p>Nenhum corretor cadastrado. Crie um corretor antes de adicionar clientes.</p>
              </div>
            ) : (
              <select className="input" value={form.corretor_id} onChange={e => setForm(f => ({ ...f, corretor_id: e.target.value }))} required>
                <option value="">Selecione um corretor...</option>
                {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
          </div>
        )}
        {erro && <ErrorMsg message={erro} />}
        {sucesso && <SuccessMsg message={sucesso} />}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || (isAdmin && !isEdit && corretores.length === 0)} className="btn-primary">
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
          </button>
          <button type="button" onClick={() => navigate('/clientes')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
