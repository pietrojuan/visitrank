import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { query } from '../database/db';

// AUTH
export const login = async (email: string, senha: string) => {
  const r = await query(
    `SELECT u.*, i.razao_social FROM usuario u JOIN imobiliaria i ON i.id=u.imobiliaria_id WHERE u.email=$1 AND u.ativo=TRUE`,
    [email.toLowerCase().trim()]
  );
  if (!r.rows[0]) throw new Error('Credenciais inválidas');
  const u = r.rows[0];
  if (!await bcrypt.compare(senha, u.senha_hash)) throw new Error('Credenciais inválidas');
  const token = jwt.sign(
    { userId: u.id, imobiliariaId: u.imobiliaria_id, perfil: u.perfil, email: u.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as jwt.SignOptions
  );
  const { senha_hash: _, ...usuario } = u;
  return { token, usuario }; // usuario inclui campo primeiro_acesso
};

export const listarUsuarios = async (imobId: string) => {
  const r = await query(`SELECT id,nome,email,telefone,perfil,ativo,criado_em FROM usuario WHERE imobiliaria_id=$1 AND ativo=TRUE ORDER BY nome`, [imobId]);
  return r.rows;
};

export const criarUsuario = async (imobId: string, d: { nome: string; email: string; perfil: string; telefone?: string }) => {
  // Senha padrão "123456" — usuário é obrigado a trocar no primeiro acesso
  const hash = await bcrypt.hash('123456', 10);
  const r = await query(
    `INSERT INTO usuario (imobiliaria_id,nome,email,telefone,senha_hash,perfil,primeiro_acesso)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE)
     RETURNING id,nome,email,telefone,perfil,ativo,criado_em,primeiro_acesso`,
    [imobId, d.nome, d.email.toLowerCase().trim(), d.telefone || null, hash, d.perfil]
  );
  return r.rows[0];
};

export const trocarSenha = async (userId: string, senhaAtual: string | null, senhaNova: string) => {
  if (senhaNova.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');

  const r = await query(`SELECT senha_hash, primeiro_acesso FROM usuario WHERE id=$1 AND ativo=TRUE`, [userId]);
  if (!r.rows[0]) throw new Error('Usuário não encontrado.');
  const u = r.rows[0];

  if (u.primeiro_acesso) {
    // Primeiro acesso: não exige senha atual (usuário acabou de logar com o padrão)
  } else {
    // Acesso normal: exige senha atual correta
    if (!senhaAtual) throw new Error('Informe a senha atual.');
    if (!await bcrypt.compare(senhaAtual, u.senha_hash)) throw new Error('Senha atual incorreta.');
  }

  const novoHash = await bcrypt.hash(senhaNova, 10);
  await query(
    `UPDATE usuario SET senha_hash=$1, primeiro_acesso=FALSE WHERE id=$2`,
    [novoHash, userId]
  );
  return { ok: true };
};

export const excluirUsuario = async (imobId: string, adminId: string, targetId: string, senhAdmin: string) => {
  if (adminId === targetId) throw new Error('Você não pode excluir sua própria conta.');
  // Verify admin password
  const ar = await query(`SELECT senha_hash FROM usuario WHERE id=$1 AND imobiliaria_id=$2 AND ativo=TRUE`, [adminId, imobId]);
  if (!ar.rows[0]) throw new Error('Administrador não encontrado.');
  if (!await bcrypt.compare(senhAdmin, ar.rows[0].senha_hash)) throw new Error('Senha incorreta.');
  // Check target belongs to same imobiliaria
  const tr = await query(`SELECT id FROM usuario WHERE id=$1 AND imobiliaria_id=$2`, [targetId, imobId]);
  if (!tr.rows[0]) throw new Error('Usuário não encontrado.');
  await query(`DELETE FROM usuario WHERE id=$1`, [targetId]);
  return { ok: true };
};

// IMOVEIS
export const listarImoveis = async (imobId: string) => {
  const r = await query(`SELECT * FROM imovel WHERE imobiliaria_id=$1 AND ativo=TRUE ORDER BY titulo`, [imobId]);
  return r.rows;
};
export const buscarImovel = async (imobId: string, id: string) => {
  const r = await query(`SELECT * FROM imovel WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return r.rows[0] || null;
};
export const criarImovel = async (imobId: string, d: Record<string, unknown>) => {
  const r = await query(
    `INSERT INTO imovel (imobiliaria_id,titulo,descricao,bairro,cidade,preco,metragem,quartos,banheiros,vagas) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [imobId, d.titulo, d.descricao||null, d.bairro||null, d.cidade||null, d.preco||null, d.metragem||null, d.quartos||0, d.banheiros||0, d.vagas||0]
  );
  return r.rows[0];
};
export const atualizarImovel = async (imobId: string, id: string, d: Record<string, unknown>) => {
  const r = await query(
    `UPDATE imovel SET titulo=$1,descricao=$2,bairro=$3,cidade=$4,preco=$5,metragem=$6,quartos=$7,banheiros=$8,vagas=$9 WHERE id=$10 AND imobiliaria_id=$11 RETURNING *`,
    [d.titulo, d.descricao||null, d.bairro||null, d.cidade||null, d.preco||null, d.metragem||null, d.quartos||0, d.banheiros||0, d.vagas||0, id, imobId]
  );
  return r.rows[0] || null;
};
export const excluirImovel = async (imobId: string, id: string) => {
  // Hard delete — cascade removes: fotos, cômodos, avaliações de cômodo,
  // visitas, avaliações de visita, avaliacao_imovel, imovel_cliente
  const r = await query(`DELETE FROM imovel WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return (r.rowCount ?? 0) > 0;
};

// CLIENTES
export const listarClientes = async (imobId: string) => {
  const r = await query(`SELECT id,nome,email,telefone,ativo,criado_em FROM cliente WHERE imobiliaria_id=$1 AND ativo=TRUE ORDER BY nome`, [imobId]);
  return r.rows;
};
export const buscarCliente = async (imobId: string, id: string) => {
  const r = await query(`SELECT id,nome,email,telefone,ativo,criado_em FROM cliente WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return r.rows[0] || null;
};
export const criarCliente = async (imobId: string, d: Record<string, unknown>) => {
  const cpfHash = d.cpf ? crypto.createHash('sha256').update(String(d.cpf).replace(/\D/g,'')).digest('hex') : null;
  const r = await query(
    `INSERT INTO cliente (imobiliaria_id,nome,email,telefone,cpf_hash,corretor_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,nome,email,telefone,ativo,criado_em`,
    [imobId, d.nome, d.email||null, d.telefone||null, cpfHash, d.corretor_id||null]
  );
  return r.rows[0];
};
export const atualizarCliente = async (imobId: string, id: string, d: Record<string, unknown>) => {
  const r = await query(
    `UPDATE cliente SET nome=$1,email=$2,telefone=$3 WHERE id=$4 AND imobiliaria_id=$5 RETURNING id,nome,email,telefone,ativo,criado_em`,
    [d.nome, d.email||null, d.telefone||null, id, imobId]
  );
  return r.rows[0] || null;
};
export const excluirCliente = async (imobId: string, id: string) => {
  // Hard delete — exige schema_v4.sql (CASCADE em visita.cliente_id)
  // Cascade remove: imovel_cliente, avaliacao_imovel, avaliacao_comodo, visitas (→ avaliacoes)
  const r = await query(`DELETE FROM cliente WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return (r.rowCount ?? 0) > 0;
};

export const clienteDetalhes = async (imobId: string, clienteId: string) => {
  const [disponiveis, avaliacoes] = await Promise.all([
    query(`
      SELECT i.id, i.titulo, i.bairro, i.cidade, i.preco
      FROM imovel_cliente ic
      JOIN imovel i ON i.id = ic.imovel_id
      WHERE ic.cliente_id = $1 AND i.imobiliaria_id = $2 AND i.ativo = TRUE
        AND NOT EXISTS (SELECT 1 FROM avaliacao_imovel ai WHERE ai.imovel_id=i.id AND ai.cliente_id=$1)
        AND NOT EXISTS (
          SELECT 1 FROM visita v JOIN avaliacao a ON a.visita_id=v.id
          WHERE v.imovel_id=i.id AND v.cliente_id=$1
        )
      ORDER BY i.titulo
    `, [clienteId, imobId]),
    query(`
      SELECT ai.id, ai.interesse, ai.comentario, ai.criado_em,
             COALESCE(ROUND(AVG(ac.nota)::numeric,1),0) AS score_medio,
             i.titulo AS imovel_titulo, i.preco AS imovel_preco, i.bairro, i.cidade
      FROM avaliacao_imovel ai
      JOIN imovel i ON i.id=ai.imovel_id
      LEFT JOIN avaliacao_comodo ac ON ac.cliente_id=ai.cliente_id
        AND ac.comodo_id IN (SELECT id FROM comodo WHERE imovel_id=ai.imovel_id)
      WHERE ai.cliente_id=$1 AND i.imobiliaria_id=$2
      GROUP BY ai.id, ai.interesse, ai.comentario, ai.criado_em, i.titulo, i.preco, i.bairro, i.cidade
      ORDER BY ai.criado_em DESC
    `, [clienteId, imobId]),
  ]);
  return { disponiveis: disponiveis.rows, avaliacoes: avaliacoes.rows };
};

// VISITAS
export const listarVisitas = async (imobId: string, corretorId?: string) => {
  const r = await query(
    `SELECT v.*, i.titulo AS imovel_titulo, c.nome AS cliente_nome, u.nome AS corretor_nome,
            (EXISTS(SELECT 1 FROM avaliacao a WHERE a.visita_id=v.id)
             OR EXISTS(SELECT 1 FROM avaliacao_imovel ai WHERE ai.imovel_id=v.imovel_id AND ai.cliente_id=v.cliente_id)) AS avaliada
     FROM visita v JOIN imovel i ON i.id=v.imovel_id JOIN cliente c ON c.id=v.cliente_id JOIN usuario u ON u.id=v.corretor_id
     WHERE v.imobiliaria_id=$1
       ${corretorId ? 'AND v.corretor_id=$2' : ''}
       AND NOT (v.status='cancelada' AND v.criado_em < NOW() - INTERVAL '7 days')
     ORDER BY v.data_visita DESC`,
    corretorId ? [imobId, corretorId] : [imobId]
  );
  return r.rows;
};
export const agendarVisita = async (imobId: string, d: Record<string, unknown>) => {
  const qr_token = crypto.randomBytes(20).toString('hex');
  const r = await query(
    `INSERT INTO visita (imobiliaria_id,imovel_id,cliente_id,corretor_id,data_visita,qr_token) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [imobId, d.imovel_id, d.cliente_id, d.corretor_id, d.data_visita, qr_token]
  );
  // Libera o imóvel automaticamente para o cliente avaliar pelo portal
  await query(
    `INSERT INTO imovel_cliente (imovel_id, cliente_id, corretor_id)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [d.imovel_id, d.cliente_id, d.corretor_id]
  );
  const url = `${process.env.FRONTEND_URL}/avaliar/${qr_token}`;
  const qr_code_url = await QRCode.toDataURL(url);
  return { ...r.rows[0], qr_code_url };
};
export const getQrCode = async (imobId: string, id: string) => {
  const r = await query(`SELECT qr_token FROM visita WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  if (!r.rows[0]) throw new Error('Visita não encontrada');
  return QRCode.toDataURL(`${process.env.FRONTEND_URL}/avaliar/${r.rows[0].qr_token}`);
};
export const atualizarStatus = async (imobId: string, id: string, status: string) => {
  const r = await query(`UPDATE visita SET status=$1 WHERE id=$2 AND imobiliaria_id=$3 RETURNING *`, [status, id, imobId]);
  return r.rows[0] || null;
};

export const excluirVisita = async (imobId: string, id: string) => {
  // CASCADE apaga avaliacao, avaliacao_imovel (via imovel_id+cliente_id) não — apenas a visita e sua avaliacao direta
  const r = await query(`DELETE FROM visita WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return (r.rowCount ?? 0) > 0;
};

export const confirmarAvaliacao = async (imobId: string, visitaId: string, confirmar: boolean) => {
  // Busca a visita para obter imovel_id e cliente_id
  const vr = await query(
    `SELECT imovel_id, cliente_id FROM visita WHERE id=$1 AND imobiliaria_id=$2 AND status='aguardando'`,
    [visitaId, imobId]
  );
  if (!vr.rows[0]) throw new Error('Visita não encontrada ou não aguarda confirmação');
  const { imovel_id, cliente_id } = vr.rows[0];

  if (confirmar) {
    await query(`UPDATE visita SET status='realizada' WHERE id=$1`, [visitaId]);
  } else {
    // Rejeita: apaga avaliações do portal e volta visita para agendada
    await query(`DELETE FROM avaliacao_comodo WHERE cliente_id=$1 AND comodo_id IN (SELECT id FROM comodo WHERE imovel_id=$2)`, [cliente_id, imovel_id]);
    await query(`DELETE FROM avaliacao_imovel WHERE imovel_id=$1 AND cliente_id=$2`, [imovel_id, cliente_id]);
    await query(`UPDATE visita SET status='agendada' WHERE id=$1`, [visitaId]);
  }
  return { ok: true };
};
export const buscarVisitaPorToken = async (token: string) => {
  const r = await query(
    `SELECT v.*, i.titulo AS imovel_titulo, c.nome AS cliente_nome FROM visita v JOIN imovel i ON i.id=v.imovel_id JOIN cliente c ON c.id=v.cliente_id WHERE v.qr_token=$1`,
    [token]
  );
  return r.rows[0] || null;
};

// AVALIACOES
export const criarAvaliacao = async (token: string, d: Record<string, unknown>) => {
  const visita = await buscarVisitaPorToken(token);
  if (!visita) throw new Error('Visita não encontrada');

  // Verifica se já avaliada em qualquer dos dois sistemas
  const jaAvaliada = await query(
    `SELECT 1 FROM avaliacao WHERE visita_id=$1
     UNION ALL
     SELECT 1 FROM avaliacao_imovel WHERE imovel_id=$2 AND cliente_id=$3
     LIMIT 1`,
    [visita.id, visita.imovel_id, visita.cliente_id]
  );
  if (jaAvaliada.rows.length > 0) throw new Error('Visita já avaliada');

  // Sempre salva os 5 critérios fixos na tabela avaliacao
  await query(
    `INSERT INTO avaliacao (visita_id,nota_localizacao,nota_preco,nota_estado,nota_tamanho,nota_conforto,interesse,comentario)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [visita.id, d.nota_localizacao, d.nota_preco, d.nota_estado, d.nota_tamanho, d.nota_conforto, d.interesse, d.comentario || null]
  );

  // Se houver cômodos, salva também em avaliacao_imovel + avaliacao_comodo
  const avaliacoes = (d.avaliacoes as Array<{ comodo_id: string; nota: number; comentario?: string }>) || [];
  if (avaliacoes.length > 0) {
    await query(
      `INSERT INTO avaliacao_imovel (imovel_id, cliente_id, interesse, comentario)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (imovel_id, cliente_id) DO UPDATE SET interesse=EXCLUDED.interesse, comentario=EXCLUDED.comentario`,
      [visita.imovel_id, visita.cliente_id, d.interesse, d.comentario || null]
    );
    for (const av of avaliacoes) {
      await query(
        `INSERT INTO avaliacao_comodo (comodo_id, cliente_id, nota, comentario)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (comodo_id, cliente_id) DO UPDATE SET nota=EXCLUDED.nota, comentario=EXCLUDED.comentario`,
        [av.comodo_id, visita.cliente_id, av.nota, av.comentario || null]
      );
    }
  }

  await query(`UPDATE visita SET status='realizada' WHERE id=$1`, [visita.id]);
  return { ok: true };
};

// AVALIAÇÕES
export const buscarAvaliacao = async (imobId: string, id: string) => {
  const r = await query(`
    SELECT ai.id,
           COALESCE(ai.nota_localizacao, 0) AS nota_localizacao,
           COALESCE(ai.nota_preco,       0) AS nota_preco,
           COALESCE(ai.nota_estado,      0) AS nota_estado,
           COALESCE(ai.nota_tamanho,     0) AS nota_tamanho,
           COALESCE(ai.nota_conforto,    0) AS nota_conforto,
           ai.interesse, ai.comentario, ai.criado_em,
           i.titulo AS imovel_titulo, i.preco AS imovel_preco, i.bairro, i.cidade,
           c.nome AS cliente_nome, c.email AS cliente_email,
           ai.criado_em AS data_visita, ai.imovel_id, ai.cliente_id,
           COALESCE(u.nome, '—') AS corretor_nome
    FROM avaliacao_imovel ai
    JOIN imovel i   ON i.id  = ai.imovel_id
    JOIN cliente c  ON c.id  = ai.cliente_id
    LEFT JOIN imovel_cliente ic ON ic.imovel_id = ai.imovel_id AND ic.cliente_id = ai.cliente_id
    LEFT JOIN usuario u ON u.id = ic.corretor_id
    WHERE ai.id = $1 AND i.imobiliaria_id = $2
  `, [id, imobId]);
  if (!r.rows[0]) return null;
  const { imovel_id, cliente_id } = r.rows[0];
  const comodos = await query(`
    SELECT co.nome, ac.nota, ac.comentario
    FROM avaliacao_comodo ac
    JOIN comodo co ON co.id = ac.comodo_id
    WHERE co.imovel_id = $1 AND ac.cliente_id = $2
    ORDER BY co.ordem
  `, [imovel_id, cliente_id]);
  return { ...r.rows[0], comodos: comodos.rows };
};

export const listarAvaliacoes = async (imobId: string) => {
  const r = await query(`
    SELECT ai.id,
           COALESCE(ai.nota_localizacao, 0) AS nota_localizacao,
           COALESCE(ai.nota_preco,       0) AS nota_preco,
           COALESCE(ai.nota_estado,      0) AS nota_estado,
           COALESCE(ai.nota_tamanho,     0) AS nota_tamanho,
           COALESCE(ai.nota_conforto,    0) AS nota_conforto,
           ai.interesse, ai.comentario, ai.criado_em,
           i.titulo AS imovel_titulo, i.preco AS imovel_preco, i.bairro, i.cidade,
           c.nome AS cliente_nome, c.email AS cliente_email,
           ai.criado_em AS data_visita,
           COALESCE(u.nome, '—') AS corretor_nome
    FROM avaliacao_imovel ai
    JOIN imovel i   ON i.id  = ai.imovel_id
    JOIN cliente c  ON c.id  = ai.cliente_id
    LEFT JOIN imovel_cliente ic ON ic.imovel_id = ai.imovel_id AND ic.cliente_id = ai.cliente_id
    LEFT JOIN usuario u ON u.id = ic.corretor_id
    WHERE i.imobiliaria_id = $1 AND ai.moderacao = 'aprovada'
    ORDER BY ai.criado_em DESC
  `, [imobId]);
  return r.rows;
};

export const excluirAvaliacao = async (imobId: string, avaliacaoId: string) => {
  // Verifica que a avaliação pertence à imobiliária e obtém imovel_id/cliente_id
  const r = await query(
    `SELECT ai.imovel_id, ai.cliente_id FROM avaliacao_imovel ai
     JOIN imovel i ON i.id = ai.imovel_id
     WHERE ai.id = $1 AND i.imobiliaria_id = $2`,
    [avaliacaoId, imobId]
  );
  if (!r.rows[0]) throw new Error('Avaliação não encontrada');
  const { imovel_id, cliente_id } = r.rows[0];
  // Apaga notas dos cômodos e depois a avaliação principal
  await query(
    `DELETE FROM avaliacao_comodo WHERE cliente_id = $1 AND comodo_id IN (SELECT id FROM comodo WHERE imovel_id = $2)`,
    [cliente_id, imovel_id]
  );
  await query(`DELETE FROM avaliacao_imovel WHERE id = $1`, [avaliacaoId]);
  return { ok: true };
};

// DISPONIBILIDADE
export const listarDisponibilidade = async (imobId: string, corretorId?: string) => {
  const r = await query(
    `SELECT d.*, u.nome AS corretor_nome
     FROM disponibilidade d JOIN usuario u ON u.id = d.corretor_id
     WHERE d.imobiliaria_id = $1 ${corretorId ? 'AND d.corretor_id = $2' : ''}
     ORDER BY u.nome, d.recorrente DESC, d.dia_semana, d.data_especifica, d.hora_inicio`,
    corretorId ? [imobId, corretorId] : [imobId]
  );
  return r.rows;
};

export const criarDisponibilidade = async (imobId: string, corretorId: string, d: {
  recorrente: boolean; dia_semana?: number; data_especifica?: string;
  hora_inicio: string; hora_fim: string;
}) => {
  if (d.recorrente && d.dia_semana == null) throw new Error('Informe o dia da semana.');
  if (!d.recorrente && !d.data_especifica) throw new Error('Informe a data específica.');
  const r = await query(
    `INSERT INTO disponibilidade (imobiliaria_id, corretor_id, recorrente, dia_semana, data_especifica, hora_inicio, hora_fim)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [imobId, corretorId, d.recorrente, d.dia_semana ?? null, d.data_especifica ?? null, d.hora_inicio, d.hora_fim]
  );
  return r.rows[0];
};

export const excluirDisponibilidade = async (imobId: string, id: string) => {
  await query(`DELETE FROM disponibilidade WHERE id=$1 AND imobiliaria_id=$2`, [id, imobId]);
  return { ok: true };
};

// Retorna slots livres de 1h para uma data específica (para o cliente agendar)
export const slotsDisponiveis = async (imobId: string, data: string, imovelId: string) => {
  const diaSemana = new Date(data + 'T12:00:00').getDay(); // 0=dom

  // Busca blocos de disponibilidade dos corretores para o dia
  const r = await query(
    `SELECT d.id AS disponibilidade_id, d.hora_inicio, d.hora_fim,
            u.id AS corretor_id, u.nome AS corretor_nome, u.telefone AS corretor_telefone
     FROM disponibilidade d
     JOIN usuario u ON u.id = d.corretor_id
     WHERE d.imobiliaria_id = $1
       AND u.ativo = TRUE
       AND (
         (d.recorrente = true AND d.dia_semana = $2)
         OR (d.recorrente = false AND d.data_especifica = $3)
       )
     ORDER BY d.hora_inicio`,
    [imobId, diaSemana, data]
  );

  // Expande cada bloco em slots de 1 hora
  const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  // Se for hoje, calcula quantos minutos já passaram (hora atual + margem de 30min)
  const hoje = new Date().toISOString().split('T')[0];
  const agora = new Date();
  const minutosAgora = data === hoje ? agora.getHours() * 60 + agora.getMinutes() + 30 : 0;

  const slots: { disponibilidade_id: string; hora_inicio: string; hora_fim: string; corretor_id: string; corretor_nome: string; corretor_telefone: string }[] = [];
  for (const row of r.rows) {
    const ini = toMinutes(row.hora_inicio.slice(0, 5));
    const fim = toMinutes(row.hora_fim.slice(0, 5));
    for (let m = ini; m + 60 <= fim; m += 60) {
      if (m < minutosAgora) continue; // descarta slots no passado
      slots.push({
        disponibilidade_id: row.disponibilidade_id,
        hora_inicio: toTime(m),
        hora_fim: toTime(m + 60),
        corretor_id: row.corretor_id,
        corretor_nome: row.corretor_nome,
        corretor_telefone: row.corretor_telefone,
      });
    }
  }

  // Remove slots já ocupados por visita existente nessa data
  const ocupados = await query(
    `SELECT corretor_id, TO_CHAR(data_visita, 'HH24:MI') AS hora
     FROM visita
     WHERE imobiliaria_id=$1 AND imovel_id=$2
       AND DATE(data_visita) = $3
       AND status NOT IN ('cancelada')`,
    [imobId, imovelId, data]
  );
  const ocupadoSet = new Set(ocupados.rows.map((o: { corretor_id: string; hora: string }) => `${o.corretor_id}_${o.hora}`));

  return slots.filter(s => !ocupadoSet.has(`${s.corretor_id}_${s.hora_inicio}`));
};

// MODERAÇÃO
export const listarAvaliacoesPendentes = async (imobId: string) => {
  const r = await query(`
    SELECT ai.id, ai.interesse, ai.comentario, ai.criado_em, ai.moderacao,
           ai.imovel_id, ai.cliente_id,
           i.titulo AS imovel_titulo, i.bairro, i.cidade,
           c.nome AS cliente_nome, c.email AS cliente_email,
           COALESCE(u.nome, '—') AS corretor_nome,
           COALESCE(ai.nota_localizacao,0) AS nota_localizacao,
           COALESCE(ai.nota_preco,0) AS nota_preco,
           COALESCE(ai.nota_estado,0) AS nota_estado,
           COALESCE(ai.nota_tamanho,0) AS nota_tamanho,
           COALESCE(ai.nota_conforto,0) AS nota_conforto,
           COALESCE(
             (SELECT JSON_AGG(JSON_BUILD_OBJECT(
               'comodo_nome', co.nome,
               'nota', ac.nota,
               'comentario', ac.comentario
             ) ORDER BY co.nome)
             FROM avaliacao_comodo ac
             JOIN comodo co ON co.id = ac.comodo_id
             WHERE ac.cliente_id = ai.cliente_id AND co.imovel_id = ai.imovel_id),
           '[]') AS comodos_avaliados
    FROM avaliacao_imovel ai
    JOIN imovel i ON i.id = ai.imovel_id
    JOIN cliente c ON c.id = ai.cliente_id
    LEFT JOIN imovel_cliente ic ON ic.imovel_id = ai.imovel_id AND ic.cliente_id = ai.cliente_id
    LEFT JOIN usuario u ON u.id = ic.corretor_id
    WHERE i.imobiliaria_id = $1 AND ai.moderacao = 'pendente'
    ORDER BY ai.criado_em ASC
  `, [imobId]);
  return r.rows;
};

export const moderarAvaliacao = async (imobId: string, avaliacaoId: string, acao: 'aprovada' | 'rejeitada') => {
  const r = await query(
    `UPDATE avaliacao_imovel SET moderacao=$1
     WHERE id=$2 AND EXISTS (
       SELECT 1 FROM imovel i WHERE i.id = avaliacao_imovel.imovel_id AND i.imobiliaria_id=$3
     ) RETURNING id`,
    [acao, avaliacaoId, imobId]
  );
  if (!r.rows[0]) throw new Error('Avaliação não encontrada');
  return { ok: true };
};

// RANKING
export const getRanking = async (imobId: string) => {
  const r = await query(`
    WITH avals AS (
      SELECT ai.imovel_id,
        COUNT(ai.id)::float AS n,
        AVG((ai.nota_localizacao*2.0+ai.nota_preco*2.5+ai.nota_estado*1.5+ai.nota_tamanho*1.5+ai.nota_conforto*2.5)/10.0) AS r,
        AVG(CASE ai.interesse WHEN 'SIM' THEN 1.0 WHEN 'TALVEZ' THEN 0.5 ELSE 0 END) AS interesse,
        SUM(CASE WHEN (ai.nota_localizacao+ai.nota_preco+ai.nota_estado+ai.nota_tamanho+ai.nota_conforto)::float/5<=2 THEN 1 ELSE 0 END)::float/NULLIF(COUNT(ai.id),0) AS rejeicao
      FROM avaliacao_imovel ai
      JOIN imovel i ON i.id = ai.imovel_id
      WHERE i.imobiliaria_id=$1 AND ai.moderacao='aprovada'
      GROUP BY ai.imovel_id
    ), global AS (SELECT COALESCE(AVG(r),0) AS c FROM avals)
    SELECT i.*,
      COALESCE(av.n,0)::int AS total_avaliacoes,
      ROUND(COALESCE(av.r,0)::numeric,2) AS score_medio,
      ROUND(COALESCE((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c,0)::numeric,2) AS score_ajustado,
      ROUND(COALESCE(av.interesse,0)::numeric,2) AS indice_interesse,
      ROUND(COALESCE(av.rejeicao,0)::numeric,2) AS indice_rejeicao,
      ROUND(COALESCE(0.6*((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)+0.3*av.interesse+0.1*LN(GREATEST(av.n,1)),0)::numeric,2) AS visitrank_score,
      ROUND(COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)::numeric,2) AS atratividade,
      CASE WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>4 THEN 'altamente_atrativo'
           WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>=3 THEN 'competitivo'
           WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>=2 THEN 'precisa_melhorar'
           ELSE 'baixa_atratividade' END AS classificacao
    FROM imovel i LEFT JOIN avals av ON av.imovel_id=i.id CROSS JOIN global g
    WHERE i.imobiliaria_id=$1 AND i.ativo=TRUE ORDER BY visitrank_score DESC
  `, [imobId]);
  return r.rows;
};

export const getDashboard = async (imobId: string) => {
  const [t, m, mes, top] = await Promise.all([
    query(`
      SELECT
        (SELECT COUNT(*) FROM imovel WHERE imobiliaria_id=$1 AND ativo=TRUE)::int AS total_imoveis,
        (SELECT COUNT(*) FROM visita WHERE imobiliaria_id=$1 AND NOT (status='cancelada' AND criado_em < NOW() - INTERVAL '7 days'))::int AS total_visitas,
        (SELECT COUNT(*) FROM avaliacao_imovel ai JOIN imovel i ON i.id=ai.imovel_id WHERE i.imobiliaria_id=$1 AND ai.moderacao='aprovada')::int AS total_avaliacoes,
        (SELECT COUNT(*) FROM visita v WHERE v.imobiliaria_id=$1
          AND NOT EXISTS (SELECT 1 FROM avaliacao a WHERE a.visita_id=v.id)
          AND NOT EXISTS (SELECT 1 FROM avaliacao_imovel ai WHERE ai.imovel_id=v.imovel_id AND ai.cliente_id=v.cliente_id)
          AND NOT (v.status='cancelada' AND v.criado_em < NOW() - INTERVAL '7 days')
        )::int AS visitas_pendentes
    `, [imobId]),
    query(`
      WITH all_avals AS (
        SELECT ai.interesse,
          COALESCE((
            SELECT AVG(ac.nota) FROM avaliacao_comodo ac
            JOIN comodo c ON c.id=ac.comodo_id
            WHERE c.imovel_id=ai.imovel_id AND ac.cliente_id=ai.cliente_id
          ), 0) AS nota_media
        FROM avaliacao_imovel ai JOIN imovel i ON i.id=ai.imovel_id WHERE i.imobiliaria_id=$1 AND ai.moderacao='aprovada'
      )
      SELECT
        ROUND(COALESCE(AVG(nota_media),0)::numeric,1) AS media_geral,
        COUNT(*) FILTER (WHERE interesse='SIM')::int  AS total_sim,
        COUNT(*) FILTER (WHERE interesse='TALVEZ')::int AS total_talvez,
        COUNT(*) FILTER (WHERE interesse='NAO')::int  AS total_nao,
        ROUND(COALESCE(COUNT(*) FILTER (WHERE interesse='SIM')::float / NULLIF(COUNT(*),0), 0)::numeric, 2) AS taxa_interesse_real
      FROM all_avals
    `, [imobId]),
    query(`SELECT TO_CHAR(data_visita,'YYYY-MM') AS mes,COUNT(*)::int AS total FROM visita WHERE imobiliaria_id=$1 AND data_visita>=NOW()-INTERVAL '6 months' AND NOT (status='cancelada' AND criado_em < NOW() - INTERVAL '7 days') GROUP BY mes ORDER BY mes`, [imobId]),
    query(`
      WITH avals AS (SELECT v.imovel_id,COUNT(a.id)::float AS n,AVG((a.nota_localizacao*2.0+a.nota_preco*2.5+a.nota_estado*1.5+a.nota_tamanho*1.5+a.nota_conforto*2.5)/10.0) AS r,AVG(CASE a.interesse WHEN 'SIM' THEN 1.0 WHEN 'TALVEZ' THEN 0.5 ELSE 0 END) AS interesse FROM visita v JOIN avaliacao a ON a.visita_id=v.id WHERE v.imobiliaria_id=$1 GROUP BY v.imovel_id),global AS(SELECT COALESCE(AVG(r),0) AS c FROM avals)
      SELECT i.id,i.titulo,i.bairro,i.cidade,COALESCE(av.n,0)::int AS total_avaliacoes,ROUND(COALESCE(0.6*((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)+0.3*av.interesse+0.1*LN(GREATEST(av.n,1)),0)::numeric,2) AS visitrank_score,CASE WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>4 THEN 'altamente_atrativo' WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>=3 THEN 'competitivo' WHEN COALESCE(((av.n/(av.n+10))*av.r+(10/(av.n+10))*g.c)*av.interesse,0)>=2 THEN 'precisa_melhorar' ELSE 'baixa_atratividade' END AS classificacao
      FROM imovel i LEFT JOIN avals av ON av.imovel_id=i.id CROSS JOIN global g WHERE i.imobiliaria_id=$1 AND i.ativo=TRUE ORDER BY visitrank_score DESC LIMIT 5
    `, [imobId]),
  ]);
  return { ...t.rows[0], ...m.rows[0], visitas_por_mes: mes.rows, ranking_top5: top.rows };
};
