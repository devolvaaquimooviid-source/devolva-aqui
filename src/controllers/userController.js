const prisma = require('../lib/prisma');

// 🔹 CRIAR USUÁRIO (E vincular a Tag inicial)
exports.createUser = async (req, res) => {
  try {
    const { codigo, nome, email, whatsapp, cpf, nascimento, objeto, objeto_outro } = req.body;

    if (!nome || !email || !codigo) {
      return res.status(400).json({ success: false, message: 'Nome, email e código são obrigatórios' });
    }

    const objetoFinal = objeto === 'Outro' ? objeto_outro : objeto;

    // Cria ou atualiza o cliente
    const user = await prisma.user.upsert({
      where: { email },
      update: { nome, whatsapp, cpf, dataNascimento: nascimento, objeto: objetoFinal },
      create: { nome, email, whatsapp, cpf, dataNascimento: nascimento, objeto: objetoFinal }
    });

    // Atualiza a tag informada para "Ativa" e vincula ao usuário
    await prisma.tag.updateMany({
      where: { codigo: codigo },
      data: { status: 'Ativa', userId: user.id }
    });

    res.status(201).json({ success: true, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao criar usuário ou ativar tag' });
  }
};

// 🔹 ALTERAR CADASTRO (Minha Conta)
exports.updateUser = async (req, res) => {
  try {
    const { email } = req.params;
    const { nome, whatsapp, cpf, dataNascimento } = req.body;

    const user = await prisma.user.update({
      where: { email },
      data: { nome, whatsapp, cpf, dataNascimento }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro de servidor ao tentar alterar cadastro.' });
  }
};