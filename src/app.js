const express = require('express');
const path = require('path');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'blindado',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, '../public')));

// ROTA ENTRAR (LOGIN USUÁRIO)
app.get('/login.html', (req, res) => {
  res.send('<body style="background:#000;color:#fff;text-align:center;padding:100px;"><h2>Login Usuário</h2><p>Em breve...</p><a href="/" style="color:#1DB954">Voltar</a></body>');
});

// LOGIN ADMIN HTML
app.get('/auth/login', (req, res) => {
  res.send('<!DOCTYPE html><html><body style="background:#000;color:#fff;text-align:center;padding:100px;"><h2>Admin</h2><form action="/auth/login" method="POST"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;"><button type="submit" style="background:#1DB954;padding:10px 20px;border:none;cursor:pointer;">Entrar</button></form></body></html>');
});

// DASHBOARD ADMIN
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const tags = await prisma.tag.findMany({ include: { user: true } });
    let linhas = tags.map(t => `<tr><td>${t.codigo}</td><td>${t.user?.nome || 'N/A'}</td><td>${t.status}</td></tr>`).join('');
    res.send(`<body style="background:#000;color:#fff;padding:40px;"><h1>Tags</h1><table border="1" style="width:100%;text-align:left;"><tr><th>Código</th><th>Dono</th><th>Objeto</th></tr>${linhas}</table><br><a href="/" style="color:#1DB954">Voltar</a></body>`);
  } catch (err) {
    res.status(500).send("Erro conexão Banco Dados");
  }
});

// API LOGIN
app.post('/auth/login', (req, res) => {
  if (req.body.email === 'admin@email.com' && req.body.senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Dados incorretos. <a href="/auth/login">Voltar</a>');
});

// API CADASTRO
app.post('/users', async (req, res) => {
  try {
    const { codigo, nome, whatsapp, email, objeto } = req.body;
    await prisma.user.create({
      data: { nome, email, whatsapp, tags: { create: { codigo, status: objeto } } }
    });
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Erro: Verifique Código/Banco" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Online'));
