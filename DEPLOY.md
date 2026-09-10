# 🚀 Guia Completo de Publicação: Backend no Render + Frontend no Netlify

Este projeto está pronto e configurado para rodar com o **Backend no Render**, o **Frontend no Netlify** e o **Banco de Dados no Supabase PostgreSQL via Prisma ORM**, com **isolamento de dados por usuário** e sem modo visitante.

---

## 1. 📦 Subir o Projeto para o GitHub

O repositório Git local já foi inicializado e commitado na branch `main`.

Para conectar com a sua conta do GitHub:

1. Acesse [github.com/new](https://github.com/new) e crie um novo repositório (ex: `finflow-gestao-financeira`).
2. No seu terminal, vincule o repositório e envie os arquivos:
   ```bash
   git remote add origin https://github.com/RamomSouza/NOME-DO-REPOSITORIO.git
   git push -u origin main
   ```
*(O arquivo `.gitignore` já está configurado para **NUNCA** enviar suas senhas do banco de dados ao GitHub).*

---

## 2. 🖥️ Publicar o Backend no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com/) e clique em **New +** > **Web Service**.
2. Conecte o repositório que você acabou de criar no GitHub.
3. Preencha as configurações:
   - **Name:** `planiflow-backend` (ou o nome que preferir)
   - **Region:** `Oregon (US West)` *(mesma região do seu Supabase)*
   - **Branch:** `main`
   - **Root Directory:** *(deixe em branco)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run prisma:generate
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** `Free`
4. Na seção **Environment Variables**, adicione as seguintes variáveis:
   - `DATABASE_URL` = `postgresql://postgres.dxtssqxpjglxoqzippuh:PlanilhaFinanceira2026%23%23@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
   - `DIRECT_URL` = `postgresql://postgres.dxtssqxpjglxoqzippuh:PlanilhaFinanceira2026%23%23@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
   - `JWT_SECRET` = `planiflow_super_seguro_jwt_2026_isolated`
   - `NODE_ENV` = `production`
5. Clique em **Create Web Service**.
6. Aguarde o deploy concluir e copie a URL gerada pelo Render (exemplo: `https://planiflow-backend-xxxx.onrender.com`).

---

## 3. 🎨 Publicar o Frontend no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com/) e clique em **Add new site** > **Import an existing project**.
2. Escolha **GitHub** e selecione o repositório `ramomsouza07/planiflow`.
3. O Netlify detectará automaticamente o arquivo [`netlify.toml`](file:///home/ramom/Documents/planiflow/netlify.toml) incluído no projeto:
   - **Build command:** `npm run build:client`
   - **Publish directory:** `dist`
4. Clique em **Environment variables** (ou *Advanced* / *Site configuration* > *Environment variables*) e adicione:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://planiflow.onrender.com` *(ou a URL do seu serviço no Render)*
5. Clique em **Deploy site**.
6. O Netlify publicará o frontend e gerará um link público (ex: `https://planiflow.netlify.app`).

> 💡 **Atenção sobre o Render:** Se o repositório foi renomeado no GitHub (de `finflow` para `planiflow`), o webhook automático do Render pode não ter disparado. No painel do Render, vá em **Manual Deploy** e selecione **Clear build cache & deploy**.

---

## 🔒 Proteção do Banco & Isolamento de Dados
- **Sem Área de Visitante:** O modo convidado foi removido da tela de login/cadastro.
- **Isolamento por Usuário:** Cada usuário criado no Supabase possui seus próprios registros de despesas, receitas, categorias e investimentos. É impossível que um usuário acerte ou veja os dados de outro.
- **Roteamento SPA:** O arquivo [`netlify.toml`](file:///home/ramom/Documents/projeto-financeiro/netlify.toml) e [`_redirects`](file:///home/ramom/Documents/projeto-financeiro/public/_redirects) garantem que ao recarregar qualquer tela (F5) não ocorra erro 404.
