const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração básica de sessão para o login do admin
app.use(session({
    secret: 'devolvaaqui-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Servir arquivos estáticos (Ajustando a rota absoluta para evitar o erro ENOENT no Render)
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// ROTAS DE PÁGINAS (FRONT-END)
// ============================
// Para o Login do Admin (que você disse que chama admin-login.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'admin-login.html'));
});

// Para o Dashboard (que você disse que chama dashboard.html)
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'dashboard.html'));
});

// Para garantir que as imagens e CSS apareçam (Pasta Public dentro da SRC)
app.use(express.static(path.join(__dirname, 'src', 'public'))); 

// ============================
// ROTAS DE API (BACK-END)
// ============================
const userController = require('./controllers/userController');
const orderController = require('./controllers/orderController');
const tagController = require('./controllers/tagController');
// const adminController = require('./controllers/adminController'); // Descomente se for usar rota gerada via JS

// Rota para cadastrar e atualizar usuário
app.post('/users', userController.createUser);
app.put('/users/:email', userController.updateUser); // Atualizar dados na Minha Conta

// Rota de pedidos (Checkout)
app.post('/api/orders', orderController.createOrder);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});