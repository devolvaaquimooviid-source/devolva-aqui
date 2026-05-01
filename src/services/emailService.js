const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'devolvaaquimooviid@gmail.com',
    pass: 'bojc pojd uieg vowo'
  }
});

exports.enviarEmailPedido = async (nome, email) => {
  await transporter.sendMail({
    from: '"Devolva Aqui" <devolvaaquimooviid@gmail.com>',
    to: email,
    subject: 'Pedido recebido - Devolva Aqui',
    html: `
      <h2>Pedido confirmado, ${nome}!</h2>
      <p>Recebemos seu pedido com sucesso.</p>
      <p>Assim que o envio for realizado, você receberá o código de rastreio.</p>
      <br>
      <p><b>Equipe Devolva Aqui</b></p>
    `
  });
};exports.enviarRastreio = async (email, nome, codigo) => {

  try {

    await transporter.sendMail({
      from: '"Devolva Aqui" <devolvaaquimooviid@gmail.com>',
      to: email,
      subject: 'Seu pedido foi enviado 🚚',
      html: `
        <h2>Olá ${nome}!</h2>
        <p>Seu pedido foi enviado.</p>
        <p><b>Código de rastreio:</b> ${codigo}</p>
        <p>Acompanhe pelo site dos Correios.</p>
      `
    });

    console.log("📦 Rastreio enviado por email");

  } catch (err) {
    console.log("Erro ao enviar rastreio:", err.message);
  }

};