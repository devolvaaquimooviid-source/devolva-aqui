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
    pass: process.env.GMAIL_PASSWORD // Configurada no Render
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

// ROTA: CHECKOUT + E-MAIL DE CONFIRMAÇÃO
app.post('/orders/create', async (req, res) => {
  const { nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado } = req.body;
  try {
    await pool.query(
      `INSERT INTO pedidos (nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [nome, email, telefone, cpf, produto, cep, rua, numero, cidade, estado]
    );

    // Envio do e-mail de confirmação
    const mailOptions = {
      from: 'devolvaaquimooviid@gmail.com',
      to: email,
      subject: 'Confirmação de Pedido - Devolva Aqui',
      html: `<h1>Olá, ${nome}!</h1><p>Recebemos seu pedido do <strong>${produto}</strong>.</p><p>Assim que o pagamento for confirmado, prepararemos o envio das suas etiquetas!</p>`
    };
    
    transporter.sendMail(mailOptions).catch(err => console.log("Erro e-mail:", err));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Erro no servidor." });
  }
});

// ROTA: ENVIAR RASTREIO (USADA PELO ADMIN)
app.post('/admin/send-tracking', async (req, res) => {
  if (!req.session.isAdmin) return res.status(401).send("Não autorizado");
  const { pedidoId, codigoRastreio } = req.body;

  try {
    const result = await pool.query('UPDATE pedidos SET codigo_rastreio = $1, status_envio = $2 WHERE id = $3 RETURNING email, nome', 
    [codigoRastreio, 'enviado', pedidoId]);

    if (result.rows.length > 0) {
      const { email, nome } = result.rows[0];
      const mailOptions = {
        from: 'devolvaaquimooviid@gmail.com',
        to: email,
        subject: 'Seu kit Devolva Aqui foi enviado!',
        html: `<h3>Boas notícias, ${nome}!</h3><p>Seu kit já está a caminho. Código de rastreio: <strong>${codigoRastreio}</strong></p>`
      };
      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ROTA: LOGIN ADMIN
app.post('/auth/login', (req, res) => {
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.senha === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Acesso negado.');
});

// DASHBOARD COM BOTÃO DE RASTREIO
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const tags = await pool.query(`SELECT t.codigo_limpo, t.objeto_rastreado, c.nome_completo FROM tags t JOIN clientes c ON t.cliente_id = c.id`);
    const pedidos = await pool.query(`SELECT * FROM pedidos ORDER BY criado_em DESC`);
    
    let pedRows = pedidos.rows.map(p => `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:10px;">${p.nome}</td>
        <td style="padding:10px;">${p.produto}</td>
        <td style="padding:10px;">
          <input type="text" id="rastreio-${p.id}" placeholder="Código" value="${p.codigo_rastreio || ''}">
          <button onclick="enviarRastreio(${p.id})">Enviar</button>
        </td>
      </tr>`).join('');

    res.send(`
      <body style="background:#000;color:#fff;font-family:sans-serif;padding:20px;">
        <h1>Painel Devolva Aqui</h1>
        <h2>Pedidos</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr style="background:#1DB954;color:#000;"><th>Cliente</th><th>Produto</th><th>Rastreio</th></tr>
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
            if(res.ok) alert('Rastreio enviado por e-mail!');
          }
        </script>
      </body>`);
  } catch (err) { res.status(500).send("Erro."); }
});

app.get('/auth/login', (req, res) => res.send(`<body style="background:#000;color:#fff;text-align:center;padding-top:100px;font-family:sans-serif;"><h2>Admin</h2><form action="/auth/login" method="POST"><input type="email" name="email" placeholder="E-mail" required style="display:block;margin:10px auto;padding:10px;"><input type="password" name="senha" placeholder="Senha" required style="display:block;margin:10px auto;padding:10px;"><button type="submit" style="background:#1DB954;padding:10px 30px;border:none;cursor:pointer;">Acessar</button></form></body>`));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));