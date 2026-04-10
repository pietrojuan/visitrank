import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteAuthApi } from '../services/api';

type Modo = 'login' | 'primeiro';

export default function ClienteLoginPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConf, setSenhaConf] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setErro(''); setLoading(true);
    try {
      const r = await clienteAuthApi.login(email.trim(), senha);
      localStorage.setItem('vr_cli_token', r.data.token);
      localStorage.setItem('vr_cliente', JSON.stringify(r.data.cliente));
      navigate('/cliente/imoveis', { replace: true });
    } catch (err: unknown) { setErro((err as {response?:{data?:{erro?:string}}})?.response?.data?.erro || 'Credenciais inválidas.'); }
    finally { setLoading(false); }
  };

  const handlePrimeiroAcesso = async (e: FormEvent) => {
    e.preventDefault(); setErro(''); 
    if (senha !== senhaConf) { setErro('As senhas não conferem.'); return; }
    if (senha.length < 6) { setErro('Senha deve ter ao menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const r = await clienteAuthApi.primeiroAcesso({ email: email.trim(), cpf, senha });
      localStorage.setItem('vr_cli_token', r.data.token);
      localStorage.setItem('vr_cliente', JSON.stringify(r.data.cliente));
      navigate('/cliente/imoveis', { replace: true });
    } catch (err: unknown) { setErro((err as {response?:{data?:{erro?:string}}})?.response?.data?.erro || 'Erro ao ativar conta.'); }
    finally { setLoading(false); }
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
          <p className="text-slate-400 text-sm mt-1">Portal do Cliente</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-7 shadow-xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-6 gap-1">
            {(['login', 'primeiro'] as Modo[]).map(m => (
              <button key={m} onClick={() => { setModo(m); setErro(''); }}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${modo === m ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Entrar' : 'Primeiro Acesso'}
              </button>
            ))}
          </div>

          {modo === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="••••••••" />
              </div>
              {erro && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{erro}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-60 active:scale-[0.98]">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePrimeiroAcesso} className="space-y-4">
              <p className="text-slate-400 text-xs mb-2">Use o email e CPF cadastrados pela imobiliária para ativar sua conta.</p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">CPF</label>
                <input value={cpf} onChange={e => setCpf(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Nova Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">Confirmar Senha</label>
                <input type="password" value={senhaConf} onChange={e => setSenhaConf(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="••••••••" />
              </div>
              {erro && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{erro}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-60 active:scale-[0.98]">
                {loading ? 'Ativando...' : 'Ativar Conta'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-4">
          <a href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">← Acesso para corretores</a>
        </p>
      </div>
    </div>
  );
}
