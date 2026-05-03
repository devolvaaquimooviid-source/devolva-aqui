const express = require('express');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CONFIGURAÇÃO DE E-MAIL
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

// --- ROTAS DO CLIENTE ---

app.post('/orders/create', async (req, res) => {
  const { nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pedidos (nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado]
    );

    const mailOptions = {
      from: 'devolvaaquimooviid@gmail.com',
      to: email,
      subject: 'Confirmação de Pedido - Devolva Aqui',
      html: `<h1>Olá, ${nome}!</h1><p>Recebemos seu pedido do kit <strong>${produto}</strong>.</p><p>Assim que o pagamento for confirmado, prepararemos o envio!</p>`
    };
    
    transporter.sendMail(mailOptions).catch(err => console.log("Erro e-mail:", err));

    res.json({ success: true, pedidoId: result.rows[0].id });
  } catch (err) {
    console.error(err);
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
    let pedRows = pedidos.rows.map(p => `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:10px;">${p.nome}</td>
        <td style="padding:10px;">${p.produto}</td>
        <td style="padding:10px;">${p.cidade}/${p.estado}</td>
        <td style="padding:10px;">
          <input type="text" id="rastreio-${p.id}" placeholder="Rastreio" value="${p.codigo_rastreio || ''}">
          <button onclick="enviarRastreio(${p.id})">📧 Enviar</button>
        </td>
      </tr>`).join('');

    res.send(`
      <body style="background:#000;color:#fff;font-family:sans-serif;padding:20px;">
        <h1>Painel Administrativo</h1>
        <div style="margin-bottom:20px;">
            <a href="/admin/imprimir-postagem" style="background:#1DB954; color:#000; padding:10px; text-decoration:none; font-weight:bold; border-radius:5px;">🖨️ Imprimir Etiquetas de Postagem</a>
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <tr style="background:#1DB954;color:#000;"><th>Cliente</th><th>Produto</th><th>Local</th><th>Ações</th></tr>
          ${pedRows}
        </table>
        <script>
          async function enviarRastreio(id) {
            const cod = document.getElementById('rastreio-'+id).value;
            const res = await fetch('/admin/send-tracking', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({pedidoId: id, codigoRastreio: cod})
            });
            if(res.ok) alert('Rastreio enviado!');
          }
        </script>
      </body>`);
  } catch (err) { res.status(500).send("Erro ao carregar painel."); }
});

// NOVA ROTA: IMPRESSÃO DE POSTAGEM A4
app.get('/admin/imprimir-postagem', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
    let etiquetasHtml = result.rows.map(p => `
      <div style="width:95mm; height:130mm; border:2px solid #000; padding:15px; box-sizing:border-box; margin:5px; float:left; position:relative;">
        <div style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
          <img src="/logo.png" alt="Logo" style="width:40px;">
          <strong style="font-size:16px;">DEVOLVA AQUI</strong>
        </div>
        <div style="font-size:14px; line-height:1.6;">
          <strong>DESTINATÁRIO:</strong><br>
          <span style="font-size:18px; font-weight:bold;">${p.nome.toUpperCase()}</span><br>
          ${p.rua.toUpperCase()}, ${p.numero}<br>
          ${p.cep} - ${p.cidade.toUpperCase()} / ${p.estado.toUpperCase()}
        </div>
        <div style="border-top:1px dashed #666; padding-top:10px; font-size:11px; margin-top:40px;">
          <strong>REMETENTE:</strong><br>
          DEVOLVA AQUI - MOOVI ID<br>
          SERVIDAO LAMPIAO, 149 - CAMPECHE<br>
          CEP: 88063016 - FLORIANOPOLIS / SC
        </div>
      </div>
    `).join('');

    res.send(`<html><body onload="window.print()">${etiquetasHtml}</body></html>`);
  } catch (err) { res.status(500).send("Erro ao gerar etiquetas."); }
});

app.get('/auth/login', (req, res) => res.send(`<body style="background:#000;color:#fff;text-align:center;padding-top:100px;font-family:sans-serif;"><h2>Admin</h2><form action="/auth/login" method="POST"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;"><button type="submit" style="background:#1DB954;padding:10px 30px;border:none;cursor:pointer;">Acessar</button></form></body>`));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));