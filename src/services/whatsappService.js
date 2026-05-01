function gerarLinkWhats(nome, telefone) {
  const texto = encodeURIComponent(
    `Olá ${nome}! 👋

Seu pedido na Devolva Aqui foi confirmado com sucesso.

📦 Estamos preparando o envio de suas tags
⏳ Prazo: 30 a 40 dias úteis

Assim que enviarmos, você receberá o código de rastreio.

Obrigado pela compra!`
  );

  return `https://wa.me/55${telefone}?text=${texto}`;
}

module.exports = { gerarLinkWhats };