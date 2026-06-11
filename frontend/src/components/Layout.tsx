import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ADMIN = [
  { to:'/',            label:'Dashboard',   icon:'▦', exact:true },
  { to:'/imoveis',     label:'Imóveis',     icon:'🏠' },
  { to:'/clientes',    label:'Clientes',    icon:'👥' },
  { to:'/visitas',     label:'Visitas',     icon:'📅' },
  { to:'/corretores',  label:'Corretores',  icon:'🧑‍💼' },
  { to:'/moderacao',   label:'Moderação',   icon:'🛡️' },
  { to:'/ranking',     label:'Ranking',     icon:'🏆' },
  { to:'/usuarios',    label:'Usuários',    icon:'🔑' },
];

const NAV_CORRETOR = [
  { to:'/',                label:'Dashboard',      icon:'▦', exact:true },
  { to:'/imoveis',         label:'Imóveis',        icon:'🏠' },
  { to:'/clientes',        label:'Clientes',       icon:'👥' },
  { to:'/visitas',         label:'Visitas',        icon:'📅' },
  { to:'/disponibilidade', label:'Disponibilidade',icon:'🗓️' },
  { to:'/ranking',         label:'Ranking',        icon:'🏆' },
];

const NAV_MODERADOR = [
  { to:'/',          label:'Dashboard', icon:'▦', exact:true },
  { to:'/moderacao', label:'Moderação', icon:'🛡️' },
];

export default function Layout() {
  const { usuario, logout, isAdmin, isModerador } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const navItems = isAdmin ? NAV_ADMIN : isModerador ? NAV_MODERADOR : NAV_CORRETOR;

  const Sidebar = () => (
    <>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-display font-bold text-sm">V</div>
        <div><p className="font-display font-bold text-slate-900 text-sm">VisitRank</p><p className="text-[10px] text-slate-400 truncate max-w-[130px]">{usuario?.razao_social}</p></div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className="w-5 text-center text-base">{item.icon}</span>{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-slate-100 space-y-1">
        <NavLink to="/trocar-senha" onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
          <span className="w-5 text-center">🔐</span> Trocar Senha
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-display font-bold shrink-0">{usuario?.nome[0]}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-700 truncate">{usuario?.nome}</p><p className="text-[10px] text-slate-400">{usuario?.perfil}</p></div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500 transition-colors text-sm" title="Sair">⏏</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-surface-50">
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-slate-100 shrink-0"><Sidebar /></aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-white border-r border-slate-100 z-50"><Sidebar /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setOpen(true)} className="text-slate-600 text-xl">☰</button>
          <span className="font-display font-bold text-slate-900 text-sm">VisitRank</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
