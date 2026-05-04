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

// CADASTRO DE TAG (Permite N tags por CPF)
app.post('/users', async (req, res) => {
  const { nome, cpf, nascimento, email, whatsapp, codigo, objeto, objeto_outro } = req.body;
  const objetoFinal = (objeto === 'Outro') ? objeto_outro : objeto;

  try {
    // 1. Cria ou atualiza o dono (Cliente)
    const resCliente = await pool.query(
      `INSERT INTO clientes (nome_completo, cpf, data_nascimento, email, whatsapp) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (cpf) DO UPDATE SET nome_completo = EXCLUDED.nome_completo
       RETURNING id`,
      [nome, cpf, nascimento || null, email, whatsapp]
    );
    const clienteId = resCliente.rows[0].id;

    // 2. CRIA A TAG NO BANCO (Agora como INSERT)
    await pool.query(
      `INSERT INTO tags (codigo_limpo, cliente_id, objeto_rastreado, status, ativada_em) 
       VALUES ($1, $2, $3, 'ativada', NOW())
       ON CONFLICT (codigo_limpo) DO UPDATE SET objeto_rastreado = EXCLUDED.objeto_rastreado`,
      [codigo, clienteId, objetoFinal]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erro ao registrar tag. Verifique se o código já foi usado." });
  }
});

// --- ADMIN ---

// Rota de Login (Resolve o Not Found)
app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === process.env.ADMIN_EMAIL && senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.status(401).send('Acesso negado. Verifique email e senha no painel do Render.');
});

// Dashboard
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'public/admin-dashboard.html'));
  } else {
    res.redirect('/login');
  }
});

// Etiquetas
app.get('/admin/imprimir-postagem', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/login');
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
    let etiquetasHtml = result.rows.map(p => `
      <div style="width:95mm; height:130mm; border:2px solid #000; padding:15px; box-sizing:border-box; margin:5px; float:left; position:relative; font-family:sans-serif;">
        <div style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:15px; font-weight:bold; font-size:16px;">DEVOLVA AQUI</div>
        <div style="font-size:14px; line-height:1.6;">
          <strong>DESTINATÁRIO:</strong><br>
          <span style="font-size:18px; font-weight:bold;">${(p.nome || '').toUpperCase()}</span><br>
          ${(p.rua || '').toUpperCase()}, ${p.numero}<br>
          ${p.cep} - ${(p.cidade || '').toUpperCase()} / ${(p.estado || '').toUpperCase()}
        </div>
      </div>
    `).join('');
    res.send(`<html><body onload="window.print()">${etiquetasHtml}</body></html>`);
  } catch (err) { res.status(500).send("Erro ao gerar etiquetas."); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));