-- Schema v6: corretor_id pode ser NULL para permitir hard delete de usuários
ALTER TABLE visita DROP CONSTRAINT visita_corretor_id_fkey;
ALTER TABLE visita ALTER COLUMN corretor_id DROP NOT NULL;
ALTER TABLE visita ADD CONSTRAINT visita_corretor_id_fkey
  FOREIGN KEY (corretor_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE imovel_cliente DROP CONSTRAINT imovel_cliente_corretor_id_fkey;
ALTER TABLE imovel_cliente ALTER COLUMN corretor_id DROP NOT NULL;
ALTER TABLE imovel_cliente ADD CONSTRAINT imovel_cliente_corretor_id_fkey
  FOREIGN KEY (corretor_id) REFERENCES usuario(id) ON DELETE SET NULL;
