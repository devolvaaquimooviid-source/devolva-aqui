const express = require('express');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'devolvaaquimooviid@gmail.com',
    pass: process.env.GMAIL_PASSWORD 
  }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
  secret: 'chave-mestra-devolva-aqui', 
  resave: false, 
  saveUninitialized: true 
}));

app.use(express.static(path.join(__dirname, 'public')));

// --- ROTAS DE ATIVAÇÃO DE TAG (CONEXÃO COM REGISTER.HTML) ---

app.post('/users', async (req, res) => {
  const { codigo, nome, cpf, objeto, endereco } = req.body;
  try {
    // Insere na tabela de tags ativadas (ajuste o nome da tabela se for diferente no seu DBeaver)
    await pool.query(
      `tags usuarios (codigo_tag, nome, cpf, objeto, endereco) VALUES ($1, $2, $3, $4, $5)`,
      [codigo, nome, cpf, objeto, endereco]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// --- ROTA DE ATUALIZAÇÃO DE PERFIL (MINHA CONTA) ---

app.post('/perfil/update', async (req, res) => {
  const { email, telefone, cidade, cpf } = req.body;
  try {
    // Atualiza apenas os campos permitidos usando o CPF como chave
    await pool.query(
      `UPDATE pedidos SET email = $1, telefone = $2, cidade = $3 WHERE cpf = $4`,
      [email, telefone, cidade, cpf]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// --- ROTAS DO CLIENTE (PEDIDOS) ---

app.post('/orders/create', async (req, res) => {
  const { nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pedidos (nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado]
    );
    // ... envio de email omitido para brevidade ...
    res.json({ success: true, pedidoId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// --- ROTAS ADMINISTRATIVAS ---

app.post('/auth/login', (req, res) => {
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado.');
});

app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const pedidos = await pool.query(`SELECT * FROM pedidos ORDER BY criado_em DESC`);
    // ... código do dashboard enviado anteriormente ...
    res.send(`Conteúdo do Dashboard aqui`); 
  } catch (err) { res.status(500).send("Erro ao carregar painel."); }
});

app.get('/auth/login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin-login.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));