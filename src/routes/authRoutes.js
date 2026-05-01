const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');

const router = express.Router();

// Página de login
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin-login.html'));
});

// Login com senha criptografada
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const emailCorreto = 'admin@moovi.com';

  // 🔐 HASH DA SENHA (a que você gerou)
  const senhaHash = '$2b$10$HjzS3i8z4MYLUM92qxBge.CWOLxEB2bimBNrZQ/jpEgIEx037soOa';

  if (email === emailCorreto) {
    const senhaValida = await bcrypt.compare(senha, senhaHash);

    if (senhaValida) {
      req.session.admin = true;
      return res.redirect('/admin/orders');
    }
  }

  return res.status(401).send('Login inválido');
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

module.exports = router;