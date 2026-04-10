-- VisitRank v2 - Schema simples
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Imobiliária
CREATE TABLE IF NOT EXISTS imobiliaria (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social VARCHAR(200) NOT NULL,
  cnpj         VARCHAR(18),
  plano        VARCHAR(20) DEFAULT 'Pro',
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Usuário
CREATE TABLE IF NOT EXISTS usuario (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliaria(id) ON DELETE CASCADE,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  senha_hash     VARCHAR(255) NOT NULL,
  perfil         VARCHAR(20) NOT NULL DEFAULT 'Corretor' CHECK (perfil IN ('Administrador','Corretor')),
  ativo          BOOLEAN DEFAULT TRUE,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Imóvel
CREATE TABLE IF NOT EXISTS imovel (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliaria(id) ON DELETE CASCADE,
  titulo         VARCHAR(200) NOT NULL,
  descricao      TEXT,
  bairro         VARCHAR(100),
  cidade         VARCHAR(100),
  preco          NUMERIC(14,2),
  metragem       NUMERIC(8,2),
  quartos        SMALLINT DEFAULT 0,
  banheiros      SMALLINT DEFAULT 0,
  vagas          SMALLINT DEFAULT 0,
  ativo          BOOLEAN DEFAULT TRUE,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Cliente
CREATE TABLE IF NOT EXISTS cliente (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliaria(id) ON DELETE CASCADE,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150),
  telefone       VARCHAR(20),
  cpf_hash       VARCHAR(64),
  ativo          BOOLEAN DEFAULT TRUE,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Visita
CREATE TABLE IF NOT EXISTS visita (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliaria(id) ON DELETE CASCADE,
  imovel_id      UUID NOT NULL REFERENCES imovel(id) ON DELETE CASCADE,
  cliente_id     UUID NOT NULL REFERENCES cliente(id),
  corretor_id    UUID NOT NULL REFERENCES usuario(id),
  data_visita    TIMESTAMPTZ NOT NULL,
  qr_token       VARCHAR(64) NOT NULL UNIQUE,
  status         VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','cancelada')),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Avaliação
CREATE TABLE IF NOT EXISTS avaliacao (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id         UUID NOT NULL UNIQUE REFERENCES visita(id) ON DELETE CASCADE,
  nota_localizacao  SMALLINT NOT NULL CHECK (nota_localizacao  BETWEEN 1 AND 5),
  nota_preco        SMALLINT NOT NULL CHECK (nota_preco        BETWEEN 1 AND 5),
  nota_estado       SMALLINT NOT NULL CHECK (nota_estado       BETWEEN 1 AND 5),
  nota_tamanho      SMALLINT NOT NULL CHECK (nota_tamanho      BETWEEN 1 AND 5),
  nota_conforto     SMALLINT NOT NULL CHECK (nota_conforto     BETWEEN 1 AND 5),
  interesse         VARCHAR(10) NOT NULL CHECK (interesse IN ('SIM','TALVEZ','NAO')),
  comentario        TEXT,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_imovel_imob    ON imovel(imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_visita_imovel  ON visita(imovel_id);
CREATE INDEX IF NOT EXISTS idx_visita_token   ON visita(qr_token);
CREATE INDEX IF NOT EXISTS idx_avaliacao_vis  ON avaliacao(visita_id);
