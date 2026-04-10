import { query } from '../database/db';

export const listarFotos = async (imovelId: string) => {
  const r = await query(
    `SELECT id, ordem, mime_type FROM foto_imovel WHERE imovel_id=$1 ORDER BY ordem`,
    [imovelId]
  );
  return r.rows;
};

export const getFoto = async (fotoId: string) => {
  const r = await query(
    `SELECT dados, mime_type FROM foto_imovel WHERE id=$1`,
    [fotoId]
  );
  return r.rows[0] || null;
};

export const salvarFotos = async (imovelId: string, fotos: { dados: Buffer; mime_type: string }[]) => {
  // Remove fotos antigas se já tiver 10
  const existentes = await query(`SELECT COUNT(*) FROM foto_imovel WHERE imovel_id=$1`, [imovelId]);
  const total = parseInt(existentes.rows[0].count);

  if (total + fotos.length > 10) throw new Error('Máximo de 10 fotos por imóvel');

  for (let i = 0; i < fotos.length; i++) {
    await query(
      `INSERT INTO foto_imovel (imovel_id, dados, mime_type, ordem) VALUES ($1,$2,$3,$4)`,
      [imovelId, fotos[i].dados, fotos[i].mime_type, total + i]
    );
  }
};

export const excluirFoto = async (imovelId: string, fotoId: string) => {
  const r = await query(
    `DELETE FROM foto_imovel WHERE id=$1 AND imovel_id=$2`,
    [fotoId, imovelId]
  );
  // Reordena
  await query(
    `UPDATE foto_imovel SET ordem = sub.nova_ordem FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY ordem) - 1 AS nova_ordem
       FROM foto_imovel WHERE imovel_id=$1
     ) sub WHERE foto_imovel.id = sub.id`,
    [imovelId]
  );
  return (r.rowCount ?? 0) > 0;
};

export const reordenarFotos = async (imovelId: string, ids: string[]) => {
  for (let i = 0; i < ids.length; i++) {
    await query(
      `UPDATE foto_imovel SET ordem=$1 WHERE id=$2 AND imovel_id=$3`,
      [i, ids[i], imovelId]
    );
  }
};
