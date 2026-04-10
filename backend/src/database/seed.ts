import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { query } from './db';

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Imobiliária
  const imobRes = await query(`
    INSERT INTO imobiliaria (id, razao_social, cnpj, plano)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Imobiliária', '00000000000000', 'Pro')
    ON CONFLICT DO NOTHING
    RETURNING id
  `);
  const imobId = '11111111-1111-1111-1111-111111111111';
  console.log('✅ Imobiliária OK');

  // Senhas
  const adminHash     = await bcrypt.hash('admin123', 10);
  const corretorHash  = await bcrypt.hash('corretor123', 10);

  // Admin
  await query(`
    INSERT INTO usuario (id, imobiliaria_id, nome, email, senha_hash, perfil)
    VALUES ('22222222-2222-2222-2222-222222222222', $1, 'Administrador', 'admin@demo.com', $2, 'Administrador')
    ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
  `, [imobId, adminHash]);
  console.log('✅ Admin: admin@demo.com / admin123');

  // Corretor
  await query(`
    INSERT INTO usuario (id, imobiliaria_id, nome, email, senha_hash, perfil)
    VALUES ('33333333-3333-3333-3333-333333333333', $1, 'João Corretor', 'joao@demo.com', $2, 'Corretor')
    ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
  `, [imobId, corretorHash]);
  console.log('✅ Corretor: joao@demo.com / corretor123');

  // Imóveis
  const imoveis = [
    ['44444444-4444-4444-4444-444444444441', 'Apartamento Moderno Centro',  'Centro',        'São Paulo',  450000, 85,  3, 2, 1],
    ['44444444-4444-4444-4444-444444444442', 'Casa em Condomínio Fechado',  'Alphaville',    'Barueri',    890000, 200, 4, 3, 2],
    ['44444444-4444-4444-4444-444444444443', 'Studio Compacto Brooklin',    'Brooklin',      'São Paulo',  280000, 42,  1, 1, 1],
    ['44444444-4444-4444-4444-444444444444', 'Cobertura Duplex Jardins',    'Jardins',       'São Paulo', 1500000, 300, 4, 4, 3],
    ['44444444-4444-4444-4444-444444444445', 'Apartamento Vila Madalena',   'Vila Madalena', 'São Paulo',  620000, 110, 3, 2, 2],
  ];

  for (const [id, titulo, bairro, cidade, preco, metragem, quartos, banheiros, vagas] of imoveis) {
    await query(`
      INSERT INTO imovel (id, imobiliaria_id, titulo, bairro, cidade, preco, metragem, quartos, banheiros, vagas)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT DO NOTHING
    `, [id, imobId, titulo, bairro, cidade, preco, metragem, quartos, banheiros, vagas]);
  }
  console.log('✅ 5 imóveis inseridos');

  // Clientes
  const clientes = [
    ['55555555-5555-5555-5555-555555555551', 'Maria Silva',    'maria@email.com'],
    ['55555555-5555-5555-5555-555555555552', 'Carlos Souza',   'carlos@email.com'],
    ['55555555-5555-5555-5555-555555555553', 'Ana Pereira',    'ana@email.com'],
    ['55555555-5555-5555-5555-555555555554', 'Roberto Lima',   'roberto@email.com'],
    ['55555555-5555-5555-5555-555555555555', 'Fernanda Costa', 'fernanda@email.com'],
  ];

  for (const [id, nome, email] of clientes) {
    await query(`
      INSERT INTO cliente (id, imobiliaria_id, nome, email)
      VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING
    `, [id, imobId, nome, email]);
  }
  console.log('✅ 5 clientes inseridos');

  // Visitas + Avaliações
  const visitas = [
    ['66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 10, 'qr001', 5,4,5,4,5,'SIM',    'Excelente!'],
    ['66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555552', 8,  'qr002', 4,3,4,5,4,'TALVEZ', 'Bom mas caro'],
    ['66666666-6666-6666-6666-666666666663', '44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555553', 7,  'qr003', 5,5,4,5,5,'SIM',    'Perfeito!'],
    ['66666666-6666-6666-6666-666666666664', '44444444-4444-4444-4444-444444444443', '55555555-5555-5555-5555-555555555554', 5,  'qr004', 3,4,3,2,3,'NAO',    'Pequeno demais'],
    ['66666666-6666-6666-6666-666666666665', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 3,  'qr005', 5,4,5,5,5,'SIM',    'Incrível!'],
    ['66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444445', '55555555-5555-5555-5555-555555555551', 2,  'qr006', 4,4,4,4,4,'SIM',    'Ótima localização'],
  ];

  for (const [vid, imovelId, clienteId, diasAtras, qrToken, nl, np, ne, nt, nc, interesse, comentario] of visitas) {
    await query(`
      INSERT INTO visita (id, imobiliaria_id, imovel_id, cliente_id, corretor_id, data_visita, qr_token, status)
      VALUES ($1,$2,$3,$4,'33333333-3333-3333-3333-333333333333',NOW()-($5 * INTERVAL '1 day'),$6,'realizada')
      ON CONFLICT DO NOTHING
    `, [vid, imobId, imovelId, clienteId, diasAtras, qrToken]);

    await query(`
      INSERT INTO avaliacao (visita_id, nota_localizacao, nota_preco, nota_estado, nota_tamanho, nota_conforto, interesse, comentario)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT DO NOTHING
    `, [vid, nl, np, ne, nt, nc, interesse, comentario]);
  }
  console.log('✅ 6 visitas + avaliações inseridas');

  console.log('\n🎉 Seed concluído!');
  console.log('   Login: admin@demo.com / admin123\n');
  process.exit(0);
}

seed().catch(e => { console.error('Erro:', e.message); process.exit(1); });
