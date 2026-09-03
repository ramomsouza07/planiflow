# 🚀 FinFlow - Guia de Hospedagem & Arquitetura (Frontend + Backend + Supabase)

Este projeto foi estruturado profissionalmente com separação clara entre **Frontend (React/Vite)** e **Backend (Node.js/Express + Prisma ORM)**, conectado diretamente ao banco de dados **PostgreSQL do Supabase** com **isolamento absoluto de dados por usuário**.

---

## 🔒 Segurança e Isolamento de Dados
- **Isolamento por Usuário (Multi-tenant):** Cada tabela (`transactions`, `categories`, `investment_assets`, `emergency_funds`) possui uma chave estrangeira obrigatória `userId` referenciando a tabela `users`.
- **Validação de Token JWT:** Todas as rotas de operações, categorias, investimentos e reserva exigem o middleware `requireAuth`. Nenhuma query ou mutação no Prisma roda sem o filtro `where: { userId: req.userId }`.
- **Criptografia de Senhas:** Senhas são protegidas com hash irreversível via `bcryptjs` (salt de 10 rounds).
- **Garantia contra Vazamento:** É impossível um usuário visualizar, alterar ou excluir dados de outro usuário.

---

## 📁 Estrutura do Projeto

```
projeto-financeiro/
├── server/                      # 🖥️ BACKEND (Node.js / Express / Prisma)
│   ├── prisma/
│   │   └── schema.prisma        # Modelos de dados e configuração do Supabase
│   ├── src/
│   │   ├── index.ts             # Servidor Express, CORS, proxy e fallback SPA
│   │   ├── prisma.ts            # Instância singleton do PrismaClient
│   │   ├── middleware/
│   │   │   └── auth.ts          # Middleware de autenticação JWT e isolamento
│   │   └── routes/
│   │       ├── auth.ts          # Registro, Login e Perfil
│   │       ├── transactions.ts  # CRUD de Entradas e Saídas isoladas
│   │       ├── categories.ts    # CRUD de Categorias do usuário
│   │       ├── investments.ts   # CRUD de Ativos e Carteira
│   │       └── emergencyFund.ts # Meta e saldo da Reserva
│   ├── tsconfig.json
│   └── .env
│
├── src/                         # 🎨 FRONTEND (React 19, Tailwind, Recharts)
│   ├── components/              # Telas (Dashboard, Operações, Planilha, Análise, Investimentos)
│   ├── context/
│   │   ├── AuthContext.tsx      # Sessão do usuário autenticada via API
│   │   └── FinanceContext.tsx   # Estado global sincronizado com Supabase via API
│   ├── services/
│   │   ├── api.ts               # Cliente HTTP com injeção automática de Bearer Token
│   │   └── financialApi.ts      # Integração com APIs externas (CDI, Selic, IPCA, Cotações)
│   └── ...
│
├── dist/                        # Build estático de produção do frontend
├── .env                         # Variáveis de ambiente locais
├── vite.config.ts               # Configuração do Vite com proxy para o backend (/api)
└── package.json                 # Scripts unificados de desenvolvimento e produção
```

---

## 🛠️ Comandos Principais

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia simultaneamente o **Backend** (porta 3001) e o **Frontend** (porta 5173) |
| `npm run build` | Compila o frontend para a pasta `dist/` e regenera o cliente Prisma |
| `npm start` | Executa o backend em modo de produção (que automaticamente serve o frontend na mesma porta) |
| `npm run prisma:push` | Sincroniza o schema do Prisma com o banco Supabase |
| `npm run prisma:studio` | Abre o painel visual do Prisma Studio no navegador |

---

## 🌐 Como Hospedar em Produção

### Opção 1: Hospedagem Tudo-em-Um (Recomendada - 1 Serviço, 1 Porta)
Ideal para plataformas como **Render**, **Railway**, **Fly.io** ou **VPS (Ubuntu/Debian)**:

1. **Suba o código para o GitHub**.
2. **Crie um novo serviço Web** (ex: no [Render.com](https://render.com) ou [Railway.app](https://railway.app)).
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`: `postgresql://postgres.dxtssqxpjglxoqzippuh:PlanilhaFinanceira2026%23%23@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
   - `DIRECT_URL`: `postgresql://postgres.dxtssqxpjglxoqzippuh:PlanilhaFinanceira2026%23%23@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
   - `JWT_SECRET`: Uma chave secreta longa para assinatura dos tokens.
   - `NODE_ENV`: `production`
4. Configure os comandos de Build e Start:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. **Pronto!** O Express servirá tanto as rotas da API (`/api/*`) quanto os arquivos do frontend (`dist/index.html`) no mesmo domínio.

---

### Opção 2: Frontend na Vercel / Netlify e Backend no Render / Railway
Caso queira separar a hospedagem:

1. **Backend (Render / Railway / Fly.io):**
   - Diretório raiz: do projeto ou subpasta `server`
   - Start Command: `npm start`
   - Copie a URL gerada (ex: `https://finflow-api.onrender.com`).
2. **Frontend (Vercel / Netlify):**
   - Adicione a variável de ambiente:
     `VITE_API_URL=https://finflow-api.onrender.com`
   - Build Command: `npm run build:client`
   - Output Directory: `dist`
