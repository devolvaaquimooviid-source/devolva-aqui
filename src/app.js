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
app.use(session({ secret: 'blindado', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, '../public')));

// --- FUNÇÃO PARA CRIAR TABELAS AUTOMATICAMENTE ---
async function criarTabelas() {
  const query = `
    CREATE TABLE IF NOT EXISTS "User" (id SERIAL PRIMARY KEY, nome TEXT, email TEXT UNIQUE, whatsapp TEXT);
    CREATE TABLE IF NOT EXISTS "Tag" (id SERIAL PRIMARY KEY, codigo TEXT UNIQUE, status TEXT, "userId" INTEGER);
  `;
  try {
    await pool.query(query);
    console.log("Tabelas verificadas/criadas com sucesso.");
  } catch (err) {
    console.error("Erro ao criar tabelas:", err);
  }
}
criarTabelas();

// --- ROTAS ---
const loginHTML = '<body style="background:#000;color:#fff;text-align:center;padding:100px;font-family:Arial;"><h2 style="color:#1DB954">Acesso</h2><form action="/auth/login" method="POST" style="display:inline-block;background:#121212;padding:30px;border-radius:15px;"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;width:250px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;width:250px;"><button type="submit" style="background:#1DB954;padding:10px 30px;border:none;border-radius:30px;font-weight:bold;cursor:pointer;">Entrar</button></form><br><br><a href="/" style="color:#777;">Voltar</a></body>';

app.get('/login.html', (req, res) => res.send(loginHTML));
app.get('/auth/login', (req, res) => res.send(loginHTML));

app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const result = await pool.query('SELECT * FROM "Tag"');
    let rows = result.rows.map(t => `<tr><td>${t.codigo}</td><td>${t.status}</td></tr>`).join('');
    res.send(`<body style="background:#000;color:#fff;padding:40px;"><h1>Tags</h1><table border="1" style="width:100%">${rows}</table><br><a href="/">Home</a></body>`);
  } catch (err) { res.send("Erro ao ler banco."); }
});

app.post('/auth/login', (req, res) => {
  if (req.body.email === 'admin@email.com' && req.body.senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Erro login.');
});

app.post('/users', async (req, res) => {
  const { codigo, nome, whatsapp, email, objeto } = req.body;
  try {
    await pool.query('INSERT INTO "User" (nome, email, whatsapp) VALUES ($1, $2, $3)', [nome, email, whatsapp]);
    await pool.query('INSERT INTO "Tag" (codigo, status) VALUES ($1, $2)', [codigo, objeto]);
    res.status(201).json({ success: true });
  } catch (e) { res.status(400).json({ error: "Erro" }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Servidor Online'));
