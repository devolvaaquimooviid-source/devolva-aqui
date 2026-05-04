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
  // Recebe os dados do formulário, incluindo o novo campo "Outro"
  const { nome, cpf, nascimento, email, whatsapp, codigo, objeto, objeto_outro } = req.body;
  const objetoFinal = objeto === 'Outro' ? objeto_outro : objeto;

  try {
    // 1. Insere ou atualiza o cliente. O ON CONFLICT garante que o CPF é único.
    // O RETURNING id pega a chave desse cliente para vincular às N tags.
    const resultCliente = await pool.query(
      `INSERT INTO clientes (nome_completo, cpf, data_nascimento, email, whatsapp) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (cpf) DO UPDATE 
       SET nome_completo = EXCLUDED.nome_completo, email = EXCLUDED.email, whatsapp = EXCLUDED.whatsapp
       RETURNING id`,
      [nome, cpf, nascimento, email, whatsapp]
    );
    const clienteId = resultCliente.rows[0].id;

    // 2. Vincula a Tag ao Cliente usando o ID. Isso permite infinitas tags para o mesmo Cliente.
    const resultTag = await pool.query(
      `UPDATE tags SET cliente_id = $1, objeto_rastreado = $2, status = 'ativada', ativada_em = NOW() 
       WHERE codigo_limpo = $3 RETURNING id`,
      [clienteId, objetoFinal, codigo]
    );

    if (resultTag.rowCount === 0) {
        return res.status(400).json({ success: false, message: "Tag não encontrada ou código inválido." });
    }

    res.json({ success: true });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: "Erro no servidor. Verifique os dados e tente novamente." }); 
  }
});

app.post('/perfil/update', async (req, res) => {
  const { nome, endereco, cpf } = req.body;
  try {
    await pool.query(
      `UPDATE clientes SET nome_completo = $1, endereco_entrega = $2 WHERE cpf = $3`, 
      [nome, endereco, cpf]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- ADMIN E ETIQUETAS ---

// BLINDAGEM DO NOT FOUND: Ouve as três possíveis rotas que seu HTML pode estar chamando
app.post(['/auth/login', '/admin/login', '/login'], (req, res) => {
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.status(401).send('Acesso negado.');
});

app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'public/admin-dashboard.html'));
  } else {
    res.redirect('/login');
  }
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