# VisitRank Imobiliário v2

## Como rodar

### 1. Banco de dados
```bash
psql -U postgres -c "CREATE DATABASE visitrank;"
psql -U postgres -d visitrank -f database/schema.sql
psql -U postgres -d visitrank -f database/schema_v2.sql
```

### 2. Backend
```bash
cd backend
copy .env.example .env
# Edite .env com sua senha do PostgreSQL
npm install
npm run seed
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Acessos

| Perfil      | URL                        | Login              |
|-------------|----------------------------|--------------------|
| Admin       | http://localhost:5173      | admin@demo.com / admin123 |
| Corretor    | http://localhost:5173      | joao@demo.com / corretor123 |
| Cliente     | http://localhost:5173/cliente/login | Email + CPF (primeiro acesso) |

## Fluxo completo

1. **Admin/Corretor** cadastra imóveis com fotos e cômodos
2. **Corretor** vai em "Imóveis por Cliente" e libera imóveis para cada cliente
3. **Cliente** acessa `/cliente/login`, faz primeiro acesso (email + CPF → cria senha)
4. **Cliente** vê seus imóveis liberados com carrossel de fotos e avalia por cômodo
