const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { enviarRastreio } = require('../services/emailService');

// 🔹 LISTAR PEDIDOS
exports.getOrdersPage = async (req, res) => {

  const orders = await prisma.order.findMany({
    orderBy: { id: 'desc' }
  });

  let html = `
  <html>
  <head>
    <title>Painel Admin</title>
    <style>
      body { font-family: Arial; background:#111; color:#fff; padding:20px; }
      table { width:100%; border-collapse: collapse; font-size:13px; }
      th, td { padding:8px; border-bottom:1px solid #333; }
      th { color:#1DB954; }
      button { padding:6px 10px; background:#1DB954; border:none; cursor:pointer; }
      input { padding:5px; width:100px; }
      .logout { float:right; color:#fff; }
    </style>
  </head>
  <body>

  <a class="logout" href="/auth/logout">Sair</a>

  <h1>Painel de Pedidos</h1>

  <table>
    <tr>
      <th>ID</th>
      <th>Nome</th>
      <th>Email</th>
      <th>Telefone</th>
      <th>CPF</th>
      <th>Produto</th>
      <th>Endereço</th>
      <th>Status</th>
      <th>Rastreio</th>
      <th>Ação</th>
    </tr>
  `;

  orders.forEach(o => {
    html += `
    <tr>
      <td>${o.id}</td>
      <td>${o.nome}</td>
      <td>${o.email}</td>
      <td>${o.telefone}</td>
      <td>${o.cpf || '-'}</td>
      <td>${o.produto}</td>
      <td>${o.rua}, ${o.numero} - ${o.cidade}/${o.estado}</td>
      <td>${o.status}</td>
      <td>${o.rastreio || '-'}</td>
      <td>
        <form method="POST" action="/admin/send/${o.id}">
          <input name="rastreio" placeholder="Código" required>
          <button type="submit">Enviar</button>
        </form>
      </td>
    </tr>
    `;
  });

  html += `</table></body></html>`;

  res.send(html);
};

// 🔹 MARCAR COMO ENVIADO + EMAIL
exports.sendOrder = async (req, res) => {

  const id = Number(req.params.id);
  const { rastreio } = req.body;

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: 'enviado',
      rastreio
    }
  });

  // 📧 envia email automático
  await enviarRastreio(order.email, order.nome, rastreio);

  res.redirect('/admin/orders');
};