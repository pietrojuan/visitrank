import axios from 'axios';

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

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

export const authApi = {
  login: (email: string, senha: string) => api.post('/auth/login', { email, senha }),
  listarUsuarios: () => api.get('/auth/usuarios'),
  criarUsuario: (d: object) => api.post('/auth/usuarios', d),
  excluirUsuario: (id: string, senha: string) => api.delete(`/auth/usuarios/${id}`, { data: { senha } }),
  trocarSenha: (senha_atual: string | null, senha_nova: string) => api.put('/auth/senha', { senha_atual, senha_nova }),
};

export const clienteAuthApi = {
  primeiroAcesso: (d: object) => api.post('/cliente/primeiro-acesso', d),
  login: (email: string, senha: string) => api.post('/cliente/login', { email, senha }),
  meusImoveis: () => { const t = localStorage.getItem('vr_cli_token'); return axios.get('/api/cliente/imoveis', { headers: { Authorization: `Bearer ${t}` } }); },
  detalheImovel: (id: string) => { const t = localStorage.getItem('vr_cli_token'); return axios.get(`/api/cliente/imoveis/${id}`, { headers: { Authorization: `Bearer ${t}` } }); },
  avaliar: (id: string, d: object) => { const t = localStorage.getItem('vr_cli_token'); return axios.post(`/api/cliente/imoveis/${id}/avaliar`, d, { headers: { Authorization: `Bearer ${t}` } }); },
  minhasAvaliacoes: () => { const t = localStorage.getItem('vr_cli_token'); return axios.get('/api/cliente/minhas-avaliacoes', { headers: { Authorization: `Bearer ${t}` } }); },
};

export const imoveisApi = {
  listar: () => api.get('/imoveis'),
  buscar: (id: string) => api.get(`/imoveis/${id}`),
  criar: (d: object) => api.post('/imoveis', d),
  atualizar: (id: string, d: object) => api.put(`/imoveis/${id}`, d),
  excluir: (id: string) => api.delete(`/imoveis/${id}`),
  // Fotos
  listarFotos: (id: string) => api.get(`/imoveis/${id}/fotos`),
  uploadFotos: (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('fotos', f));
    return api.post(`/imoveis/${id}/fotos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  excluirFoto: (imovelId: string, fotoId: string) => api.delete(`/imoveis/${imovelId}/fotos/${fotoId}`),
  // Cômodos
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
  getQrCode: (id: string) => api.get(`/visitas/${id}/qrcode`),
  atualizarStatus: (id: string, status: string) => api.put(`/visitas/${id}/status`, { status }),
  confirmarAvaliacao: (id: string, confirmar: boolean) => api.post(`/visitas/${id}/confirmar-avaliacao`, { confirmar }),
  excluir: (id: string) => api.delete(`/visitas/${id}`),
};

export const corretorApi = {
  clientesComImoveis: () => api.get('/corretor/clientes'),
  imoveisDisponiveis: () => api.get('/corretor/imoveis-disponiveis'),
  liberarImovel: (cliente_id: string, imovel_id: string) => api.post('/corretor/liberar', { cliente_id, imovel_id }),
  removerImovel: (cliente_id: string, imovel_id: string) => api.delete('/corretor/remover', { data: { cliente_id, imovel_id } }),
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

export const publicApi = {
  getVisita: (token: string) => axios.get(`/api/visitas/public/${token}`),
  avaliar: (token: string, d: object) => axios.post(`/api/visitas/public/${token}/avaliar`, d),
};

export const fotoUrl = (fotoId: string) => `/api/fotos/${fotoId}`;

export default api;
