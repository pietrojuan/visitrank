import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';

// Primeiro acesso: valida email + CPF e cria senha
export const primeiroAcesso = async (email: string, cpf: string, novaSenha: string) => {
  if (novaSenha.length < 6) throw new Error('Senha deve ter ao menos 6 caracteres');

  const cpfLimpo = cpf.replace(/\D/g, '');
  const cpfHash = require('crypto').createHash('sha256').update(cpfLimpo).digest('hex');

  const r = await query(
    `SELECT c.*, u.nome AS corretor_nome, u.telefone AS corretor_telefone
     FROM cliente c
     LEFT JOIN usuario u ON u.id = c.corretor_id
     WHERE LOWER(c.email)=$1 AND c.cpf_hash=$2 AND c.ativo=TRUE`,
    [email.toLowerCase().trim(), cpfHash]
  );
  if (!r.rows[0]) throw new Error('Email ou CPF não encontrado');

  const cliente = r.rows[0];
  if (!cliente.primeiro_acesso) throw new Error('Conta já ativada. Faça login normalmente.');

  const hash = await bcrypt.hash(novaSenha, 10);
  await query(
    `UPDATE cliente SET senha_hash=$1, primeiro_acesso=FALSE WHERE id=$2`,
    [hash, cliente.id]
  );

  return gerarTokenCliente(cliente);
};

// Login normal do cliente
export const loginCliente = async (email: string, senha: string) => {
  const r = await query(
    `SELECT c.*, i.razao_social,
            u.nome AS corretor_nome, u.telefone AS corretor_telefone
     FROM cliente c
     JOIN imobiliaria i ON i.id = c.imobiliaria_id
     LEFT JOIN usuario u ON u.id = c.corretor_id
     WHERE LOWER(c.email)=$1 AND c.ativo=TRUE`,
    [email.toLowerCase().trim()]
  );
  if (!r.rows[0]) throw new Error('Credenciais inválidas');

  const cliente = r.rows[0];
  if (cliente.primeiro_acesso || !cliente.senha_hash) throw new Error('Cadastro não ativado. Use o primeiro acesso.');

  const ok = await bcrypt.compare(senha, cliente.senha_hash);
  if (!ok) throw new Error('Credenciais inválidas');

  return gerarTokenCliente(cliente);
};

const gerarTokenCliente = (cliente: Record<string, unknown>) => {
  const token = jwt.sign(
    { clienteId: cliente.id, imobiliariaId: cliente.imobiliaria_id, tipo: 'cliente', email: cliente.email },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' } as jwt.SignOptions
  );
  const { senha_hash: _, cpf_hash: __, ...dados } = cliente;
  return { token, cliente: dados };
};

// Imóveis liberados para o cliente
export const imoveisDoCliente = async (clienteId: string, imobiliariaId: string) => {
  const r = await query(
    `SELECT i.*, ic.criado_em AS liberado_em,
       ARRAY(SELECT id FROM foto_imovel WHERE imovel_id=i.id ORDER BY ordem) AS foto_ids,
       (SELECT COUNT(*) FROM avaliacao_imovel WHERE imovel_id=i.id AND cliente_id=$1) > 0 AS ja_avaliado,
       u.nome AS corretor_nome, u.telefone AS corretor_telefone
     FROM imovel_cliente ic
     JOIN imovel i ON i.id = ic.imovel_id
     LEFT JOIN usuario u ON u.id = ic.corretor_id
     WHERE ic.cliente_id=$1 AND i.imobiliaria_id=$2 AND i.ativo=TRUE
     ORDER BY i.titulo`,
    [clienteId, imobiliariaId]
  );
  return r.rows;
};

// Detalhes do imóvel para avaliação
export const detalheImovelCliente = async (imovelId: string, clienteId: string) => {
  // Verifica acesso
  const acesso = await query(
    `SELECT 1 FROM imovel_cliente WHERE imovel_id=$1 AND cliente_id=$2`,
    [imovelId, clienteId]
  );
  if (!acesso.rows[0]) throw new Error('Acesso negado');

  const [imovel, comodos, avaliacao, notasComodo] = await Promise.all([
    query(`SELECT * FROM imovel WHERE id=$1`, [imovelId]),
    query(`SELECT * FROM comodo WHERE imovel_id=$1 ORDER BY ordem`, [imovelId]),
    query(`SELECT * FROM avaliacao_imovel WHERE imovel_id=$1 AND cliente_id=$2`, [imovelId, clienteId]),
    query(`SELECT ac.* FROM avaliacao_comodo ac JOIN comodo c ON c.id=ac.comodo_id WHERE c.imovel_id=$1 AND ac.cliente_id=$2`, [imovelId, clienteId]),
  ]);

  return {
    imovel: imovel.rows[0],
    comodos: comodos.rows,
    avaliacao_existente: avaliacao.rows[0] || null,
    avaliacoes_existentes: notasComodo.rows,
  };
};

