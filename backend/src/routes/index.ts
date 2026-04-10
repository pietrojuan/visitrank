import { Router, Request, Response } from 'express';
import multer from 'multer';
import { autenticar, apenasAdmin, autenticarCliente } from '../middlewares/auth';
import * as svc from '../services/index';
import * as fotos from '../services/fotos';
import * as comodos from '../services/comodos';
import * as clienteAuth from '../services/clienteAuth';
import * as corretorSvc from '../services/corretorClientes';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((e: Error) => res.status(400).json({ erro: e.message }));

const imobId  = (req: Request) => req.user!.imobiliariaId;
const userId  = (req: Request) => req.user!.userId;
const cliId   = (req: Request) => req.clienteUser!.clienteId;
const cliImob = (req: Request) => req.clienteUser!.imobiliariaId;

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
r.post('/cliente/primeiro-acesso', wrap(async (req, res) => {
  res.json(await clienteAuth.primeiroAcesso(req.body.email, req.body.cpf, req.body.senha));
}));
r.post('/cliente/login', wrap(async (req, res) => {
  res.json(await clienteAuth.loginCliente(req.body.email, req.body.senha));
}));

// ── PORTAL DO CLIENTE ─────────────────────────────────────
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
  const body = { ...req.body };
  // Se for corretor, o corretor_id é o próprio usuário
  if (req.user!.perfil === 'Corretor') body.corretor_id = userId(req);
  res.status(201).json(await svc.criarCliente(imobId(req), body));
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

// ── CORRETOR — GESTÃO DE CLIENTES/IMÓVEIS ────────────────
r.get('/corretor/clientes', autenticar, wrap(async (req, res) => {
  res.json(await corretorSvc.clientesComImoveis(imobId(req)));
}));
r.get('/corretor/imoveis-disponiveis', autenticar, wrap(async (req, res) => {
  res.json(await corretorSvc.imoveisDisponiveis(imobId(req)));
}));
r.post('/corretor/liberar', autenticar, wrap(async (req, res) => {
  const { cliente_id, imovel_id } = req.body;
  res.json(await corretorSvc.liberarImovel(imobId(req), userId(req), cliente_id, imovel_id));
}));
r.delete('/corretor/remover', autenticar, wrap(async (req, res) => {
  const { cliente_id, imovel_id } = req.body;
  res.json(await corretorSvc.removerImovel(cliente_id, imovel_id));
}));

// ── AVALIAÇÃO PÚBLICA (via QR token) ─────────────────────
r.get('/visitas/public/:token', wrap(async (req, res) => {
  const v = await svc.buscarVisitaPorToken(req.params.token);
  if (!v) { res.status(404).json({ erro: 'Visita não encontrada' }); return; }
  const cs = await comodos.listarComodos(v.imovel_id);
  res.json({ imovel_titulo: v.imovel_titulo, comodos: cs });
}));
r.post('/visitas/public/:token/avaliar', wrap(async (req, res) => {
  res.json(await svc.criarAvaliacao(req.params.token, req.body));
}));

// ── VISITAS ───────────────────────────────────────────────
r.get('/visitas', autenticar, wrap(async (req, res) => { res.json(await svc.listarVisitas(imobId(req))); }));
r.post('/visitas', autenticar, wrap(async (req, res) => { res.status(201).json(await svc.agendarVisita(imobId(req), req.body)); }));
r.get('/visitas/:id/qrcode', autenticar, wrap(async (req, res) => { res.json({ qr_code_url: await svc.getQrCode(imobId(req), req.params.id) }); }));
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

// ── RANKING / DASHBOARD ───────────────────────────────────
r.get('/ranking', autenticar, wrap(async (req, res) => { res.json(await svc.getRanking(imobId(req))); }));
r.get('/dashboard', autenticar, wrap(async (req, res) => { res.json(await svc.getDashboard(imobId(req))); }));

export default r;
