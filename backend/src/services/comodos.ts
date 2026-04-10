import { query } from '../database/db';

export const listarComodos = async (imovelId: string) => {
  const r = await query(
    `SELECT * FROM comodo WHERE imovel_id=$1 ORDER BY ordem`,
    [imovelId]
  );
  return r.rows;
};

export const criarComodo = async (imovelId: string, nome: string) => {
  const ord = await query(`SELECT COALESCE(MAX(ordem)+1,0) AS prox FROM comodo WHERE imovel_id=$1`, [imovelId]);
  const r = await query(
    `INSERT INTO comodo (imovel_id, nome, ordem) VALUES ($1,$2,$3) RETURNING *`,
    [imovelId, nome, ord.rows[0].prox]
  );
  return r.rows[0];
};

export const excluirComodo = async (imovelId: string, comodoId: string) => {
  await query(`DELETE FROM comodo WHERE id=$1 AND imovel_id=$2`, [comodoId, imovelId]);
};

export const atualizarComodo = async (imovelId: string, comodoId: string, nome: string) => {
  const r = await query(
    `UPDATE comodo SET nome=$1 WHERE id=$2 AND imovel_id=$3 RETURNING *`,
    [nome, comodoId, imovelId]
  );
  return r.rows[0] || null;
};
