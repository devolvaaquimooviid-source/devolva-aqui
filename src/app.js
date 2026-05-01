const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();

// 🔥 LOGIN FIXO (TEMPORÁRIO)
process.env.ADMIN_EMAIL = 'admin@moovi.com';
process.env.ADMIN_PASSWORD = '123456';

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// sessão
app.use(session({
  secret: 'devolva-aqui-admin',
  resave: false,
  saveUninitialized: false
}));

// ======================
// ROTAS
// ======================
const adminRoutes      = require('./routes/adminRoutes');
const authRoutes       = require('./routes/authRoutes');
const orderRoutes      = require('./routes/orderRoutes');
const tagRoutes        = require('./routes/tagRoutes');
const userRoutes       = require('./routes/userRoutes');
const labelRoutes      = require('./routes/labelRoutes');
const authMiddleware   = require('./middleware/authMiddleware');

// 🔐 ADMIN PROTEGIDO
app.use('/admin', authMiddleware, adminRoutes);

// 🧾 ETIQUETAS (IMPORTANTE: SEM /admin)
app.use('/', labelRoutes);

// resto das rotas
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/tags', tagRoutes);
app.use('/users', userRoutes);

// arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// servidor
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando 🚀 na porta ${PORT}`);
});

module.exports = app;