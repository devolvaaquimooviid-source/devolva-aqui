const prisma = require('../lib/prisma');

exports.createUser = async (req, res) => {
  try {
    const { nome, email, whatsapp, dataNascimento, cidade } = req.body;

    // validação simples
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        whatsapp,
        dataNascimento,
        cidade
      }
    });

    res.status(201).json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};