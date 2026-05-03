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
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
  secret: 'chave-mestra-devolva-aqui', 
  resave: false, 
  saveUninitialized: true 
}));

// --- NAVEGAÇÃO ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin-login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/register.html')));
app.get('/perfil', (req, res) => res.sendFile(path.join(__dirname, 'public/acesso_restrito.html')));

// --- OPERAÇÕES ---
app.post('/users', async (req, res) => {
  const { codigo, nome, cpf, objeto, endereco } = req.body;
  try {
    await pool.query(
      `INSERT INTO tags (codigo_tag, nome_dono, cpf_dono, objeto_identificado, endereco_entrega) VALUES ($1, $2, $3, $4, $5)`,
      [codigo, nome, cpf, objeto, endereco]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/perfil/update', async (req, res) => {
  const { email, telefone, cidade, cpf } = req.body;
  try {
    await pool.query(`UPDATE clientes SET email = $1, telefone = $2, cidade = $3 WHERE cpf = $4`, [email, telefone, cidade, cpf]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- ADMIN E ETIQUETAS ---
app.post('/auth/login', (req, res) => {
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado.');
});

app.get('/admin/imprimir-postagem', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/login');
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
    let etiquetasHtml = result.rows.map(p => `
      <div style="width:95mm; height:130mm; border:2px solid #000; padding:15px; box-sizing:border-box; margin:5px; float:left; position:relative; font-family:sans-serif;">
        <div style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:15px; font-weight:bold; font-size:16px;">DEVOLVA AQUI</div>
        <div style="font-size:14px; line-height:1.6;">
          <strong>DESTINATÁRIO:</strong><br>
          <span style="font-size:18px; font-weight:bold;">${p.nome.toUpperCase()}</span><br>
          ${p.rua.toUpperCase()}, ${p.numero}<br>
          ${p.cep} - ${p.cidade.toUpperCase()} / ${p.estado.toUpperCase()}
        </div>
        <div style="border-top:1px dashed #666; padding-top:10px; font-size:11px; margin-top:40px;">
          <strong>REMETENTE:</strong><br>
          DEVOLVA AQUI - MOOVI ID | CNPJ: 65.844.964/0001-61<br>
          SERVIDAO LAMPIAO, 149 - FLORIANOPOLIS / SC
        </div>
      </div>
    `).join('');
    res.send(`<html><body onload="window.print()">${etiquetasHtml}</body></html>`);
  } catch (err) { res.status(500).send("Erro ao gerar etiquetas."); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));