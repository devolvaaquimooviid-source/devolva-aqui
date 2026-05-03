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
app.use(session({ 
  secret: 'chave-mestra-devolva-aqui', 
  resave: false, 
  saveUninitialized: true 
}));

// Define a pasta public na raiz
app.use(express.static(path.join(__dirname, 'public')));

// ROTA: CHECKOUT
app.post('/orders/create', async (req, res) => {
  const { nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado } = req.body;
  try {
    await pool.query(
      `INSERT INTO pedidos (nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Erro no servidor." });
  }
});

// ROTA: CADASTRO DE TAG
app.post('/users', async (req, res) => {
  const { codigo, nome, cpf, nascimento, endereco, objeto } = req.body;
  try {
    const codigoFormatado = codigo.replace(/-/g, '').toUpperCase();
    const clientResult = await pool.query(
      'INSERT INTO clientes (nome_completo, cpf, data_nascimento, endereco_entrega) VALUES ($1, $2, $3, $4) ON CONFLICT (cpf) DO UPDATE SET nome_completo = EXCLUDED.nome_completo RETURNING id',
      [nome, cpf, nascimento, endereco]
    );
    const clienteId = clientResult.rows[0].id;
    await pool.query(
      'INSERT INTO tags (codigo_limpo, objeto_rastreado, cliente_id, status, ativada_em) VALUES ($1, $2, $3, $4, NOW())',
      [codigoFormatado, objeto, clienteId, 'ativo']
    );
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Erro no cadastro." });
  }
});

// ROTA: ADMIN
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
    const tags = await pool.query(`SELECT t.codigo_limpo, t.objeto_rastreado, c.nome_completo FROM tags t JOIN clientes c ON t.cliente_id = c.id`);
    const pedidos = await pool.query(`SELECT * FROM pedidos ORDER BY criado_em DESC`);
    let tagRows = tags.rows.map(t => `<tr style="border-bottom:1px solid #333;"><td style="padding:10px;">${t.codigo_limpo}</td><td style="padding:10px;">${t.objeto_rastreado}</td><td style="padding:10px;">${t.nome_completo}</td></tr>`).join('');
    let pedRows = pedidos.rows.map(p => `<tr style="border-bottom:1px solid #333;"><td style="padding:10px;">${p.nome}</td><td style="padding:10px;">${p.produto}</td><td style="padding:10px;">${p.email}</td></tr>`).join('');
    res.send(`<body style="background:#000;color:#fff;padding:40px;font-family:sans-serif;"><h1>Dashboard</h1><h2>Tags</h2><table style="width:100%;">${tagRows}</table><h2>Pedidos</h2><table style="width:100%;">${pedRows}</table></body>`);
  } catch (err) { res.status(500).send("Erro."); }
});

app.get('/auth/login', (req, res) => res.send(`<body style="background:#000;color:#fff;text-align:center;padding-top:100px;font-family:sans-serif;"><h2>Admin</h2><form action="/auth/login" method="POST"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;"><button type="submit" style="background:#1DB954;padding:10px 30px;border:none;cursor:pointer;">Acessar</button></form></body>`));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));