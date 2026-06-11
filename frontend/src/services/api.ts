import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vr_token') || localStorage.getItem('vr_cli_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    const isAuth = err.config?.url?.includes('/login') || err.config?.url?.includes('/primeiro-acesso');
    if (err.response?.status === 401 && !isAuth) {
      localStorage.removeItem('vr_token');
      localStorage.removeItem('vr_usuario');
      localStorage.removeItem('vr_cli_token');
      localStorage.removeItem('vr_cliente');
      window.dispatchEvent(new Event('vr:logout'));
    }
    return Promise.reject(err);
  }
);

const cliHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('vr_cli_token')}` });
const cliGet  = (path: string) => axios.get(`${BASE}${path}`,  { headers: cliHeader() });
const cliPost = (path: string, d?: object) => axios.post(`${BASE}${path}`, d, { headers: cliHeader() });
const cliPut  = (path: string, d?: object) => axios.put(`${BASE}${path}`,  d, { headers: cliHeader() });
const cliDel  = (path: string) => axios.delete(`${BASE}${path}`, { headers: cliHeader() });

export const authApi = {
  login: (email: string, senha: string) => api.post('/auth/login', { email, senha }),
  listarUsuarios: () => api.get('/auth/usuarios'),
  criarUsuario: (d: object) => api.post('/auth/usuarios', d),
  excluirUsuario: (id: string, senha: string) => api.delete(`/auth/usuarios/${id}`, { data: { senha } }),
  trocarSenha: (senha_atual: string | null, senha_nova: string) => api.put('/auth/senha', { senha_atual, senha_nova }),
};

export const clienteAuthApi = {
  registrar: (d: object) => api.post('/cliente/registrar', d),
  primeiroAcesso: (d: object) => api.post('/cliente/primeiro-acesso', d),
  login: (email: string, senha: string) => api.post('/cliente/login', { email, senha }),
  todosImoveis: () => cliGet('/cliente/todos-imoveis'),
  meusImoveis: () => cliGet('/cliente/imoveis'),
  detalheImovel: (id: string) => cliGet(`/cliente/imoveis/${id}`),
  avaliar: (id: string, d: object) => cliPost(`/cliente/imoveis/${id}/avaliar`, d),
  minhasAvaliacoes: () => cliGet('/cliente/minhas-avaliacoes'),
  atualizarPerfil: (d: object) => cliPut('/cliente/perfil', d),
  trocarSenha: (senha_atual: string, senha_nova: string) => cliPut('/cliente/senha', { senha_atual, senha_nova }),
  // Agendamento
  imoveisParaAgendar: () => cliGet('/cliente/imoveis-agenda'),
  datasDisponiveis: (imovel_id: string, mes: string) => cliGet(`/cliente/datas-disponiveis?imovel_id=${imovel_id}&mes=${mes}`),
  slots: (data: string, imovel_id: string) => cliGet(`/cliente/slots?data=${data}&imovel_id=${imovel_id}`),
  agendar: (d: object) => cliPost('/cliente/agendar', d),
  // Imóveis externos
  listarExternos: () => cliGet('/cliente/externos'),
  criarExterno: (d: object) => cliPost('/cliente/externos', d),
  editarExterno: (id: string, d: object) => cliPut(`/cliente/externos/${id}`, d),
  excluirExterno: (id: string) => cliDel(`/cliente/externos/${id}`),
  avaliarExterno: (id: string, d: object) => cliPost(`/cliente/externos/${id}/avaliar`, d),
};

export const imoveisApi = {
  listar: () => api.get('/imoveis'),
  buscar: (id: string) => api.get(`/imoveis/${id}`),
  criar: (d: object) => api.post('/imoveis', d),
  atualizar: (id: string, d: object) => api.put(`/imoveis/${id}`, d),
  excluir: (id: string) => api.delete(`/imoveis/${id}`),
  listarFotos: (id: string) => api.get(`/imoveis/${id}/fotos`),
  uploadFotos: (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('fotos', f));
    return api.post(`/imoveis/${id}/fotos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  excluirFoto: (imovelId: string, fotoId: string) => api.delete(`/imoveis/${imovelId}/fotos/${fotoId}`),
  listarComodos: (id: string) => api.get(`/imoveis/${id}/comodos`),
  criarComodo: (id: string, nome: string) => api.post(`/imoveis/${id}/comodos`, { nome }),
  atualizarComodo: (id: string, comodoId: string, nome: string) => api.put(`/imoveis/${id}/comodos/${comodoId}`, { nome }),
  excluirComodo: (id: string, comodoId: string) => api.delete(`/imoveis/${id}/comodos/${comodoId}`),
};

export const clientesApi = {
  listar: () => api.get('/clientes'),
  buscar: (id: string) => api.get(`/clientes/${id}`),
  criar: (d: object) => api.post('/clientes', d),
  atualizar: (id: string, d: object) => api.put(`/clientes/${id}`, d),
  excluir: (id: string) => api.delete(`/clientes/${id}`),
  detalhes: (id: string) => api.get(`/clientes/${id}/detalhes`),
};

export const visitasApi = {
  listar: () => api.get('/visitas'),
  agendar: (d: object) => api.post('/visitas', d),
  atualizarStatus: (id: string, status: string) => api.put(`/visitas/${id}/status`, { status }),
  confirmarAvaliacao: (id: string, confirmar: boolean) => api.post(`/visitas/${id}/confirmar-avaliacao`, { confirmar }),
  excluir: (id: string) => api.delete(`/visitas/${id}`),
};

export const disponibilidadeApi = {
  listar: (corretor_id?: string) => api.get('/disponibilidade' + (corretor_id ? `?corretor_id=${corretor_id}` : '')),
  criar: (d: object) => api.post('/disponibilidade', d),
  excluir: (id: string) => api.delete(`/disponibilidade/${id}`),
};

export const moderacaoApi = {
  pendentes: () => api.get('/moderacao/pendentes'),
  moderar: (id: string, acao: 'aprovada' | 'rejeitada') => api.put(`/moderacao/${id}`, { acao }),
};

export const corretorApi = {
  clientesComImoveis: () => api.get('/corretor/clientes'),
};

export const adminApi = {
  listarCorretores: () => api.get('/admin/corretores'),
  mudarCorretorCliente: (clienteId: string, corretor_id: string) => api.put(`/admin/clientes/${clienteId}/corretor`, { corretor_id }),
  listarDisponibilidadeCorretor: (corretorId: string) => api.get(`/admin/corretores/${corretorId}/disponibilidade`),
  adicionarSlotCorretor: (corretorId: string, d: object) => api.post(`/admin/corretores/${corretorId}/disponibilidade`, d),
  excluirSlot: (id: string) => api.delete(`/admin/disponibilidade/${id}`),
};

export const publicApi = {
  getVisita: (token: string) => api.get(`/avaliar/${token}`),
  avaliar: (token: string, d: object) => api.post(`/avaliar/${token}`, d),
  imobiliarias: () => api.get('/public/imobiliarias'),
};

export const avaliacoesApi = {
  listar: () => api.get('/avaliacoes'),
  buscar: (id: string) => api.get(`/avaliacoes/${id}`),
  excluir: (id: string) => api.delete(`/avaliacoes/${id}`),
};

export const rankingApi = {
  getRanking: () => api.get('/ranking'),
  getDashboard: () => api.get('/dashboard'),
};

export const fotoUrl = (fotoId: string) => `/api/fotos/${fotoId}`;

export default api;
