const prisma = require('../lib/prisma');
const { enviarEmailPedido } = require('../services/emailService');

exports.createOrder = async (req, res) => {
  try {

    const {
      nome,
      email,
      telefone,
      produto,
      cep,
      rua,
      numero,
      cidade,
      estado
    } = req.body;

    // 🔥 validação mínima (evita quebrar banco)
    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const order = await prisma.order.create({
      data: {
        nome,
        email,
        telefone: telefone, // ✅ AGORA CORRETO
        produto,
        cep,
        rua,
        numero,
        cidade,
        estado,
        status: 'pendente'
      }
    });

    // 📧 envio de email (sem quebrar sistema)
    try {
      await enviarEmailPedido(nome, email);
    } catch (err) {
      console.log("Erro email:", err.message);
    }

    res.json({ success: true });

  } catch (error) {
    console.error("ERRO GERAL:", error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};