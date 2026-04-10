-- VisitRank v3 - Adiciona critérios de avaliação no portal do cliente
ALTER TABLE avaliacao_imovel ADD COLUMN IF NOT EXISTS nota_localizacao SMALLINT CHECK (nota_localizacao BETWEEN 1 AND 5);
ALTER TABLE avaliacao_imovel ADD COLUMN IF NOT EXISTS nota_preco       SMALLINT CHECK (nota_preco       BETWEEN 1 AND 5);
ALTER TABLE avaliacao_imovel ADD COLUMN IF NOT EXISTS nota_estado      SMALLINT CHECK (nota_estado      BETWEEN 1 AND 5);
ALTER TABLE avaliacao_imovel ADD COLUMN IF NOT EXISTS nota_tamanho     SMALLINT CHECK (nota_tamanho     BETWEEN 1 AND 5);
ALTER TABLE avaliacao_imovel ADD COLUMN IF NOT EXISTS nota_conforto    SMALLINT CHECK (nota_conforto    BETWEEN 1 AND 5);
