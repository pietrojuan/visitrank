-- Schema v7: corretor responsável no cliente
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES usuario(id) ON DELETE SET NULL;
