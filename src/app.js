const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(session({
  secret: 'devolva-aqui-secret-123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- ARQUIVOS ESTÁTICOS ---
// Define que a pasta 'public' está na raiz (um nível acima de 'src')
app.use(express.static(path.join(__dirname, '../public')));

// --- ROTAS DE NAVEGAÇÃO ---

// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Botão "Entrar" (Login do Usuário) - Se você não tiver login_usuario.html, usaremos o acesso_restrito
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/acesso_restrito.html'));
});

// Botão "Admin"
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/acesso_restrito.html'));
});

// Dashboard Admin
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '../public/painel_controle.html'));
  } else {
    res.redirect('/auth/login');
  }
});

// --- APIS ---

app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.status(401).send('Credenciais Inválidas');
});

app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, email, objeto } = req.body;
  try {
    const novo = await prisma.user.create({
      data: {
        nome,
        email,
        whatsapp,
        tags: { create: { codigo, status: objeto } }
      }
    });
    res.status(201).json(novo);
  } catch (e) {
    res.status(400).json({ error: "Erro ao salvar no banco." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Live na porta ${PORT}`));
