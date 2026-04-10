import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      await login(email.trim(), senha);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Credenciais inválidas.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-brand-950 to-surface-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30 mb-4">
            <span className="text-white text-2xl font-display font-bold">V</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">VisitRank</h1>
          <p className="text-slate-400 text-sm mt-1">Imobiliário Inteligente</p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-7 shadow-xl">
          <h2 className="font-display font-semibold text-white mb-5 text-base">Acesso ao sistema</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="••••••••" />
            </div>
            {erro && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{erro}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-60 active:scale-[0.98] mt-2">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">Demo: admin@demo.com / admin123</p>
      </div>
    </div>
  );
}
