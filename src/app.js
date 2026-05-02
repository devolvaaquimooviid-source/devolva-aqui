const express = require('express');
const path = require('path');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'devolva-aqui-blindagem-total',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, '../public')));

// ROTA DE LOGIN - HTML SEGURO
app.get('/auth/login', function(req, res) {
  var html = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Login Admin</title></head>';
  html += '<body style="background:#000; color:#fff; font-family:Arial; text-align:center; padding-top:100px;">';
  html += '<h2 style="color:#1DB954">Área Restrita</h2>';
  html += '<form action="/auth/login" method="POST" style="display:inline-block; background:#121212; padding:30px; border-radius:15px; border:1px solid #333;">';
  html += '<input type="email" name="email" placeholder="E-mail" required style="display:block; margin:10px auto; padding:10px; width:250px;"><br>';
  html += '<input type="password" name="senha" placeholder="Senha" required style="display:block; margin:10px auto; padding:10px; width:250px;"><br>';
  html += '<button type="submit" style="background:#1DB954; border:none; padding:10px 30px; font-weight:bold; border-radius:30px; cursor:pointer;">Entrar no Painel</button>';
  html += '</form></body></html>';
  res.send(html);
});

// ROTA DO DASHBOARD - HTML SEGURO
app.get('/admin/dashboard', async function(req, res) {
  if (!req.session.isAdmin) return res.redirect('/auth/login');
  try {
    const tags = await prisma.tag.findMany({ include: { user: true } });
    var rows = '';
    tags.forEach(function(t) {
      rows += '<tr style="border-bottom: 1px solid #333;">';
      rows += '<td style="padding:10px;">' + t.codigo + '</td>';
      rows += '<td style="padding:10px;">' + (t.user ? t.user.nome : 'N/A') + '</td>';
      rows += '<td style="padding:10px;">' + (t.status || 'N/A') + '</td>';
      rows += '<td style="padding:10px;">' + (t.user ? t.user.whatsapp : 'N/A') + '</td>';
      rows += '</tr>';
    });

    var html = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Painel Admin</title></head>';
    html += '<body style="background:#000; color:#fff; font-family:Arial; padding:40px;">';
    html += '<h1 style="color:#1DB954">Tags Cadastradas</h1>';
    html += '<table style="width:100%; text-align:left; border-collapse:collapse; background:#121212;">';
    html += '<thead style="background:#1a1a1a; color:#1DB954;"><tr><th style="padding:10px;">Código</th><th style="padding:10px;">Dono</th><th style="padding:10px;">Objeto</th><th style="padding:10px;">WhatsApp</th></tr></thead>';
    html += '<tbody>' + rows + '</tbody></table>';
    html += '<br><a href="/" style="color:#1DB954">Voltar para Home</a></body></html>';
    res.send(html);
  } catch (err) {
    res.status(500).send("Erro no banco de dados.");
  }
});

app.post('/auth/login', function(req, res) {
  const { email, senha } = req.body;
  if (email === 'admin@email.com' && senha === 'admin123') {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('<h1>Credenciais Incorretas</h1><a href="/auth/login">Tentar novamente</a>');
});

app.post('/users', async function(req, res) {
  const { codigo, nome, whatsapp, email, objeto } = req.body;
  try {
    await prisma.user.create({
      data: { nome, email, whatsapp, tags: { create: { codigo, status: objeto } } }
    });
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Erro ao salvar" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, function() {
  console.log("Servidor rodando na porta " + PORT);
});
