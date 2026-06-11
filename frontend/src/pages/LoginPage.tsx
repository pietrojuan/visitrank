import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { clienteAuthApi, publicApi } from '../services/api';

type Modo = 'login' | 'registro';
interface Imobiliaria { id: string; razao_social: string; }

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('login');

  // Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Registro (cliente)
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regSenhaConf, setRegSenhaConf] = useState('');
  const [regImobId, setRegImobId] = useState('');
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [regAceite, setRegAceite] = useState(false);

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicApi.imobiliarias().then(r => {
      const lista: Imobiliaria[] = r.data;
      setImobiliarias(lista);
      if (lista.length === 1) setRegImobId(lista[0].id);
    }).catch(() => {});
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      // 1º tenta admin/corretor/moderador
      await login(email.trim(), senha);
      navigate('/', { replace: true });
    } catch {
      // 2º tenta cliente
      try {
        const r = await clienteAuthApi.login(email.trim(), senha);
        localStorage.setItem('vr_cli_token', r.data.token);
        localStorage.setItem('vr_cliente', JSON.stringify(r.data.cliente));
        navigate('/cliente/imoveis', { replace: true });
      } catch {
        setErro('Email ou senha incorretos.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegistro = async (e: FormEvent) => {
    e.preventDefault(); setErro('');
    if (regSenha !== regSenhaConf) { setErro('As senhas não conferem.'); return; }
    if (regSenha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return; }
    if (!regImobId) { setErro('Selecione a imobiliária.'); return; }
    if (!regAceite) { setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.'); return; }
    setLoading(true);
    try {
      const r = await clienteAuthApi.registrar({
        imobiliaria_id: regImobId,
        nome: regNome.trim(),
        email: regEmail.trim(),
        senha: regSenha,
        telefone: regTelefone || undefined,
        aceite_termos: true,
      });
      localStorage.setItem('vr_cli_token', r.data.token);
      localStorage.setItem('vr_cliente', JSON.stringify(r.data.cliente));
      navigate('/cliente/imoveis', { replace: true });
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao criar conta.');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-brand-950 to-surface-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30 mb-4">
            <span className="text-white text-2xl font-display font-bold">V</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">VisitRank</h1>
          <p className="text-slate-400 text-sm mt-1">Imobiliário Inteligente</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-7 shadow-xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-6 gap-1">
            {(['login', 'registro'] as Modo[]).map(m => (
              <button key={m} onClick={() => { setModo(m); setErro(''); }}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${modo === m ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {modo === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={inputCls} placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div>
                <label className={labelCls}>Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                  className={inputCls} placeholder="••••••••" autoComplete="current-password" />
              </div>
              {erro && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  {erro}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-60 active:scale-[0.98] mt-2">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <p className="text-center text-slate-500 text-xs pt-1">
                Funciona para clientes, corretores e admins.
              </p>
              <p className="text-center text-slate-600 text-[11px] leading-relaxed">
                Ao entrar, você concorda com os nossos{' '}
                <Link to="/termos" className="text-brand-400 hover:underline">Termos de Uso</Link>
                {' '}e{' '}
                <Link to="/privacidade" className="text-brand-400 hover:underline">Política de Privacidade</Link>.
              </p>
            </form>
          )}

          {/* ── REGISTRO (apenas clientes) ── */}
          {modo === 'registro' && (
            <form onSubmit={handleRegistro} className="space-y-4">
              {imobiliarias.length > 1 && (
                <div>
                  <label className={labelCls}>Imobiliária *</label>
                  <select value={regImobId} onChange={e => setRegImobId(e.target.value)} required
                    className={inputCls + ' bg-white/10'}>
                    <option value="" className="bg-slate-900">Selecione...</option>
                    {imobiliarias.map(i => (
                      <option key={i.id} value={i.id} className="bg-slate-900">{i.razao_social}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelCls}>Nome completo *</label>
                <input value={regNome} onChange={e => setRegNome(e.target.value)} required
                  className={inputCls} placeholder="Seu nome" spellCheck={false} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                  className={inputCls} placeholder="seu@email.com" />
              </div>
              <div>
                <label className={labelCls}>Telefone <span className="normal-case text-slate-500">(opcional)</span></label>
                <input value={regTelefone} onChange={e => setRegTelefone(e.target.value)}
                  className={inputCls} placeholder="(11) 99999-0000" inputMode="tel" />
              </div>
              <div>
                <label className={labelCls}>Senha *</label>
                <input type="password" value={regSenha} onChange={e => setRegSenha(e.target.value)} required minLength={6}
                  className={inputCls} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className={labelCls}>Confirmar Senha *</label>
                <input type="password" value={regSenhaConf} onChange={e => setRegSenhaConf(e.target.value)} required
                  className={inputCls} placeholder="••••••••" />
              </div>
              {/* Checkbox de consentimento LGPD */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={regAceite}
                    onChange={e => setRegAceite(e.target.checked)}
                    className="sr-only"
                  />
                  <div onClick={() => setRegAceite(v => !v)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${regAceite ? 'bg-brand-600 border-brand-600' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                    {regAceite && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Li e aceito os{' '}
                  <Link to="/termos" target="_blank" className="text-brand-400 hover:underline font-medium">Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link to="/privacidade" target="_blank" className="text-brand-400 hover:underline font-medium">Política de Privacidade</Link>
                  , incluindo o tratamento dos meus dados pessoais conforme a LGPD (Lei nº 13.709/2018). <span className="text-red-400">*</span>
                </span>
              </label>
              {erro && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  {erro}
                </div>
              )}
              <button type="submit" disabled={loading || !regAceite}
                className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all shadow-lg disabled:opacity-60 active:scale-[0.98]">
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
              <p className="text-center text-slate-500 text-xs pt-1">
                O cadastro é apenas para clientes.<br />Corretores e admins são criados pelo administrador.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
