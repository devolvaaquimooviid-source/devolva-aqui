const express = require('express');
const path = require('path');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'devolva-aqui-segredo-blindado',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- ARQUIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, '../public')));

// --- ROTA DE LOGIN (HTML GERADO PELO SERVIDOR) ---
app.get('/auth/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head><meta charset="UTF-8"><title>Login Admin</title></head>
    <body style="background:#000; color:#fff; font-family:Arial; text-align:center; padding-top:100px;">
      <h2 style="color:#1DB954">Área Restrita</h2>
      <form action="/auth/login" method="POST" style="display:inline-block; background:#121212; padding:30px; border-radius:15px; border:1px solid #333;">
        <input type="email" name="email" placeholder="E-mail" required style="display:block; margin:10px auto; padding:10px; width:250px;"><br>
        <input type="password" name="senha" placeholder="Senha" required style="display:block; margin:10px auto; padding:10px; width:250px;"><br>
        <button type="submit" style="background:#1DB954; border:none; padding:10px 30px; font-weight:bold; border-radius:30px; cursor:pointer;">Entrar no Painel</button>
      </form>
    </body>
    </html>
  `);
});

// --- ROTA DO DASHBOARD (HTML GERADO PELO SERVIDOR COM DADOS DO BANCO) ---
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  
  try {
    const tags = await prisma.tag.findMany({ include: { user: true } });
    const listaTags = tags.map(t => `
      <tr style="border-bottom: 1px solid #333;">
        <td style="padding:10px;">${t.codigo}</td>
        <td style="padding:10px;">${t.user?.nome || 'N/A'}</td>
        <td style="padding:10px;">${t.status || 'N/A'}</td>
        <td style="padding:10px;">${t.user?.whatsapp || 'N/A'}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head><meta charset="UTF-8"><title>Painel Admin</title></head>
      <body style="background:#000; color:#fff; font-family:Arial; padding:40px;">
        <h1 style="color:#1DB954">Tags Cadastradas</h1>
        <table style="width:100%; text-align:left; border-collapse:collapse; background:#121212;">
          <thead style="background:#1a1a1a; color:#1DB954;">
            <tr><th style="padding:10px;">Código</th><th style="padding:10px;">Dono</th><th style="padding:10px;">Objeto</th><th style="padding:10px;">WhatsApp</th></tr>
          </thead>
          <tbody>${listaTags}</tbody>
        </table>
        <br><a href="/" style="color:#1DB954">Voltar para Home</a>
      </body>
      </html>
    `);
  } catch (err) {
    res.send("Erro ao carregar dados do banco.");
  }
});

// --- PROCESSAMENTO DE LOGIN ---
app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('<h1>Credenciais Incorretas</h1><a href="/auth/login">Tentar novamente</a>');
});

// --- API DE CADASTRO ---
app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, email, objeto } = req.body;
  try {
    await prisma.user.create({
      data: { nome, email, whatsapp, tags: { create: { codigo, status: objeto } } }
    });
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Erro ao salvar" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(\`Servidor iniciado na porta \${PORT}\`));
