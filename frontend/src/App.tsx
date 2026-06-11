import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ImoveisPage from './pages/ImoveisPage';
import ImovelFormPage from './pages/ImovelFormPage';
import ImovelViewPage from './pages/ImovelViewPage';
import ClientesPage from './pages/ClientesPage';
import ClienteFormPage from './pages/ClienteFormPage';
import VisitasPage from './pages/VisitasPage';
import AgendarVisitaPage from './pages/AgendarVisitaPage';
import RankingPage from './pages/RankingPage';
import UsuariosPage from './pages/UsuariosPage';
import AvaliacaoPage from './pages/AvaliacaoPage';
import TrocarSenhaPage from './pages/TrocarSenhaPage';
import DisponibilidadePage from './pages/DisponibilidadePage';
import ModeracaoPage from './pages/ModeracaoPage';
import CorretoresPage from './pages/CorretoresPage';
// Portal do cliente
import ClienteLoginPage from './pages/ClienteLoginPage';
import ClienteImoveisPage from './pages/ClienteImoveisPage';
import ClienteAvaliacaoPage from './pages/ClienteAvaliacaoPage';

// Guarda: requer login
const Guard = ({ children }: { children: React.ReactNode }) => {
  const { token, usuario } = useAuth();
  return token && usuario ? <>{children}</> : <Navigate to="/login" replace />;
};

// Guarda: se for primeiro acesso, força trocar senha antes de qualquer outra tela
const PrimeiroAcessoGuard = ({ children }: { children: React.ReactNode }) => {
  const { token, usuario } = useAuth();
  const location = useLocation();
  if (token && usuario?.primeiro_acesso && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  return <>{children}</>;
};

const ClienteGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('vr_cli_token');
  return token ? <>{children}</> : <Navigate to="/cliente/login" replace />;
};

const AppRoutes = () => {
  const { token, usuario } = useAuth();
  return (
    <Routes>
      {/* Avaliação pública via QR */}
      <Route path="/avaliar/:token" element={<AvaliacaoPage />} />

      {/* Portal do cliente */}
      <Route path="/cliente/login" element={<ClienteLoginPage />} />
      <Route path="/cliente/imoveis" element={<ClienteGuard><ClienteImoveisPage /></ClienteGuard>} />
      <Route path="/cliente/imoveis/:id" element={<ClienteGuard><ClienteAvaliacaoPage /></ClienteGuard>} />

      {/* Login unificado */}
      <Route path="/login" element={
        token && usuario
          ? <Navigate to="/" replace />
          : localStorage.getItem('vr_cli_token')
            ? <Navigate to="/cliente/imoveis" replace />
            : <LoginPage />
      } />

      {/* Trocar senha — fora do Layout, acessível mesmo no primeiro acesso */}
      <Route path="/trocar-senha" element={<Guard><TrocarSenhaPage /></Guard>} />

      {/* Painel interno */}
      <Route path="/" element={<Guard><PrimeiroAcessoGuard><Layout /></PrimeiroAcessoGuard></Guard>}>
        <Route index element={<DashboardPage />} />
        <Route path="imoveis" element={<ImoveisPage />} />
        <Route path="imoveis/novo" element={<ImovelFormPage />} />
        <Route path="imoveis/:id/ver" element={<ImovelViewPage />} />
        <Route path="imoveis/:id" element={<ImovelFormPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/novo" element={<ClienteFormPage />} />
        <Route path="clientes/:id" element={<ClienteFormPage />} />
        <Route path="visitas" element={<VisitasPage />} />
        <Route path="visitas/agendar" element={<AgendarVisitaPage />} />
        <Route path="disponibilidade" element={<DisponibilidadePage />} />
        <Route path="moderacao" element={<ModeracaoPage />} />
        <Route path="corretores" element={<CorretoresPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>;
}
