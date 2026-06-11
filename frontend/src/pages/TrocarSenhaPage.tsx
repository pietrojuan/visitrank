import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function TrocarSenhaPage() {
  const { usuario, updateUsuario } = useAuth();
  const navigate = useNavigate();
  const primeiroAcesso = usuario?.primeiro_acesso === true;

  const [senhaAtual,  setSenhaAtual]  = useState('');
  const [senhaNova,   setSenhaNova]   = useState('');
  const [confirmar,   setConfirmar]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [erro,        setErro]        = useState('');
  const [sucesso,     setSucesso]     = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senhaNova.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (senhaNova !== confirmar) { setErro('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await authApi.trocarSenha(primeiroAcesso ? null : senhaAtual, senhaNova);
      updateUsuario({ primeiro_acesso: false });
      setSucesso(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { erro?: string } } })?.response?.data?.erro || 'Erro ao trocar senha.');
    } finally { setLoading(false); }
  };

  if (sucesso) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-4">✅</div>
        <p className="font-display font-bold text-slate-900 text-lg">Senha alterada com sucesso!</p>
        <p className="text-sm text-slate-500 mt-1">Redirecionando...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">🔐</div>
          <h1 className="font-display font-bold text-slate-900 text-xl">
            {primeiroAcesso ? 'Defina sua senha' : 'Trocar senha'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {primeiroAcesso
              ? 'Primeiro acesso detectado. Crie uma senha personalizada para continuar.'
              : 'Informe sua senha atual e escolha uma nova.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">

          {/* Senha atual — só aparece se não for primeiro acesso */}
          {!primeiroAcesso && (
            <div>
              <label className="label">Senha atual *</label>
              <input
                className="input"
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                required
                placeholder="Sua senha atual"
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="label">Nova senha *</label>
            <input
              className="input"
              type="password"
              value={senhaNova}
              onChange={e => setSenhaNova(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              autoFocus={primeiroAcesso}
            />
          </div>

          <div>
            <label className="label">Confirmar nova senha *</label>
            <input
              className="input"
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              placeholder="Repita a nova senha"
            />
          </div>

          {/* Indicador de força */}
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(n => (
                <div key={n} className={`flex-1 h-1 rounded-full transition-all ${
                  senhaNova.length > 0 && senhaNova.length >= n * 2
                    ? n <= 1 ? 'bg-red-400' : n <= 2 ? 'bg-yellow-400' : n <= 3 ? 'bg-blue-400' : 'bg-green-500'
                    : 'bg-slate-100'
                }`} />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 h-4">
              {senhaNova.length === 0 ? '' : senhaNova.length < 4 ? 'Muito fraca' : senhaNova.length < 6 ? 'Fraca' : senhaNova.length < 8 ? 'Razoável' : 'Forte'}
            </p>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{erro}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar senha'}
            </button>
            {!primeiroAcesso && (
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {primeiroAcesso && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Você está usando a senha padrão <strong>123456</strong>. Por segurança, crie uma senha única.
          </p>
        )}
      </div>
    </div>
  );
}
