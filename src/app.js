const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configuração de Sessão
app.use(session({
  secret: 'devolva-aqui-secret-123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- ROTAS DE NAVEGAÇÃO (PÁGINAS) ---

// Login do Admin (Agora aponta para acesso_restrito.html)
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/acesso_restrito.html'));
});

// Dashboard do Admin (Agora aponta para painel_controle.html)
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '../public/painel_controle.html'));
  } else {
    res.redirect('/auth/login');
  }
});

// Página Inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Arquivos estáticos (Imagens, CSS) - Vem DEPOIS das rotas principais
app.use(express.static(path.join(__dirname, '../public')));

// --- ROTAS DE API (DADOS) ---

// Login Post
app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.status(401).send('Login incorreto. Tente novamente.');
  }
});

// Cadastro de Usuários/Tags
app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, cidade, email, objeto } = req.body;
  try {
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        whatsapp,
        tags: {
          create: {
            codigo: codigo,
            status: objeto || 'Ativo' 
          }
        }
      }
    });
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao cadastrar. Verifique o código." });
  }
});

// Porta do Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
