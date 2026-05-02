const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Configurações de Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configuração de Sessão
app.use(session({
  secret: 'devolva-aqui-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- ROTAS DE NAVEGAÇÃO ESPECÍFICAS (Devem vir ANTES do static) ---

// Rota para a página de Login do Admin
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Rota para o Dashboard do Admin
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  } else {
    res.redirect('/auth/login');
  }
});

// --- ARQUIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, '../public')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// --- ROTAS DE API ---

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
    res.status(400).json({ error: "Erro ao cadastrar. Código já existe." });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  // Use as credenciais que você definiu
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.status(401).send('Credenciais inválidas.');
  }
});

// Página Inicial (Home) - Captura qualquer outra rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Porta
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
