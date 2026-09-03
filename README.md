# FinFlow | Controle Financeiro Mensal (React + TypeScript)

Uma aplicação moderna de controle de gastos e receitas pessoais com visual elegante (Dark Theme estilo Fintech), gráficos interativos e **dinâmica baseada em planilhas** (com linha de adição rápida, edição instantânea, filtros e exportação/importação CSV).

---

## ✨ Funcionalidades Principais

1. **Visão Planilha Inteligente**:
   - **Linha de Lançamento Rápido no topo da tabela**: adicione uma entrada ou saída em segundos digitando a descrição, categoria, valor e data.
   - **Tabela com Ordenação e Filtros**: filtre instantaneamente por tipo (*Entradas* ou *Saídas*), por situação (*Concluídos* ou *Pendentes*) e por busca de texto em tempo real.
   - **Alternância rápida de status**: marque como *Concluído* (pago/recebido) ou *Pendente* com um único clique.
   - **Rodapé com Totais Automáticos**: soma automática das entradas visíveis, saídas visíveis e saldo final.

2. **Gráficos & Análise Visual**:
   - **Fluxo Diário**: Área comparativa de entradas e saídas diárias ao longo de todos os dias do mês.
   - **Distribuição por Categorias (Donut Chart)**: gráfico de rosca interativo com percentuais de gastos por área (Moradia, Alimentação, Transporte, Lazer, etc.) e fontes de renda.
   - **Comparativo Entradas vs Saídas**: barras comparativas de receita total vs despesa total.

3. **Navegação Mensal**:
   - Seletor de mês com botões de navegação anterior/próximo.
   - Histórico preservado com dados de exemplo (ex: Agosto e Setembro).

4. **Exportação e Importação de Planilhas**:
   - **Exportar CSV**: Baixe os lançamentos filtrados para abrir no Excel, Google Sheets ou LibreOffice.
   - **Importar CSV**: Carregue arquivos `.csv` e integre suas transações automaticamente.

5. **Privacidade e Persistência**:
   - Os dados são salvos localmente via `localStorage` no seu próprio navegador, sem envio para servidores externos.

---

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Rodar em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a URL exibida no terminal (geralmente `http://localhost:5173`).

3. **Gerar build de produção**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Recharts** (Gráficos interativos)
- **Lucide React** (Ícones modernos)
- **Canvas-Confetti** (Feedback visual de celebração financeira)
