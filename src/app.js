const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();

// Configurações de Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configuração de Sessão para o Admin
app.use(session({
  secret: 'devolva-aqui-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Em produção com HTTPS, o Render lida com isso
}));

// Servir arquivos estáticos (CSS, JS frontal, Imagens)
// Assume-se que suas pastas 'public', 'img', etc, estão na raiz do projeto
app.use(express.static(path.join(__dirname, '../public')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// --- ROTAS DE NAVEGAÇÃO (ENTREGA DE PÁGINAS) ---

// Página Inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Página de Cadastro de Tag
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

// Página de Login (Geral/Admin)
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// --- LÓGICA DE LOGIN DO ADMIN ---

app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;

  // LOGIN FIXO (Ajuste com suas credenciais reais)
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.status(401).send('Credenciais inválidas. Volte e tente novamente.');
  }
});

// Dashboard do Admin (Protegido por sessão)
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  } else {
    res.redirect('/auth/login');
  }
});

// Rota de Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Porta dinâmica para o Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
