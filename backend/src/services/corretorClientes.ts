import { query } from '../database/db';

// Lista clientes com quais imóveis foram liberados para cada um
export const clientesComImoveis = async (imobiliariaId: string) => {
  const clientes = await query(
    `SELECT c.id, c.nome, c.email, c.telefone, c.primeiro_acesso,
       COALESCE(
         JSON_AGG(
           JSON_BUILD_OBJECT('id', i.id, 'titulo', i.titulo)
           ORDER BY i.titulo
         ) FILTER (WHERE i.id IS NOT NULL),
         '[]'
       ) AS imoveis_liberados
     FROM cliente c
     LEFT JOIN imovel_cliente ic ON ic.cliente_id = c.id
     LEFT JOIN imovel i ON i.id = ic.imovel_id AND i.ativo = TRUE
     WHERE c.imobiliaria_id = $1 AND c.ativo = TRUE
     GROUP BY c.id, c.nome, c.email, c.telefone, c.primeiro_acesso
     ORDER BY c.nome`,
    [imobiliariaId]
  );
  return clientes.rows;
};

// Liberar imóvel para cliente
export const liberarImovel = async (
  imobiliariaId: string,
  corretorId: string,
  clienteId: string,
  imovelId: string
) => {
  // Verifica se imóvel pertence à imobiliária
  const imovel = await query(
    `SELECT id FROM imovel WHERE id=$1 AND imobiliaria_id=$2 AND ativo=TRUE`,
    [imovelId, imobiliariaId]
  );
  if (!imovel.rows[0]) throw new Error('Imóvel não encontrado');

  await query(
    `INSERT INTO imovel_cliente (imovel_id, cliente_id, corretor_id)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [imovelId, clienteId, corretorId]
  );
  return { ok: true };
};

// Remover imóvel liberado para cliente
export const removerImovel = async (clienteId: string, imovelId: string) => {
  await query(
    `DELETE FROM imovel_cliente WHERE imovel_id=$1 AND cliente_id=$2`,
    [imovelId, clienteId]
  );
  return { ok: true };
};

// Imóveis disponíveis para liberar (todos da imobiliária)
export const imoveisDisponiveis = async (imobiliariaId: string) => {
  const r = await query(
    `SELECT id, titulo, bairro, cidade FROM imovel WHERE imobiliaria_id=$1 AND ativo=TRUE ORDER BY titulo`,
    [imobiliariaId]
  );
  return r.rows;
};
