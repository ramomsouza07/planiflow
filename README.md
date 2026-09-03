# PlaniFlow | Gestão Financeira Inteligente (Fullstack)

Uma aplicação moderna de controle de gastos e receitas pessoais com visual elegante (Dark Theme estilo Fintech), gráficos interativos, simulação de investimentos com taxas em tempo real (Selic, CDI, IPCA) e banco de dados **PostgreSQL no Supabase via Prisma ORM com isolamento absoluto de dados por usuário**.

---

## ✨ Funcionalidades Principais

1. **Gestão Centralizada de Operações**:
   - Tela única para lançamento e categorização de receitas e despesas.
   - Alternância rápida de status (concluído / pendente) e método de pagamento.
   - Totais e saldo calculados automaticamente.

2. **Carteira de Investimentos & Simulador em Tempo Real**:
   - Cotações e taxas oficiais ao vivo (CDI, Selic, IPCA, Dólar, Bitcoin).
   - Cálculo automático de rendimento mensal com 1 clique.
   - Simulador interativo de juros compostos.

3. **Banco de Dados Supabase & Prisma ORM**:
   - Multi-tenancy real: cada usuário tem seu próprio painel e dados isolados.
   - Criptografia de senhas com bcryptjs e autenticação com JWT.
   - Sem modo visitante para prevenir poluição do banco.

4. **Visão Planilha & Gráficos**:
   - Edição ágil, filtros por período/tipo/categoria e exportação/importação CSV.
   - Gráficos interativos com Recharts (fluxo diário, categorias e comparativo).

---

## 🚀 Como Executar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Rodar em desenvolvimento (Frontend + Backend juntos)**:
   ```bash
   npm run dev
   ```
   - **Frontend:** `http://localhost:5173`
   - **Backend:** `http://localhost:3001`

3. **Gerar build de produção**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js, Express, Prisma ORM, JSON Web Tokens (JWT), bcryptjs
- **Banco de Dados:** PostgreSQL (Supabase)