// Salvar avaliação do cliente
export const salvarAvaliacao = async (
  imovelId: string,
  clienteId: string,
  imobiliariaId: string,
  interesse: string,
  comentario: string,
  avaliacoes: { comodo_id: string; nota: number; comentario?: string }[],
  notasFixas: Record<string, number> = {}
) => {
  const acesso = await query(
    `SELECT corretor_id FROM imovel_cliente WHERE imovel_id=$1 AND cliente_id=$2`,
    [imovelId, clienteId]
  );
  if (!acesso.rows[0]) throw new Error('Acesso negado');
  const corretorId = acesso.rows[0].corretor_id;

  // Salva ou atualiza avaliação
  await query(
    `INSERT INTO avaliacao_imovel
       (imovel_id, cliente_id, interesse, comentario, nota_localizacao, nota_preco, nota_estado, nota_tamanho, nota_conforto)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (imovel_id, cliente_id) DO UPDATE SET
       interesse=EXCLUDED.interesse, comentario=EXCLUDED.comentario,
       nota_localizacao=EXCLUDED.nota_localizacao, nota_preco=EXCLUDED.nota_preco,
       nota_estado=EXCLUDED.nota_estado, nota_tamanho=EXCLUDED.nota_tamanho, nota_conforto=EXCLUDED.nota_conforto`,
    [imovelId, clienteId, interesse, comentario || null,
     notasFixas.nota_localizacao || null, notasFixas.nota_preco || null,
     notasFixas.nota_estado || null, notasFixas.nota_tamanho || null, notasFixas.nota_conforto || null]
  );

  for (const av of avaliacoes) {
    await query(
      `INSERT INTO avaliacao_comodo (comodo_id, cliente_id, nota, comentario)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (comodo_id, cliente_id) DO UPDATE SET nota=EXCLUDED.nota, comentario=EXCLUDED.comentario`,
      [av.comodo_id, clienteId, av.nota, av.comentario || null]
    );
  }

  // Gerencia visita: busca a mais recente agendada ou em aberto para este imovel+cliente
  const visitaExistente = await query(
    `SELECT id, status, data_visita FROM visita
     WHERE imovel_id=$1 AND cliente_id=$2
     ORDER BY data_visita DESC LIMIT 1`,
    [imovelId, clienteId]
  );

  if (visitaExistente.rows[0]) {
    const visita = visitaExistente.rows[0];
    const dataVisita = new Date(visita.data_visita);
    const agora = new Date();

    if (visita.status === 'agendada' && dataVisita > agora) {
      // Avaliação enviada ANTES da data agendada — aguarda confirmação do corretor
      await query(
        `UPDATE visita SET status='aguardando' WHERE id=$1`,
        [visita.id]
      );
      return { ok: true, aguardando: true };
    } else {
      // Visita já passou ou já estava em outro estado: marca como realizada
      await query(
        `UPDATE visita SET status='realizada' WHERE id=$1 AND status != 'realizada'`,
        [visita.id]
      );
    }
  } else {
    // Sem visita: cria uma nova já como realizada com data = agora
    const token = require('crypto').randomBytes(32).toString('hex');
    await query(
      `INSERT INTO visita (imobiliaria_id, imovel_id, cliente_id, corretor_id, data_visita, qr_token, status)
       VALUES ($1,$2,$3,$4,NOW(),$5,'realizada')`,
      [imobiliariaId, imovelId, clienteId, corretorId, token]
    );
  }

  return { ok: true };
};

// Avaliações feitas pelo cliente
export const minhasAvaliacoes = async (clienteId: string) => {
  const r = await query(
    `SELECT ai.id, ai.interesse, ai.comentario, ai.criado_em,
            i.id AS imovel_id, i.titulo AS imovel_titulo, i.preco AS imovel_preco, i.bairro, i.cidade,
            ARRAY(SELECT id FROM foto_imovel WHERE imovel_id=i.id ORDER BY ordem LIMIT 1) AS foto_ids,
            COALESCE(ROUND(AVG(ac.nota)::numeric, 1), 0) AS media_itens,
            COUNT(ac.id)::int AS total_itens
     FROM avaliacao_imovel ai
     JOIN imovel i ON i.id = ai.imovel_id
     LEFT JOIN avaliacao_comodo ac ON ac.cliente_id = ai.cliente_id
       AND ac.comodo_id IN (SELECT id FROM comodo WHERE imovel_id = i.id)
     WHERE ai.cliente_id = $1
     GROUP BY ai.id, ai.interesse, ai.comentario, ai.criado_em, i.id, i.titulo, i.preco, i.bairro, i.cidade
     ORDER BY ai.criado_em DESC`,
    [clienteId]
  );
  return r.rows;
};
