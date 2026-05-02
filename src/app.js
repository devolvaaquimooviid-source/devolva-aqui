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

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// --- ROTAS DE NAVEGAÇÃO ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// --- ROTA DE CADASTRO (API) ---

app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, cidade, email, objeto } = req.body;

  try {
    // Salva o usuário e a tag vinculada no banco de dados
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        whatsapp,
        // Aqui assumimos que você quer salvar a cidade ou objeto em algum campo.
        // Como seu schema original não tinha 'objeto', vamos salvar 'status' como o nome do objeto por enquanto para não quebrar o banco.
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
    console.error(error);
    res.status(400).json({ error: "Erro ao cadastrar tag ou código já existente." });
  }
});

// --- LÓGICA DE LOGIN DO ADMIN ---

app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.status(401).send('Credenciais inválidas.');
  }
});

app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  } else {
    res.redirect('/auth/login');
  }
});

// Porta
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
