-- VisitRank v4 - Cascades corretos + primeiro acesso de usuários

-- 1. Corrige FK de visita.cliente_id para deletar em cascata quando o cliente for excluído
ALTER TABLE visita DROP CONSTRAINT IF EXISTS visita_cliente_id_fkey;
ALTER TABLE visita ADD CONSTRAINT visita_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE;

-- 2. Campo primeiro_acesso no usuário (força troca de senha no primeiro login)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE;

-- Usuários já existentes: marca como já tendo feito o primeiro acesso
UPDATE usuario SET primeiro_acesso = FALSE WHERE primeiro_acesso = TRUE;
