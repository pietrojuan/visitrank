import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';

// Atualizar perfil do cliente
export const atualizarPerfilCliente = async (clienteId: string, d: { nome: string; telefone?: string }) => {
  if (!d.nome?.trim()) throw new Error('Informe o nome.');
  const r = await query(
    `UPDATE cliente SET nome=$1, telefone=$2 WHERE id=$3 AND ativo=TRUE
     RETURNING id, nome, email, telefone, imobiliaria_id, ativo, criado_em, primeiro_acesso`,
    [d.nome.trim(), d.telefone || null, clienteId]
  );
  if (!r.rows[0]) throw new Error('Cliente não encontrado.');
  return r.rows[0];
};

// Trocar senha do cliente
export const trocarSenhaCliente = async (clienteId: string, senhaAtual: string, senhaNova: string) => {
  if (senhaNova.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres.');
  const r = await query(`SELECT senha_hash FROM cliente WHERE id=$1 AND ativo=TRUE`, [clienteId]);
  if (!r.rows[0]) throw new Error('Cliente não encontrado.');
  if (!await bcrypt.compare(senhaAtual, r.rows[0].senha_hash)) throw new Error('Senha atual incorreta.');
  const hash = await bcrypt.hash(senhaNova, 10);
  await query(`UPDATE cliente SET senha_hash=$1 WHERE id=$2`, [hash, clienteId]);
  return { ok: true };
};

// Registro próprio do cliente
export const registrarCliente = async (imobId: string, d: { nome: string; email: string; senha: string; telefone?: string; aceite_termos?: boolean }, ip?: string) => {
  if (!d.nome?.trim()) throw new Error('Informe seu nome.');
  if (d.senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
  if (!d.aceite_termos) throw new Error('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
  const exists = await query(
    `SELECT id FROM cliente WHERE LOWER(email)=$1 AND imobiliaria_id=$2`,
    [d.email.toLowerCase().trim(), imobId]
  );
  if (exists.rows[0]) throw new Error('Este email já está cadastrado.');
  const hash = await bcrypt.hash(d.senha, 10);
  const r = await query(
    `INSERT INTO cliente (imobiliaria_id, nome, email, telefone, senha_hash, primeiro_acesso, ativo, aceite_termos_em, aceite_termos_ip)
     VALUES ($1,$2,$3,$4,$5,FALSE,TRUE,NOW(),$6) RETURNING *`,
    [imobId, d.nome.trim(), d.email.toLowerCase().trim(), d.telefone || null, hash, ip || null]
  );
  return gerarTokenCliente(r.rows[0]);
};

// Datas com disponibilidade em um mês (para colorir o calendário)
export const datasDisponiveisMes = async (imobiliariaId: string, imovelId: string, mesInicio: string) => {
  // mesInicio: 'YYYY-MM-01'
  const r = await query(`
    SELECT DISTINCT TO_CHAR(gs.day, 'YYYY-MM-DD') AS data
    FROM generate_series(
      GREATEST(CURRENT_DATE, $3::date),
      (DATE_TRUNC('month', $3::date) + INTERVAL '1 month - 1 day')::date,
      '1 day'::interval
    ) AS gs(day)
    WHERE EXISTS (
      SELECT 1 FROM disponibilidade d
      JOIN usuario u ON u.id = d.corretor_id AND u.ativo = TRUE
      WHERE d.imobiliaria_id = $1
        AND (
          (d.recorrente = TRUE AND d.dia_semana = EXTRACT(DOW FROM gs.day)::int)
          OR (d.recorrente = FALSE AND d.data_especifica = gs.day::date)
        )
        AND NOT EXISTS (
          SELECT 1 FROM visita v
          WHERE v.imobiliaria_id = $1
            AND v.imovel_id = $2
            AND DATE(v.data_visita) = gs.day::date
            AND v.corretor_id = d.corretor_id
            AND CAST(v.data_visita AS TIME) = d.hora_inicio::time
            AND v.status NOT IN ('cancelada')
        )
    )
    ORDER BY data
  `, [imobiliariaId, imovelId, mesInicio]);
  return r.rows.map((row: { data: string }) => row.data);
};

// Todos os imóveis da imobiliária, com flags por cliente
export const todosImoveisCliente = async (clienteId: string, imobiliariaId: string) => {
  const r = await query(
    `SELECT i.id, i.titulo, i.descricao, i.bairro, i.cidade, i.preco, i.metragem, i.quartos, i.banheiros, i.vagas,
            ARRAY(SELECT id FROM foto_imovel WHERE imovel_id=i.id ORDER BY ordem) AS foto_ids,
            EXISTS(SELECT 1 FROM avaliacao_imovel WHERE imovel_id=i.id AND cliente_id=$1) AS ja_avaliado,
            EXISTS(SELECT 1 FROM visita WHERE imovel_id=i.id AND cliente_id=$1 AND status != 'cancelada' AND data_visita <= NOW()) AS ja_liberado,
            EXISTS(SELECT 1 FROM visita WHERE imovel_id=i.id AND cliente_id=$1 AND status='agendada' AND data_visita > NOW()) AS tem_agendamento
     FROM imovel i
     WHERE i.imobiliaria_id=$2 AND i.ativo=TRUE
     ORDER BY
       CASE
         WHEN EXISTS(SELECT 1 FROM visita WHERE imovel_id=i.id AND cliente_id=$1 AND status != 'cancelada' AND data_visita <= NOW())
              AND NOT EXISTS(SELECT 1 FROM avaliacao_imovel WHERE imovel_id=i.id AND cliente_id=$1) THEN 1
         WHEN EXISTS(SELECT 1 FROM visita WHERE imovel_id=i.id AND cliente_id=$1 AND status='agendada' AND data_visita > NOW()) THEN 2
         WHEN EXISTS(SELECT 1 FROM avaliacao_imovel WHERE imovel_id=i.id AND cliente_id=$1) THEN 4
         ELSE 3
       END,
       i.titulo`,
    [clienteId, imobiliariaId]
  );
  return r.rows;
};

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
  // Verifica acesso: visita agendada e já passou a data/hora
  const acesso = await query(
    `SELECT 1 FROM visita WHERE imovel_id=$1 AND cliente_id=$2 AND status != 'cancelada' AND data_visita <= NOW()`,
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
    `SELECT corretor_id FROM visita WHERE imovel_id=$1 AND cliente_id=$2 AND status != 'cancelada' AND data_visita <= NOW() ORDER BY data_visita DESC LIMIT 1`,
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

  // Atualiza visita mais recente para realizada (se ainda agendada)
  const visitaExistente = await query(
    `SELECT id, status FROM visita
     WHERE imovel_id=$1 AND cliente_id=$2
     ORDER BY data_visita DESC LIMIT 1`,
    [imovelId, clienteId]
  );

  if (visitaExistente.rows[0]) {
    await query(
      `UPDATE visita SET status='realizada' WHERE id=$1 AND status != 'realizada'`,
      [visitaExistente.rows[0].id]
    );
  } else {
    // Sem visita agendada: cria uma já como realizada
    const token = require('crypto').randomBytes(32).toString('hex');
    await query(
      `INSERT INTO visita (imobiliaria_id, imovel_id, cliente_id, corretor_id, data_visita, qr_token, status)
       VALUES ($1,$2,$3,$4,NOW(),$5,'realizada')`,
      [imobiliariaId, imovelId, clienteId, corretorId, token]
    );
  }

  return { ok: true };
};

// Imóveis da imobiliária disponíveis para o cliente agendar visita
export const imoveisParaAgendar = async (imobiliariaId: string) => {
  const r = await query(
    `SELECT i.id, i.titulo, i.bairro, i.cidade, i.preco, i.metragem, i.quartos, i.banheiros, i.vagas,
            ARRAY(SELECT id FROM foto_imovel WHERE imovel_id=i.id ORDER BY ordem LIMIT 1) AS foto_ids
     FROM imovel i WHERE i.imobiliaria_id=$1 AND i.ativo=TRUE ORDER BY i.titulo`,
    [imobiliariaId]
  );
  return r.rows;
};

// Agendamento de visita pelo cliente
export const agendarVisitaCliente = async (
  imobiliariaId: string, imovelId: string, clienteId: string,
  corretorId: string, dataHora: string
) => {
  // Verifica conflito: slot já ocupado
  const conflito = await query(
    `SELECT id FROM visita
     WHERE imovel_id=$1 AND corretor_id=$2 AND DATE(data_visita)=DATE($3::timestamp)
       AND CAST(data_visita AS TIME) = CAST($3::timestamp AS TIME)
       AND status NOT IN ('cancelada')`,
    [imovelId, corretorId, dataHora]
  );
  if (conflito.rows[0]) throw new Error('Este horário já foi agendado por outro cliente.');

  // Verifica se corretor tem disponibilidade nesta data/hora
  const dt = new Date(dataHora);
  const diaSemana = dt.getDay();
  const hora = dt.toTimeString().slice(0, 5);
  const data = dataHora.slice(0, 10);
  const disp = await query(
    `SELECT id FROM disponibilidade
     WHERE corretor_id=$1 AND imobiliaria_id=$2
       AND hora_inicio <= $3::time AND hora_fim > $3::time
       AND (
         (recorrente=true AND dia_semana=$4)
         OR (recorrente=false AND data_especifica=$5::date)
       )`,
    [corretorId, imobiliariaId, hora, diaSemana, data]
  );
  if (!disp.rows[0]) throw new Error('Corretor sem disponibilidade neste horário.');

  // Libera imóvel para o cliente (imovel_cliente)
  await query(
    `INSERT INTO imovel_cliente (imovel_id, cliente_id, corretor_id)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [imovelId, clienteId, corretorId]
  );

  // Cria a visita
  const r = await query(
    `INSERT INTO visita (imobiliaria_id, imovel_id, cliente_id, corretor_id, data_visita, status)
     VALUES ($1,$2,$3,$4,$5,'agendada') RETURNING *`,
    [imobiliariaId, imovelId, clienteId, corretorId, dataHora]
  );
  return r.rows[0];
};

export const minhasVisitas = async (clienteId: string) => {
  const r = await query(
    `SELECT v.id, v.status, v.data_visita, v.criado_em,
            i.titulo, i.bairro, i.cidade, i.preco,
            u.nome AS corretor_nome, u.telefone AS corretor_telefone,
            (SELECT dados FROM foto_imovel WHERE imovel_id=i.id ORDER BY ordem LIMIT 1) AS foto
     FROM visita v
     JOIN imovel i ON i.id = v.imovel_id
     LEFT JOIN usuario u ON u.id = v.corretor_id
     WHERE v.cliente_id = $1
     ORDER BY v.data_visita DESC`,
    [clienteId]
  );
  return r.rows.map(row => ({
    ...row,
    foto: row.foto ? `data:image/jpeg;base64,${row.foto.toString('base64')}` : null,
  }));
};

export const cancelarVisitaCliente = async (clienteId: string, visitaId: string) => {
  const r = await query(
    `UPDATE visita SET status='cancelada'
     WHERE id=$1 AND cliente_id=$2 AND status='agendada' RETURNING id`,
    [visitaId, clienteId]
  );
  if (!r.rows[0]) throw new Error('Visita não encontrada ou não pode ser cancelada.');
  return { ok: true };
};

// Imóveis externos (cadastrados pelo próprio cliente)
export const listarImoveisExternos = async (clienteId: string) => {
  const r = await query(
    `SELECT ie.*, ae.interesse, ae.criado_em AS avaliado_em,
            COALESCE(ae.nota_localizacao,0)+COALESCE(ae.nota_preco,0)+COALESCE(ae.nota_estado,0)+
            COALESCE(ae.nota_tamanho,0)+COALESCE(ae.nota_conforto,0) AS soma_notas
     FROM imovel_externo ie
     LEFT JOIN avaliacao_externa ae ON ae.imovel_externo_id = ie.id
     WHERE ie.cliente_id=$1
     ORDER BY ie.criado_em DESC`,
    [clienteId]
  );
  return r.rows;
};

export const criarImovelExterno = async (clienteId: string, imobiliariaId: string, d: {
  titulo: string; endereco?: string; bairro?: string; cidade?: string;
  preco?: number; metragem?: number; quartos?: number; banheiros?: number; observacoes?: string;
}) => {
  const r = await query(
    `INSERT INTO imovel_externo (cliente_id, imobiliaria_id, titulo, endereco, bairro, cidade, preco, metragem, quartos, banheiros, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [clienteId, imobiliariaId, d.titulo, d.endereco||null, d.bairro||null, d.cidade||null,
     d.preco||null, d.metragem||null, d.quartos||null, d.banheiros||null, d.observacoes||null]
  );
  return r.rows[0];
};

export const editarImovelExterno = async (clienteId: string, id: string, d: Record<string, unknown>) => {
  const r = await query(
    `UPDATE imovel_externo SET titulo=$1, endereco=$2, bairro=$3, cidade=$4, preco=$5, metragem=$6,
     quartos=$7, banheiros=$8, observacoes=$9
     WHERE id=$10 AND cliente_id=$11 RETURNING *`,
    [d.titulo, d.endereco||null, d.bairro||null, d.cidade||null, d.preco||null,
     d.metragem||null, d.quartos||null, d.banheiros||null, d.observacoes||null, id, clienteId]
  );
  if (!r.rows[0]) throw new Error('Imóvel não encontrado');
  return r.rows[0];
};

export const excluirImovelExterno = async (clienteId: string, id: string) => {
  await query(`DELETE FROM imovel_externo WHERE id=$1 AND cliente_id=$2`, [id, clienteId]);
  return { ok: true };
};

export const avaliarImovelExterno = async (clienteId: string, imovelExternoId: string, d: {
  interesse: string; comentario?: string;
  nota_localizacao?: number; nota_preco?: number; nota_estado?: number;
  nota_tamanho?: number; nota_conforto?: number;
}) => {
  // Verifica que o imóvel pertence ao cliente
  const acesso = await query(`SELECT id FROM imovel_externo WHERE id=$1 AND cliente_id=$2`, [imovelExternoId, clienteId]);
  if (!acesso.rows[0]) throw new Error('Imóvel não encontrado');
  await query(
    `INSERT INTO avaliacao_externa (imovel_externo_id, cliente_id, interesse, comentario,
       nota_localizacao, nota_preco, nota_estado, nota_tamanho, nota_conforto)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (imovel_externo_id, cliente_id) DO UPDATE SET
       interesse=EXCLUDED.interesse, comentario=EXCLUDED.comentario,
       nota_localizacao=EXCLUDED.nota_localizacao, nota_preco=EXCLUDED.nota_preco,
       nota_estado=EXCLUDED.nota_estado, nota_tamanho=EXCLUDED.nota_tamanho,
       nota_conforto=EXCLUDED.nota_conforto`,
    [imovelExternoId, clienteId, d.interesse, d.comentario||null,
     d.nota_localizacao||null, d.nota_preco||null, d.nota_estado||null,
     d.nota_tamanho||null, d.nota_conforto||null]
  );
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
