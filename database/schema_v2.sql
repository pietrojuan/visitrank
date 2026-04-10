-- VisitRank v2 - Adições para fotos, cômodos, clientes e avaliações por cômodo

-- Fotos do imóvel
CREATE TABLE IF NOT EXISTS foto_imovel (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id  UUID NOT NULL REFERENCES imovel(id) ON DELETE CASCADE,
  dados      BYTEA NOT NULL,
  mime_type  VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  ordem      SMALLINT NOT NULL DEFAULT 0,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_foto_imovel ON foto_imovel(imovel_id, ordem);

-- Cômodos/itens do imóvel (cadastrados pelo corretor)
CREATE TABLE IF NOT EXISTS comodo (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id UUID NOT NULL REFERENCES imovel(id) ON DELETE CASCADE,
  nome      VARCHAR(100) NOT NULL,
  ordem     SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_comodo_imovel ON comodo(imovel_id);

-- Campo observacao no imovel
ALTER TABLE imovel ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Senha e primeiro acesso do cliente
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT TRUE;

-- Imóveis liberados pelo corretor para o cliente
CREATE TABLE IF NOT EXISTS imovel_cliente (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id   UUID NOT NULL REFERENCES imovel(id) ON DELETE CASCADE,
  cliente_id  UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES usuario(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(imovel_id, cliente_id)
);
CREATE INDEX IF NOT EXISTS idx_imovelcliente_cliente ON imovel_cliente(cliente_id);

-- Avaliação geral do imóvel pelo cliente (substituindo a antiga por visita)
CREATE TABLE IF NOT EXISTS avaliacao_imovel (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id   UUID NOT NULL REFERENCES imovel(id) ON DELETE CASCADE,
  cliente_id  UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  interesse   VARCHAR(10) NOT NULL CHECK (interesse IN ('SIM','TALVEZ','NAO')),
  comentario  TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(imovel_id, cliente_id)
);

-- Avaliação por cômodo
CREATE TABLE IF NOT EXISTS avaliacao_comodo (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comodo_id   UUID NOT NULL REFERENCES comodo(id) ON DELETE CASCADE,
  cliente_id  UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  nota        SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comodo_id, cliente_id)
);
CREATE INDEX IF NOT EXISTS idx_avalcomodo_comodo ON avaliacao_comodo(comodo_id);
