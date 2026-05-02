const express = require('express');
const path = require('path');
const session = require('express-session');
const { PrismaClient } = require('./generated/client'); // CAMINHO NOVO

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'blindado-v3',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/login.html', (req, res) => {
  res.send('<body style="background:#000;color:#fff;text-align:center;padding:100px;"><h2>Login</h2><p>Página em manutenção</p><a href="/" style="color:#1DB954">Voltar</a></body>');
});

app.get('/auth/login', (req, res) => {
  res.send('<!DOCTYPE html><html><body style="background:#000;color:#fff;text-align:center;padding:100px;"><h2>Admin</h2><form action="/auth/login" method="POST"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;"><button type="submit" style="background:#1DB954;padding:10px 20px;border:none;cursor:pointer;">Entrar</button></form></body></html>');
});

app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const tags = await prisma.tag.findMany({ include: { user: true } });
    let linhas = tags.map(t => `<tr><td>${t.codigo}</td><td>${t.user?.nome || 'N/A'}</td><td>${t.status}</td></tr>`).join('');
    res.send(`<body style="background:#000;color:#fff;padding:40px;"><h1>Tags</h1><table border="1" style="width:100%;text-align:left;"><tr><th>Código</th><th>Dono</th><th>Objeto</th></tr>${linhas}</table><br><a href="/" style="color:#1DB954">Voltar</a></body>`);
  } catch (err) {
    res.status(500).send("Erro no Banco de Dados");
  }
});

app.post('/auth/login', (req, res) => {
  if (req.body.email === 'admin@email.com' && req.body.senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado.');
});

app.post('/users', async (req, res) => {
  try {
    const { codigo, nome, whatsapp, email, objeto } = req.body;
    await prisma.user.create({
      data: { nome, email, whatsapp, tags: { create: { codigo, status: objeto } } }
    });
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Erro de Cadastro" });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Servidor Online'));
