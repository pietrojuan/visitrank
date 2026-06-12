import { Router, Request, Response } from 'express';
import multer from 'multer';
import { autenticar, apenasAdmin, apenasAdminOuModerador, autenticarCliente } from '../middlewares/auth';
import * as svc from '../services/index';
import * as fotos from '../services/fotos';
import * as comodos from '../services/comodos';
import * as clienteAuth from '../services/clienteAuth';
import * as corretorSvc from '../services/corretorClientes';
import { query } from '../database/db';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((e: Error) => res.status(400).json({ erro: e.message }));

const imobId  = (req: Request) => req.user!.imobiliariaId;
const userId  = (req: Request) => req.user!.userId;
const cliId   = (req: Request) => req.clienteUser!.clienteId;
const cliImob = (req: Request) => req.clienteUser!.imobiliariaId;

// ── PÚBLICO (sem autenticação) ────────────────────────────
r.get('/public/imobiliarias', wrap(async (_req, res) => {
  const result = await query('SELECT id, razao_social FROM imobiliaria ORDER BY razao_social', []);
  res.json(result.rows);
}));

// ── AUTH CORRETOR/ADMIN ───────────────────────────────────
r.post('/auth/login', wrap(async (req, res) => { res.json(await svc.login(req.body.email, req.body.senha)); }));
r.get('/auth/usuarios', autenticar, wrap(async (req, res) => { res.json(await svc.listarUsuarios(imobId(req))); }));
r.post('/auth/usuarios', autenticar, apenasAdmin, wrap(async (req, res) => { res.status(201).json(await svc.criarUsuario(imobId(req), req.body)); }));
r.delete('/auth/usuarios/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  res.json(await svc.excluirUsuario(imobId(req), userId(req), req.params.id, req.body.senha));
}));
r.put('/auth/senha', autenticar, wrap(async (req, res) => {
  res.json(await svc.trocarSenha(userId(req), req.body.senha_atual ?? null, req.body.senha_nova));
}));

// ── AUTH CLIENTE ──────────────────────────────────────────
r.post('/cliente/registrar', wrap(async (req, res) => {
  const { imobiliaria_id, nome, email, senha, telefone, aceite_termos } = req.body;
  if (!imobiliaria_id) throw new Error('Selecione a imobiliária.');
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  res.status(201).json(await clienteAuth.registrarCliente(imobiliaria_id, { nome, email, senha, telefone, aceite_termos }, ip));
}));
r.post('/cliente/primeiro-acesso', wrap(async (req, res) => {
  res.json(await clienteAuth.primeiroAcesso(req.body.email, req.body.cpf, req.body.senha));
}));
r.post('/cliente/login', wrap(async (req, res) => {
  res.json(await clienteAuth.loginCliente(req.body.email, req.body.senha));
}));

// ── PORTAL DO CLIENTE ─────────────────────────────────────
r.get('/cliente/todos-imoveis', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.todosImoveisCliente(cliId(req), cliImob(req)));
}));
r.get('/cliente/imoveis', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.imoveisDoCliente(cliId(req), cliImob(req)));
}));
r.get('/cliente/imoveis/:id', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.detalheImovelCliente(req.params.id, cliId(req)));
}));
r.post('/cliente/imoveis/:id/avaliar', autenticarCliente, wrap(async (req, res) => {
  const { interesse, comentario, avaliacoes, notas_fixas } = req.body;
  res.json(await clienteAuth.salvarAvaliacao(req.params.id, cliId(req), cliImob(req), interesse, comentario, avaliacoes || [], notas_fixas || {}));
}));
r.get('/cliente/minhas-avaliacoes', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.minhasAvaliacoes(cliId(req)));
}));
r.put('/cliente/perfil', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.atualizarPerfilCliente(cliId(req), req.body));
}));
r.put('/cliente/senha', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.trocarSenhaCliente(cliId(req), req.body.senha_atual, req.body.senha_nova));
}));

// ── AGENDAMENTO (CLIENTE) ─────────────────────────────────
r.get('/cliente/datas-disponiveis', autenticarCliente, wrap(async (req, res) => {
  const { imovel_id, mes } = req.query as { imovel_id: string; mes: string };
  if (!imovel_id || !mes) throw new Error('imovel_id e mes são obrigatórios');
  res.json(await clienteAuth.datasDisponiveisMes(cliImob(req), imovel_id, mes + '-01'));
}));
r.get('/cliente/imoveis-agenda', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.imoveisParaAgendar(cliImob(req)));
}));
r.get('/cliente/slots', autenticarCliente, wrap(async (req, res) => {
  const { data, imovel_id } = req.query as { data: string; imovel_id: string };
  if (!data || !imovel_id) throw new Error('data e imovel_id são obrigatórios');
  res.json(await svc.slotsDisponiveis(cliImob(req), data, imovel_id));
}));
r.post('/cliente/agendar', autenticarCliente, wrap(async (req, res) => {
  const { imovel_id, corretor_id, data_hora } = req.body;
  res.status(201).json(await clienteAuth.agendarVisitaCliente(cliImob(req), imovel_id, cliId(req), corretor_id, data_hora));
}));

