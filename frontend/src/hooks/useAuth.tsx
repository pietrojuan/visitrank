import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Usuario } from '../types';
import { authApi } from '../services/api';

interface AuthCtx {
  token: string | null;
  usuario: Usuario | null;
  login: (e: string, s: string) => Promise<void>;
  logout: () => void;
  updateUsuario: (patch: Partial<Usuario>) => void;
  isAdmin: boolean;
  isModerador: boolean;
  perfil: string | null;
}
const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem('vr_token'));
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try { const r = localStorage.getItem('vr_usuario'); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('vr_token');
    localStorage.removeItem('vr_usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => { window.addEventListener('vr:logout', logout); return () => window.removeEventListener('vr:logout', logout); }, [logout]);

  const login = async (email: string, senha: string) => {
    const res = await authApi.login(email, senha);
    const { token: t, usuario: u } = res.data;
    localStorage.setItem('vr_token', t);
    localStorage.setItem('vr_usuario', JSON.stringify(u));
    setToken(t);
    setUsuario(u);
  };

  const updateUsuario = (patch: Partial<Usuario>) => {
    setUsuario(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('vr_usuario', JSON.stringify(updated));
      return updated;
    });
  };

  const perfil = usuario?.perfil ?? null;
  return (
    <Ctx.Provider value={{
      token, usuario, login, logout, updateUsuario,
      isAdmin: perfil === 'admin',
      isModerador: perfil === 'moderador',
      perfil,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('useAuth fora do AuthProvider'); return c; };
