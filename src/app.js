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

app.use(express.static(path.join(__dirname, '../public')));

// HTML de Login Centralizado
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

app.post('/auth/login', (req, res) => {
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado. <a href="/auth/login">Tentar novamente</a>');
});

app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const result = await pool.query(`
      SELECT t.codigo_limpo, t.objeto_rastreado, c.nome_completo 
      FROM tags t 
      JOIN clientes c ON t.cliente_id = c.id
    `);
    let rows = result.rows.map(t => `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:10px;">${t.codigo_limpo}</td>
        <td style="padding:10px;">${t.objeto_rastreado}</td>
        <td style="padding:10px;">${t.nome_completo}</td>
      </tr>`).join('');
    res.send(`
      <body style="background:#000;color:#fff;padding:40px;font-family:sans-serif;">
        <h1>Tags Cadastradas</h1>
        <table style="width:100%;text-align:left;border-collapse:collapse;">
          <thead>
            <tr style="background:#1DB954;color:#000;">
              <th style="padding:10px;">Código</th>
              <th style="padding:10px;">Objeto</th>
              <th style="padding:10px;">Proprietário</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br><a href="/" style="color:#1DB954">Sair</a>
      </body>`);
  } catch (err) {
    res.status(500).send("Erro ao carregar dashboard.");
  }
});

app.post('/users', async (req, res) => {
  const { codigo, nome, cpf, nascimento, endereco, objeto } = req.body;
  
  try {
    // Tratamento de input conforme solicitado: aceita hífens e minúsculas, mas salva padronizado.
    const codigoFormatado = codigo.replace(/-/g, '').toUpperCase();

    const clientResult = await pool.query(
      'INSERT INTO clientes (nome_completo, cpf, data_nascimento, endereco_entrega) VALUES ($1, $2, $3, $4) RETURNING id',
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
    res.status(400).json({ error: "Erro no cadastro. Verifique se a tag ou CPF já existem." });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));