// ── IMÓVEIS EXTERNOS (CLIENTE) ────────────────────────────
r.get('/cliente/visitas', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.minhasVisitas(cliId(req)));
}));
r.patch('/cliente/visitas/:id/cancelar', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.cancelarVisitaCliente(cliId(req), req.params.id));
}));

r.get('/cliente/externos', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.listarImoveisExternos(cliId(req)));
}));
r.post('/cliente/externos', autenticarCliente, wrap(async (req, res) => {
  res.status(201).json(await clienteAuth.criarImovelExterno(cliId(req), cliImob(req), req.body));
}));
r.put('/cliente/externos/:id', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.editarImovelExterno(cliId(req), req.params.id, req.body));
}));
r.delete('/cliente/externos/:id', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.excluirImovelExterno(cliId(req), req.params.id));
}));
r.post('/cliente/externos/:id/avaliar', autenticarCliente, wrap(async (req, res) => {
  res.json(await clienteAuth.avaliarImovelExterno(cliId(req), req.params.id, req.body));
}));

// ── IMÓVEIS ───────────────────────────────────────────────
r.get('/imoveis', autenticar, wrap(async (req, res) => { res.json(await svc.listarImoveis(imobId(req))); }));
r.get('/imoveis/:id', autenticar, wrap(async (req, res) => {
  const d = await svc.buscarImovel(imobId(req), req.params.id);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.post('/imoveis', autenticar, wrap(async (req, res) => { res.status(201).json(await svc.criarImovel(imobId(req), req.body)); }));
r.put('/imoveis/:id', autenticar, wrap(async (req, res) => {
  const d = await svc.atualizarImovel(imobId(req), req.params.id, req.body);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.delete('/imoveis/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  await svc.excluirImovel(imobId(req), req.params.id); res.json({ ok: true });
}));

// ── FOTOS ─────────────────────────────────────────────────
r.get('/imoveis/:id/fotos', wrap(async (req, res) => {
  res.json(await fotos.listarFotos(req.params.id));
}));
r.get('/fotos/:fotoId', wrap(async (req, res) => {
  const foto = await fotos.getFoto(req.params.fotoId);
  if (!foto) { res.status(404).end(); return; }
  res.setHeader('Content-Type', foto.mime_type);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(foto.dados);
}));
r.post('/imoveis/:id/fotos', autenticar, upload.array('fotos', 10), wrap(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) throw new Error('Nenhuma foto enviada');
  const dados = files.map(f => ({ dados: f.buffer, mime_type: f.mimetype }));
  await fotos.salvarFotos(req.params.id, dados);
  res.json({ ok: true, count: files.length });
}));
r.delete('/imoveis/:id/fotos/:fotoId', autenticar, wrap(async (req, res) => {
  await fotos.excluirFoto(req.params.id, req.params.fotoId);
  res.json({ ok: true });
}));
r.put('/imoveis/:id/fotos/ordem', autenticar, wrap(async (req, res) => {
  await fotos.reordenarFotos(req.params.id, req.body.ids);
  res.json({ ok: true });
}));

// ── CÔMODOS ───────────────────────────────────────────────
r.get('/imoveis/:id/comodos', autenticar, wrap(async (req, res) => {
  res.json(await comodos.listarComodos(req.params.id));
}));
r.post('/imoveis/:id/comodos', autenticar, wrap(async (req, res) => {
  res.status(201).json(await comodos.criarComodo(req.params.id, req.body.nome));
}));
r.put('/imoveis/:id/comodos/:comodoId', autenticar, wrap(async (req, res) => {
  const d = await comodos.atualizarComodo(req.params.id, req.params.comodoId, req.body.nome);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.delete('/imoveis/:id/comodos/:comodoId', autenticar, wrap(async (req, res) => {
  await comodos.excluirComodo(req.params.id, req.params.comodoId);
  res.json({ ok: true });
}));

// ── CLIENTES ──────────────────────────────────────────────
r.get('/clientes', autenticar, wrap(async (req, res) => { res.json(await svc.listarClientes(imobId(req))); }));
r.get('/clientes/:id', autenticar, wrap(async (req, res) => {
  const d = await svc.buscarCliente(imobId(req), req.params.id);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.post('/clientes', autenticar, wrap(async (req, res) => {
  res.status(201).json(await svc.criarCliente(imobId(req), req.body));
}));
r.put('/clientes/:id', autenticar, wrap(async (req, res) => {
  const d = await svc.atualizarCliente(imobId(req), req.params.id, req.body);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.get('/clientes/:id/detalhes', autenticar, wrap(async (req, res) => {
  res.json(await svc.clienteDetalhes(imobId(req), req.params.id));
}));
r.delete('/clientes/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  await svc.excluirCliente(imobId(req), req.params.id); res.json({ ok: true });
}));

// ── DISPONIBILIDADE DO CORRETOR ───────────────────────────
r.get('/disponibilidade', autenticar, wrap(async (req, res) => {
  const corretorId = req.user!.perfil?.toLowerCase() === 'corretor' ? userId(req) : (req.query.corretor_id as string | undefined);
  res.json(await svc.listarDisponibilidade(imobId(req), corretorId));
}));
r.post('/disponibilidade', autenticar, wrap(async (req, res) => {
  const corretorId = req.user!.perfil?.toLowerCase() === 'corretor' ? userId(req) : req.body.corretor_id;
  res.status(201).json(await svc.criarDisponibilidade(imobId(req), corretorId, req.body));
}));
r.delete('/disponibilidade/:id', autenticar, wrap(async (req, res) => {
  res.json(await svc.excluirDisponibilidade(imobId(req), req.params.id));
}));

// ── VISITAS ───────────────────────────────────────────────
r.get('/visitas', autenticar, wrap(async (req, res) => {
  const corretorId = req.user!.perfil?.toLowerCase() === 'corretor' ? userId(req) : undefined;
  res.json(await svc.listarVisitas(imobId(req), corretorId));
}));
r.post('/visitas', autenticar, wrap(async (req, res) => { res.status(201).json(await svc.agendarVisita(imobId(req), req.body)); }));
r.put('/visitas/:id/status', autenticar, wrap(async (req, res) => {
  const d = await svc.atualizarStatus(imobId(req), req.params.id, req.body.status);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.post('/visitas/:id/confirmar-avaliacao', autenticar, wrap(async (req, res) => {
  res.json(await svc.confirmarAvaliacao(imobId(req), req.params.id, !!req.body.confirmar));
}));
r.delete('/visitas/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  await svc.excluirVisita(imobId(req), req.params.id); res.json({ ok: true });
}));

// ── AVALIAÇÕES ────────────────────────────────────────────
r.get('/avaliacoes', autenticar, wrap(async (req, res) => { res.json(await svc.listarAvaliacoes(imobId(req))); }));
r.get('/avaliacoes/:id', autenticar, wrap(async (req, res) => {
  const d = await svc.buscarAvaliacao(imobId(req), req.params.id);
  d ? res.json(d) : res.status(404).json({ erro: 'Não encontrado' });
}));
r.delete('/avaliacoes/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  res.json(await svc.excluirAvaliacao(imobId(req), req.params.id));
}));

// ── MODERAÇÃO ─────────────────────────────────────────────
r.get('/moderacao/pendentes', autenticar, apenasAdminOuModerador, wrap(async (req, res) => {
  res.json(await svc.listarAvaliacoesPendentes(imobId(req)));
}));
r.put('/moderacao/:id', autenticar, apenasAdminOuModerador, wrap(async (req, res) => {
  const acao = req.body.acao as 'aprovada' | 'rejeitada';
  if (!['aprovada', 'rejeitada'].includes(acao)) throw new Error('Ação inválida');
  res.json(await svc.moderarAvaliacao(imobId(req), req.params.id, acao));
}));

// ── GESTÃO DE CORRETORES (admin) ──────────────────────────
// Lista corretores com seus clientes (admin muda corretor do cliente)
r.get('/admin/corretores', autenticar, apenasAdmin, wrap(async (req, res) => {
  const r2 = await query(
    `SELECT id, nome, email, telefone FROM usuario
     WHERE imobiliaria_id=$1 AND perfil='corretor' AND ativo=TRUE ORDER BY nome`,
    [imobId(req)]
  );
  res.json(r2.rows);
}));

// Muda o corretor responsável por um cliente
r.put('/admin/clientes/:clienteId/corretor', autenticar, apenasAdmin, wrap(async (req, res) => {
  const { corretor_id } = req.body;
  await query(
    `UPDATE cliente SET corretor_id=$1 WHERE id=$2 AND imobiliaria_id=$3`,
    [corretor_id, req.params.clienteId, imobId(req)]
  );
  // Atualiza também imovel_cliente existentes deste cliente para o novo corretor
  await query(
    `UPDATE imovel_cliente SET corretor_id=$1 WHERE cliente_id=$2`,
    [corretor_id, req.params.clienteId]
  );
  res.json({ ok: true });
}));

// Admin pode adicionar/excluir slots de qualquer corretor (mesmas rotas de disponibilidade)
// As rotas /disponibilidade já suportam admin sem filtro — rota extra para admin ver de um corretor específico
r.get('/admin/corretores/:corretorId/disponibilidade', autenticar, apenasAdmin, wrap(async (req, res) => {
  res.json(await svc.listarDisponibilidade(imobId(req), req.params.corretorId));
}));
r.post('/admin/corretores/:corretorId/disponibilidade', autenticar, apenasAdmin, wrap(async (req, res) => {
  res.status(201).json(await svc.criarDisponibilidade(imobId(req), req.params.corretorId, req.body));
}));
r.delete('/admin/disponibilidade/:id', autenticar, apenasAdmin, wrap(async (req, res) => {
  res.json(await svc.excluirDisponibilidade(imobId(req), req.params.id));
}));

// ── RANKING / DASHBOARD ───────────────────────────────────
r.get('/ranking', autenticar, wrap(async (req, res) => { res.json(await svc.getRanking(imobId(req))); }));
r.get('/dashboard', autenticar, wrap(async (req, res) => { res.json(await svc.getDashboard(imobId(req))); }));

export default r;
