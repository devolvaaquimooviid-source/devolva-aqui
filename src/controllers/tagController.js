const prisma = require('../lib/prisma');
const formatCode = require('../utils/formatCode');


// ============================
// ATIVAR TAG
// ============================
exports.activateTag = async (req, res) => {
  try {
    const codigo = formatCode(req.body.codigo); // 🔥 normaliza
    const { userId } = req.body;

    if (!codigo || !userId) {
      return res.json({ error: "Código ou usuário inválido" });
    }

    const tag = await prisma.tag.updateMany({
      where: { codigo },
      data: {
        status: 'Ativa',
        userId: Number(userId)
      }
    });

    if (tag.count === 0) {
      return res.json({ error: "Tag não encontrada" });
    }

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao ativar tag" });
  }
};


// ============================
// BUSCAR TAG (PÁGINA PÚBLICA)
// ============================
exports.getTag = async (req, res) => {
  try {
    const codigo = formatCode(req.params.codigo); // 🔥 normaliza

    const tag = await prisma.tag.findFirst({
      where: {
        codigo,
        status: 'Ativa'
      },
      include: {
        user: true
      }
    });

    if (!tag) {
      return res.send(`
        <html>
        <body style="background:#000;color:#fff;font-family:Arial;text-align:center;padding:50px;">
          <h2>Tag não encontrada</h2>
          <p>Verifique o código digitado.</p>
        </body>
        </html>
      `);
    }

    const whatsapp = tag.user?.whatsapp || '';
    const linkWhats = `https://wa.me/55${whatsapp}?text=Olá,%20encontrei%20um%20objeto%20com%20sua%20tag`;

    res.send(`
      <html>
      <body style="background:#000;color:#fff;font-family:Arial;text-align:center;padding:50px;">

        <h1 style="color:#1DB954;">DEVOLVA AQUI</h1>

        <p style="margin-top:20px;">
          Você encontrou um item perdido.
        </p>

        <p style="color:#aaa;">
          Clique abaixo para falar diretamente com o proprietário.
        </p>

        <a href="${linkWhats}" 
           style="display:inline-block;margin-top:30px;padding:15px 25px;
           background:#1DB954;color:#000;border-radius:30px;text-decoration:none;font-weight:bold;">
           Falar com o dono
        </a>

      </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar tag" });
  }
};