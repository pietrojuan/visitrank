import React, { useEffect, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { PageHeader, LoadingSpinner, EmptyState, ErrorMsg, SuccessMsg } from '../components/ui';

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

interface Usuario { id: string; nome: string; email: string; perfil: string; criado_em: string; }

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'Corretor', telefone: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const [deleteSenha, setDeleteSenha] = useState('');
  const [deleteErro, setDeleteErro] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); authApi.listarUsuarios().then(r => setUsuarios(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = (k: 'nome' | 'perfil') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setErro(''); setSucesso(''); setSaving(true);
    try {
      await authApi.criarUsuario(form);
      setSucesso('Usuário criado!'); setForm({ nome: '', email: '', perfil: 'Corretor', telefone: '' }); setShowForm(false); load();
    } catch (err: unknown) { setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao criar.'); }
    finally { setSaving(false); }
  };

  const openDelete = (u: Usuario) => { setDeleteTarget(u); setDeleteSenha(''); setDeleteErro(''); };
  const closeDelete = () => { setDeleteTarget(null); setDeleteSenha(''); setDeleteErro(''); };

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true); setDeleteErro('');
    try {
      await authApi.excluirUsuario(deleteTarget.id, deleteSenha);
      closeDelete();
      load();
    } catch (err: unknown) {
      setDeleteErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao excluir.');
    } finally { setDeleting(false); }
  };

  if (!isAdmin) return <div className="text-center py-20 text-slate-400 text-sm">Acesso restrito a administradores.</div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Usuários" subtitle="Gerenciar corretores e administradores"
        action={<button onClick={() => { setShowForm(s => !s); setErro(''); setSucesso(''); }} className="btn-primary">{showForm ? '✕ Cancelar' : '+ Novo Usuário'}</button>} />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 animate-fade-in space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nome *</label><input className="input" value={form.nome} onChange={set('nome')} required placeholder="Nome completo" /></div>
            <div><label className="label">Perfil *</label>
              <select className="input" value={form.perfil} onChange={set('perfil')}>
                <option value="Corretor">Corretor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>
          <div><label className="label">Email *</label>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))}
              required placeholder="email@imobiliaria.com" />
          </div>
          <div><label className="label">Telefone / WhatsApp</label>
            <input className="input" value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: maskPhone(e.target.value) }))}
              placeholder="(11) 99999-0000" inputMode="numeric" />
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
            <span className="text-base shrink-0">🔑</span>
            <p>Senha padrão: <strong>123456</strong>. O usuário será obrigado a criar uma senha própria no primeiro acesso.</p>
          </div>
          {erro && <ErrorMsg message={erro} />}
          {sucesso && <SuccessMsg message={sucesso} />}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Criando...' : 'Criar Usuário'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? <LoadingSpinner /> : usuarios.length === 0 ? <EmptyState /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Nome', 'Email', 'Perfil', 'Cadastro', ''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{u.nome}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${u.perfil === 'Administrador' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-600'}`}>{u.perfil}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openDelete(u)}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm" title="Excluir usuário">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={closeDelete}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleDelete}>
              <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">🗑️</div>
                <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Excluir Usuário</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Você está prestes a excluir <strong className="text-slate-700">{deleteTarget.nome}</strong>.<br />
                  Digite sua senha de administrador para confirmar.
                </p>
                <input
                  type="password"
                  className="input w-full text-center"
                  placeholder="Sua senha de administrador"
                  value={deleteSenha}
                  onChange={e => setDeleteSenha(e.target.value)}
                  autoFocus
                  required
                />
                {deleteErro && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full text-left">{deleteErro}</p>
                )}
              </div>
              <div className="flex border-t border-slate-100">
                <button type="button" onClick={closeDelete}
                  className="flex-1 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100">
                  Cancelar
                </button>
                <button type="submit" disabled={deleting || !deleteSenha}
                  className="flex-1 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
