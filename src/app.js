const express = require('express');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'chave-mestra', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, '../public')));

// AUTO-CRIAÇÃO DE TABELAS (A mágica do Sênior)
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "User" (id SERIAL PRIMARY KEY, nome TEXT, email TEXT UNIQUE, whatsapp TEXT);
      CREATE TABLE IF NOT EXISTS "Tag" (id SERIAL PRIMARY KEY, codigo TEXT UNIQUE, status TEXT, userId INTEGER);
    `);
    console.log("Banco de dados pronto.");
  } catch (err) { console.error("Erro no banco:", err); }
}
initDB();

// FIX: PÁGINA DE LOGIN (Botão Entrar e Admin)
const loginHTML = (titulo) => `
<body style="background:#000;color:#fff;text-align:center;padding-top:100px;font-family:sans-serif;">
  <h2 style="color:#1DB954">${titulo}</h2>
  <form action="/auth/login" method="POST" style="display:inline-block;background:#121212;padding:30px;border-radius:15px;border:1px solid #333;">
    <input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;width:250px;">
    <input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;width:250px;">
    <button type="submit" style="background:#1DB954;padding:10px 30px;border:none;border-radius:30px;font-weight:bold;cursor:pointer;">Acessar</button>
  </form>
  <br><br><a href="/" style="color:#777;">Voltar</a>
</body>`;

app.get('/login.html', (req, res) => res.send(loginHTML('Login Usuário')));
app.get('/auth/login', (req, res) => res.send(loginHTML('Painel Administrativo')));

app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  const result = await pool.query('SELECT * FROM "Tag"');
  let rows = result.rows.map(t => `<tr style="border-bottom:1px solid #333;"><td style="padding:10px;">${t.codigo}</td><td style="padding:10px;">${t.status}</td></tr>`).join('');
  res.send(`<body style="background:#000;color:#fff;padding:40px;"><h1>Tags Cadastradas</h1><table style="width:100%;text-align:left;">${rows}</table><br><a href="/" style="color:#1DB954">Sair</a></body>`);
});

app.post('/auth/login', (req, res) => {
  if (req.body.email === 'admin@email.com' && req.body.senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado. <a href="/auth/login">Tentar novamente</a>');
});

app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, email, objeto } = req.body;
  try {
    const user = await pool.query('INSERT INTO "User" (nome, email, whatsapp) VALUES ($1, $2, $3) RETURNING id', [nome, email, whatsapp]);
    await pool.query('INSERT INTO "Tag" (codigo, status, userId) VALUES ($1, $2, $3)', [codigo, objeto, user.rows[0].id]);
    res.status(201).json({ success: true });
  } catch (e) { res.status(400).json({ error: "Erro no cadastro" }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.listen(process.env.PORT || 10000, () => console.log('Sênior Mode: ON'));
