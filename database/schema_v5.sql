-- Schema v5: Adiciona telefone ao usuario
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
